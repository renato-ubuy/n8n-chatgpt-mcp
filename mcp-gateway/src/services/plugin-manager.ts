import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as semver from 'semver';
import { MCPPlugin, PluginMetadata, PluginConfig, PluginInstallResult, PluginValidationResult } from '../types/plugin';

const execAsync = promisify(exec);

export interface PluginManagerConfig {
  pluginDirectory: string;
  registryUrl: string;
  enableHotReload: boolean;
  securityScanEnabled: boolean;
  maxPluginSize: number; // in bytes
}

export class PluginManager extends EventEmitter {
  private plugins: Map<string, MCPPlugin> = new Map();
  private pluginMetadata: Map<string, PluginMetadata> = new Map();
  private config: PluginManagerConfig;
  private watchers: Map<string, any> = new Map();

  constructor(config?: Partial<PluginManagerConfig>) {
    super();
    
    this.config = {
      pluginDirectory: config?.pluginDirectory || './plugins',
      registryUrl: config?.registryUrl || 'https://registry.right-api.com',
      enableHotReload: config?.enableHotReload || process.env.NODE_ENV === 'development',
      securityScanEnabled: config?.securityScanEnabled || true,
      maxPluginSize: config?.maxPluginSize || 50 * 1024 * 1024 // 50MB
    };

    this.initializePluginDirectory();
  }

