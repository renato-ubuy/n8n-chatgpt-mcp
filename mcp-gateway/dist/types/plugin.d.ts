export interface PluginMetadata {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    license: string;
    packageName: string;
    path: string;
    className: string;
    capabilities: string[];
    category: string;
    tags: string[];
    homepage?: string;
    repository?: {
        type: string;
        url: string;
    };
    bugs?: {
        url: string;
    };
    installSize: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface PluginConfig {
    category: 'automation' | 'communication' | 'productivity' | 'dev-tools' | 'database' | 'workflow' | 'custom';
    icon?: string;
    documentation?: string;
    homepage?: string;
    repository?: string;
    version?: string;
}
export interface PluginInstallResult {
    success: boolean;
    plugin?: MCPPlugin;
    error?: string;
}
export interface PluginValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export interface MCPPlugin {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    license: string;
    main: string;
    config: PluginConfig;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    keywords?: string[];
    enabled: boolean;
    loadedAt?: Date;
    instance?: any;
    cleanup?: () => Promise<void>;
}
export interface PluginManifest {
    name: string;
    version: string;
    description: string;
    main: string;
    author: string;
    license: string;
    keywords: string[];
    mcpGateway: {
        category: string;
        backend: {
            type: string;
            authMethods: string[];
            capabilities: string[];
        };
        dependencies?: string[];
    };
}
export interface PluginRegistry {
    plugins: Map<string, MCPPlugin>;
    installed: Map<string, InstalledPlugin>;
    available: Map<string, PluginPackage>;
}
export interface InstalledPlugin {
    plugin: MCPPlugin;
    installedAt: Date;
    version: string;
    enabled: boolean;
    config?: any;
}
export interface PluginPackage {
    name: string;
    version: string;
    description: string;
    downloads: number;
    rating: number;
    tags: string[];
    verified: boolean;
    author: {
        name: string;
        email?: string;
        url?: string;
    };
    repository?: {
        type: string;
        url: string;
    };
    lastModified: Date;
}
export interface WorkflowDefinition {
    id: string;
    name: string;
    description?: string;
    version: string;
    nodes: WorkflowNode[];
    connections: WorkflowConnection[];
    settings: {
        concurrent: boolean;
        timeout: number;
        retries: number;
        errorHandling: 'stop' | 'continue' | 'retry';
    };
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    author?: string;
}
export interface WorkflowNode {
    id: string;
    type: 'trigger' | 'action' | 'condition' | 'transform' | 'output';
    backendId: string;
    toolName: string;
    position: {
        x: number;
        y: number;
    };
    config: {
        parameters: Record<string, any>;
        mapping?: Record<string, string>;
    };
    name: string;
    description?: string;
    enabled: boolean;
}
export interface WorkflowConnection {
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    sourcePort?: string;
    targetPort?: string;
    condition?: {
        type: 'success' | 'error' | 'custom';
        expression?: string;
    };
}
export interface TestingSession {
    id: string;
    name: string;
    backendId: string;
    toolName: string;
    testCases: TestCase[];
    environment: 'development' | 'staging' | 'production';
    results: TestResult[];
    lastRun?: Date;
    status: 'pending' | 'running' | 'passed' | 'failed';
}
export interface TestCase {
    id: string;
    name: string;
    description?: string;
    input: any;
    expectedOutput?: any;
    assertions: TestAssertion[];
}
export interface TestAssertion {
    type: 'equals' | 'contains' | 'matches' | 'custom';
    field: string;
    value: any;
    operator?: string;
}
export interface TestResult {
    testCaseId: string;
    status: 'passed' | 'failed' | 'skipped';
    output: any;
    error?: string;
    duration: number;
    timestamp: Date;
}
export interface MCPBackendFactory {
    create(config: MCPBackendConfig): Promise<MCPBackendAdapter>;
    validateConfig(config: Partial<MCPBackendConfig>): boolean;
    getDefaultConfig(): Partial<MCPBackendConfig>;
    getConfigSchema(): any;
    getTestCases?(): TestCase[];
}
import { MCPBackendConfig, MCPBackendAdapter } from './gateway';
//# sourceMappingURL=plugin.d.ts.map