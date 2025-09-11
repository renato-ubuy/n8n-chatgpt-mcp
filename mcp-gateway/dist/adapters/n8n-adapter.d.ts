import { MCPBackendAdapter, MCPTool } from '../types/gateway';
import { MCPBackendConfig } from '../types/gateway';
export declare class N8nAdapter implements MCPBackendAdapter {
    private client;
    private config;
    private isConnected;
    constructor(config: MCPBackendConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getTools(): Promise<MCPTool[]>;
    callTool(name: string, args: any): Promise<any>;
    authenticate(credentials: any): Promise<boolean>;
    getStatus(): Promise<'connected' | 'disconnected' | 'error'>;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=n8n-adapter.d.ts.map