  private async initializePluginDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.pluginDirectory, { recursive: true });
      await this.loadInstalledPlugins();
    } catch (error) {
      console.error('Failed to initialize plugin directory:', error);
    }
  }

  // Plugin Discovery and Installation
  async searchPlugins(query: string, filters?: {
    category?: string;
    author?: string;
    tags?: string[];
  }): Promise<PluginMetadata[]> {
    try {
      const searchParams = new URLSearchParams({
        q: query,
        ...(filters?.category && { category: filters.category }),
        ...(filters?.author && { author: filters.author }),
        ...(filters?.tags && { tags: filters.tags.join(',') })
      });

      const response = await fetch(`${this.config.registryUrl}/search?${searchParams}`);
      const results = await response.json();

      return results.plugins || [];
    } catch (error) {
      console.error('Plugin search failed:', error);
      return [];
    }
  }

  async installPlugin(
    packageName: string,
    version?: string,
    config?: PluginConfig
  ): Promise<PluginInstallResult> {
    const installId = uuidv4();
    
    try {
      this.emit('plugin:install:started', { packageName, version, installId });

      // 1. Validate package name and version
      const validationResult = await this.validatePlugin(packageName, version);
      if (!validationResult.valid) {
        throw new Error(`Plugin validation failed: ${validationResult.errors.join(', ')}`);
      }

      // 2. Check if already installed
      const existingPlugin = this.getPluginByPackageName(packageName);
      if (existingPlugin) {
        if (!version || semver.eq(existingPlugin.metadata.version, version)) {
          throw new Error(`Plugin ${packageName} is already installed`);
        }
      }

      // 3. Download and install via npm
      const installResult = await this.npmInstall(packageName, version);
      
      // 4. Load plugin metadata
      const metadata = await this.loadPluginMetadata(packageName, installResult.installedVersion);
      
      // 5. Security scan
      if (this.config.securityScanEnabled) {
        const securityResult = await this.scanPluginSecurity(metadata);
        if (!securityResult.safe) {
          await this.uninstallPlugin(metadata.id);
          throw new Error(`Security scan failed: ${securityResult.issues.join(', ')}`);
        }
      }

      // 6. Load and initialize plugin
      const plugin = await this.loadPlugin(metadata, config);
      
      // 7. Register plugin
      this.plugins.set(plugin.id, plugin);
      this.pluginMetadata.set(plugin.id, metadata);

      // 8. Setup hot reload if enabled
      if (this.config.enableHotReload) {
        await this.setupHotReload(plugin.id, metadata.path);
      }

      const result: PluginInstallResult = {
        success: true,
        plugin: {
          id: plugin.id,
          name: metadata.name,
          version: metadata.version,
          packageName: metadata.packageName
        },
        installId,
        installedAt: new Date()
      };

      this.emit('plugin:installed', result);
      return result;

    } catch (error) {
      const result: PluginInstallResult = {
        success: false,
        error: error.message,
        installId
      };

      this.emit('plugin:install:failed', result);
      throw error;
    }
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    const metadata = this.pluginMetadata.get(pluginId);
    
    if (!plugin || !metadata) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    try {
      // 1. Cleanup plugin
      await plugin.cleanup();
      
      // 2. Remove hot reload watcher
      const watcher = this.watchers.get(pluginId);
      if (watcher) {
        watcher.close();
        this.watchers.delete(pluginId);
      }
      
      // 3. Uninstall npm package
      await this.npmUninstall(metadata.packageName);
      
      // 4. Remove from registry
      this.plugins.delete(pluginId);
      this.pluginMetadata.delete(pluginId);

      this.emit('plugin:uninstalled', { pluginId, packageName: metadata.packageName });

    } catch (error) {
      console.error(`Failed to uninstall plugin ${pluginId}:`, error);
      throw error;
    }
  }

  async updatePlugin(pluginId: string, version?: string): Promise<PluginInstallResult> {
    const metadata = this.pluginMetadata.get(pluginId);
    if (!metadata) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // Uninstall current version
    await this.uninstallPlugin(pluginId);
    
    // Install new version
    return await this.installPlugin(metadata.packageName, version);
  }

  // Plugin Loading and Management
  private async loadInstalledPlugins(): Promise<void> {
    try {
      const packageJsonPath = path.join(this.config.pluginDirectory, 'package.json');
      
      if (await this.fileExists(packageJsonPath)) {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

        for (const [packageName, version] of Object.entries(dependencies)) {
          if (packageName.startsWith('@right-api/') || packageName.includes('mcp-plugin')) {
            try {
              const metadata = await this.loadPluginMetadata(packageName, version as string);
              const plugin = await this.loadPlugin(metadata);
              
              this.plugins.set(plugin.id, plugin);
              this.pluginMetadata.set(plugin.id, metadata);
              
              console.log(`Loaded plugin: ${metadata.name} v${metadata.version}`);
            } catch (error) {
              console.error(`Failed to load plugin ${packageName}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load installed plugins:', error);
    }
  }

  private async loadPlugin(metadata: PluginMetadata, config?: PluginConfig): Promise<MCPPlugin> {
    try {
      // Dynamically import the plugin
      const pluginModule = await import(metadata.path);
      const PluginClass = pluginModule.default || pluginModule[metadata.className];
      
      if (!PluginClass) {
        throw new Error(`Plugin class not found in ${metadata.path}`);
      }

      // Create plugin instance
      const plugin = new PluginClass();
      
      // Validate plugin implements required interface
      if (!this.validatePluginInterface(plugin)) {
        throw new Error(`Plugin ${metadata.name} does not implement required MCPPlugin interface`);
      }

      // Initialize plugin with config
      if (config) {
        await plugin.initialize(config);
      }

      plugin.metadata = metadata;
      return plugin;

    } catch (error) {
      console.error(`Failed to load plugin ${metadata.name}:`, error);
      throw error;
    }
  }

  private async loadPluginMetadata(packageName: string, version: string): Promise<PluginMetadata> {
    const pluginPath = path.join(this.config.pluginDirectory, 'node_modules', packageName);
    const packageJsonPath = path.join(pluginPath, 'package.json');
    
    if (!await this.fileExists(packageJsonPath)) {
      throw new Error(`Plugin package.json not found: ${packageJsonPath}`);
    }

    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    
    return {
      id: packageJson.mcpPlugin?.id || packageName.replace(/[@\/]/g, '-'),
      name: packageJson.mcpPlugin?.name || packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      author: packageJson.author,
      license: packageJson.license,
      packageName,
      path: path.join(pluginPath, packageJson.main || 'index.js'),
      className: packageJson.mcpPlugin?.className || 'default',
      capabilities: packageJson.mcpPlugin?.capabilities || [],
      category: packageJson.mcpPlugin?.category || 'general',
      tags: packageJson.mcpPlugin?.tags || [],
      homepage: packageJson.homepage,
      repository: packageJson.repository,
      bugs: packageJson.bugs,
      installSize: await this.getDirectorySize(pluginPath),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // NPM Operations
  private async npmInstall(packageName: string, version?: string): Promise<{ installedVersion: string }> {
    const targetPackage = version ? `${packageName}@${version}` : packageName;
    
    try {
      const { stdout, stderr } = await execAsync(
        `npm install ${targetPackage} --prefix ${this.config.pluginDirectory} --save`,
        { cwd: this.config.pluginDirectory }
      );

      // Parse installed version from npm output
      const versionMatch = stdout.match(new RegExp(`${packageName}@([\\d\\.]+)`));
      const installedVersion = versionMatch ? versionMatch[1] : version || 'latest';

      return { installedVersion };
    } catch (error) {
      throw new Error(`NPM install failed: ${error.message}`);
    }
  }

  private async npmUninstall(packageName: string): Promise<void> {
    try {
      await execAsync(
        `npm uninstall ${packageName} --prefix ${this.config.pluginDirectory}`,
        { cwd: this.config.pluginDirectory }
      );
    } catch (error) {
      throw new Error(`NPM uninstall failed: ${error.message}`);
    }
  }

  // Plugin Validation and Security
  private async validatePlugin(packageName: string, version?: string): Promise<PluginValidationResult> {
    const errors: string[] = [];
    
    // Validate package name format
    if (!packageName || !packageName.match(/^[@a-z0-9-~][a-z0-9-._~]*\/[a-z0-9-._~]*$|^[a-z0-9-~][a-z0-9-._~]*$/)) {
      errors.push('Invalid package name format');
    }

    // Validate version if provided
    if (version && !semver.valid(version)) {
      errors.push('Invalid version format');
    }

    // Check registry for package existence
    try {
      const registryResponse = await fetch(`${this.config.registryUrl}/packages/${packageName}`);
      if (!registryResponse.ok) {
        errors.push('Package not found in registry');
      }
    } catch (error) {
      errors.push('Failed to verify package in registry');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private async scanPluginSecurity(metadata: PluginMetadata): Promise<{ safe: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Check file size
      if (metadata.installSize > this.config.maxPluginSize) {
        issues.push(`Plugin size exceeds limit: ${metadata.installSize} > ${this.config.maxPluginSize}`);
      }

      // Check for suspicious file patterns
      const pluginFiles = await this.getPluginFiles(path.dirname(metadata.path));
      for (const file of pluginFiles) {
        if (file.endsWith('.exe') || file.endsWith('.bat') || file.endsWith('.sh')) {
          issues.push(`Suspicious executable file: ${file}`);
        }
      }

      // TODO: Add more security scans
      // - Dependency vulnerability scan
      // - Code pattern analysis
      // - Network access validation

    } catch (error) {
      issues.push(`Security scan failed: ${error.message}`);
    }

    return {
      safe: issues.length === 0,
      issues
    };
  }

  private validatePluginInterface(plugin: any): boolean {
    const requiredMethods = ['initialize', 'getTools', 'executeTool', 'cleanup'];
    const requiredProperties = ['id', 'name', 'version'];
    
    for (const method of requiredMethods) {
      if (typeof plugin[method] !== 'function') {
        return false;
      }
    }
    
    for (const prop of requiredProperties) {
      if (!plugin[prop]) {
        return false;
      }
    }
    
    return true;
  }

  // Hot Reload
  private async setupHotReload(pluginId: string, pluginPath: string): Promise<void> {
    if (!this.config.enableHotReload) return;

    try {
      const chokidar = await import('chokidar');
      const watcher = chokidar.watch(path.dirname(pluginPath), {
        ignored: /node_modules|\.git/,
        persistent: true
      });

      watcher.on('change', async (changedPath) => {
        try {
          console.log(`Plugin file changed: ${changedPath}, reloading plugin ${pluginId}`);
          
          // Clear require cache
          delete require.cache[require.resolve(pluginPath)];
          
          // Reload plugin
          const metadata = this.pluginMetadata.get(pluginId);
          if (metadata) {
            const oldPlugin = this.plugins.get(pluginId);
            if (oldPlugin) {
              await oldPlugin.cleanup();
            }
            
            const newPlugin = await this.loadPlugin(metadata);
            this.plugins.set(pluginId, newPlugin);
            
            this.emit('plugin:reloaded', { pluginId, path: changedPath });
          }
        } catch (error) {
          console.error(`Failed to reload plugin ${pluginId}:`, error);
          this.emit('plugin:reload:failed', { pluginId, error: error.message });
        }
      });

      this.watchers.set(pluginId, watcher);
    } catch (error) {
      console.error(`Failed to setup hot reload for plugin ${pluginId}:`, error);
    }
  }

  // Utility Methods
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
    
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const file of files) {
        const filePath = path.join(dirPath, file.name);
        
        if (file.isDirectory()) {
          totalSize += await this.getDirectorySize(filePath);
        } else {
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        }
      }
    } catch (error) {
      console.error(`Failed to calculate directory size: ${dirPath}`, error);
    }
    
    return totalSize;
  }

  private async getPluginFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const dirFiles = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const file of dirFiles) {
        const filePath = path.join(dirPath, file.name);
        
        if (file.isDirectory() && file.name !== 'node_modules') {
          files.push(...await this.getPluginFiles(filePath));
        } else {
          files.push(filePath);
        }
      }
    } catch (error) {
      console.error(`Failed to read plugin files: ${dirPath}`, error);
    }
    
    return files;
  }

  private getPluginByPackageName(packageName: string): MCPPlugin | undefined {
    for (const [id, metadata] of this.pluginMetadata.entries()) {
      if (metadata.packageName === packageName) {
        return this.plugins.get(id);
      }
    }
    return undefined;
  }

  // Public API
  getPlugin(pluginId: string): MCPPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  getInstalledPlugins(): Array<{ plugin: MCPPlugin; metadata: PluginMetadata }> {
    const result: Array<{ plugin: MCPPlugin; metadata: PluginMetadata }> = [];
    
    for (const [id, plugin] of this.plugins.entries()) {
      const metadata = this.pluginMetadata.get(id);
      if (metadata) {
        result.push({ plugin, metadata });
      }
    }
    
    return result;
  }

  async listAvailablePlugins(): Promise<PluginMetadata[]> {
    try {
      const response = await fetch(`${this.config.registryUrl}/plugins`);
      const data = await response.json();
      return data.plugins || [];
    } catch (error) {
      console.error('Failed to list available plugins:', error);
      return [];
    }
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    categories: Record<string, number>;
    totalSize: number;
  }> {
    const plugins = this.getInstalledPlugins();
    const categories: Record<string, number> = {};
    let totalSize = 0;

    for (const { metadata } of plugins) {
      categories[metadata.category] = (categories[metadata.category] || 0) + 1;
      totalSize += metadata.installSize;
    }

    return {
      total: plugins.length,
      active: plugins.length, // All loaded plugins are considered active
      categories,
      totalSize
    };
  }

  async destroy(): Promise<void> {
    // Cleanup all plugins
    for (const plugin of this.plugins.values()) {
      try {
        await plugin.cleanup();
      } catch (error) {
        console.error('Failed to cleanup plugin:', error);
      }
    }

    // Close all watchers
    for (const watcher of this.watchers.values()) {
      try {
        watcher.close();
      } catch (error) {
        console.error('Failed to close watcher:', error);
      }
    }

    this.plugins.clear();
    this.pluginMetadata.clear();
    this.watchers.clear();
  }
}