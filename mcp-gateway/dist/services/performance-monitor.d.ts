import { EventEmitter } from 'events';
export interface PerformanceMetrics {
    requestCount: number;
    averageResponseTime: number;
    errorRate: number;
    successRate: number;
    throughput: number;
    uptime: number;
}
export interface BackendMetrics {
    backendId: string;
    backendName: string;
    requestCount: number;
    averageResponseTime: number;
    errorCount: number;
    lastRequestTime: Date;
    status: 'healthy' | 'degraded' | 'unhealthy';
}
interface RequestMetric {
    requestId: string;
    method: string;
    tokenId: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    status: 'pending' | 'success' | 'error';
}
export declare class PerformanceMonitor extends EventEmitter {
    private requests;
    private backendMetrics;
    private globalMetrics;
    private startTime;
    constructor();
    registerBackend(backendId: string, backendName: string): void;
    startRequest(requestId: string, method: string, tokenId: string): void;
    endRequest(requestId: string, duration: number, status: 'success' | 'error'): void;
    private updateGlobalMetrics;
    private checkPerformanceAlerts;
    getGlobalMetrics(): PerformanceMetrics;
    getBackendMetrics(backendId: string): BackendMetrics | undefined;
    getAllBackendMetrics(): BackendMetrics[];
    getRecentRequests(limit?: number): RequestMetric[];
    private cleanupOldRequests;
    destroy(): Promise<void>;
}
export {};
//# sourceMappingURL=performance-monitor.d.ts.map