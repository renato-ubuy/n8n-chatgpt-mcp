import { EventEmitter } from 'events';
import { MCPPlugin, PluginMetadata, PluginConfig, PluginInstallResult } from '../types/plugin';
export interface PluginManagerConfig {
    pluginDirectory: string;
    registryUrl: string;
    enableHotReload: boolean;
    securityScanEnabled: boolean;
    maxPluginSize: number;
}
export declare class PluginManager extends EventEmitter {
    private plugins;
    private pluginMetadata;
    private config;
    private watchers;
    constructor(config?: Partial<PluginManagerConfig>);
    private initializePluginDirectory;
    searchPlugins(query: string, filters?: {
        category?: string;
        author?: string;
        tags?: string[];
    }): Promise<PluginMetadata[]>;
    installPlugin(packageName: string, version?: string, config?: PluginConfig): Promise<PluginInstallResult>;
    uninstallPlugin(pluginId: string): Promise<void>;
    updatePlugin(pluginId: string, version?: string): Promise<PluginInstallResult>;
    private loadInstalledPlugins;
    private loadPlugin;
    private loadPluginMetadata;
    private npmInstall;
    private npmUninstall;
    private validatePlugin;
    private scanPluginSecurity;
    private validatePluginInterface;
    private setupHotReload;
    private fileExists;
    private getDirectorySize;
    private getPluginFiles;
    private getPluginByPackageName;
    getPlugin(pluginId: string): MCPPlugin | undefined;
    getInstalledPlugins(): Array<{
        plugin: MCPPlugin;
        metadata: PluginMetadata;
    }>;
    listAvailablePlugins(): Promise<PluginMetadata[]>;
    getStats(): Promise<{
        total: number;
        active: number;
        categories: Record<string, number>;
        totalSize: number;
    }>;
    destroy(): Promise<void>;
}
//# sourceMappingURL=plugin-manager.d.ts.map