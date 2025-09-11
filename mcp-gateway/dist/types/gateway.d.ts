export interface MCPBackend {
    id: string;
    name: string;
    type: string;
    status: 'active' | 'inactive' | 'error';
    config: MCPBackendConfig;
    tools: MCPTool[];
    adapter: MCPBackendAdapter;
    createdAt: Date;
    updatedAt: Date;
}
export interface MCPBackendConfig {
    id: string;
    name: string;
    type: 'n8n' | 'atlassian' | 'github' | 'generic' | 'custom';
    baseUrl: string;
    authentication: {
        type: 'oauth' | 'api_key' | 'basic' | 'bearer';
        credentials: Record<string, any>;
        oauth?: {
            authorizationUrl: string;
            tokenUrl: string;
            clientId: string;
            clientSecret: string;
            scopes: string[];
        };
    };
    capabilities: string[];
    metadata?: Record<string, any>;
    rateLimiting?: {
        enabled: boolean;
        requestsPerMinute: number;
    };
}
export interface GatewayToken {
    id: string;
    token: string;
    name: string;
    description?: string;
    backendIds: string[];
    identityId: string;
    permissions: string[];
    expiresAt?: Date;
    createdAt: Date;
    lastUsed?: Date;
    isActive: boolean;
}
export interface AuthIdentity {
    id: string;
    name: string;
    email: string;
    provider: string;
    backendId: string;
    credentials: Record<string, any>;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}
export interface GatewayConfig {
    id: string;
    name: string;
    description?: string;
    backends: string[];
    defaultIdentity?: string;
    settings: {
        rateLimiting: {
            enabled: boolean;
            requestsPerMinute: number;
        };
        logging: {
            enabled: boolean;
            level: 'debug' | 'info' | 'warn' | 'error';
        };
        caching: {
            enabled: boolean;
            ttl: number;
        };
        security: {
            requireHttps: boolean;
            allowedOrigins: string[];
            tokenRotation: boolean;
        };
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: any;
    backendId: string;
    category?: string;
    tags?: string[];
}
export interface MCPBackendAdapter {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getTools(): Promise<MCPTool[]>;
    callTool(name: string, args: any): Promise<any>;
    authenticate(credentials: any): Promise<boolean>;
    getStatus(): Promise<'connected' | 'disconnected' | 'error'>;
    healthCheck(): Promise<boolean>;
}
export interface GatewayRequest {
    gatewayToken: string;
    method: string;
    params?: any;
    targetBackend?: string;
    requestId: string;
    timestamp: Date;
}
export interface GatewayResponse {
    requestId: string;
    result?: any;
    error?: {
        code: number;
        message: string;
        details?: any;
    };
    backend: string;
    timestamp: Date;
    executionTime: number;
}
export interface BackendRegistration {
    type: string;
    name: string;
    description: string;
    factory: MCPBackendFactory;
    authMethods: string[];
    capabilities: string[];
}
export interface MCPBackendFactory {
    create(config: MCPBackendConfig): Promise<MCPBackendAdapter>;
    validateConfig(config: Partial<MCPBackendConfig>): boolean;
    getDefaultConfig(): Partial<MCPBackendConfig>;
}
//# sourceMappingURL=gateway.d.ts.map