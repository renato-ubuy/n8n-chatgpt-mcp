import express from 'express';
declare global {
    namespace Express {
        interface Request {
            requestId?: string;
            user?: {
                token: any;
            };
        }
    }
}
export declare class MCPGatewayApp {
    private app;
    private gatewayService;
    private authService;
    private marketplace;
    private pluginManager;
    private performanceMonitor;
    private securityManager;
    constructor();
    private initializeServices;
    private setupMiddleware;
    private setupRoutes;
    private createMCPRoutes;
    private createAdminRoutes;
    private createPluginRoutes;
    private createWorkflowRoutes;
    private setupServiceEventHandlers;
    private setupErrorHandlers;
    private processGatewayRequest;
    private getAllBackends;
    getApp(): express.Application;
    start(port?: number): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=app.d.ts.map