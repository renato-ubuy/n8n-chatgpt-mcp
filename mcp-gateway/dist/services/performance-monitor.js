"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMonitor = void 0;
const events_1 = require("events");
class PerformanceMonitor extends events_1.EventEmitter {
    constructor() {
        super();
        this.requests = new Map();
        this.backendMetrics = new Map();
        this.startTime = Date.now();
        this.globalMetrics = {
            requestCount: 0,
            averageResponseTime: 0,
            errorRate: 0,
            successRate: 0,
            throughput: 0,
            uptime: 0
        };
        // Cleanup completed requests periodically
        setInterval(() => this.cleanupOldRequests(), 60000); // Every minute
    }
    registerBackend(backendId, backendName) {
        this.backendMetrics.set(backendId, {
            backendId,
            backendName,
            requestCount: 0,
            averageResponseTime: 0,
            errorCount: 0,
            lastRequestTime: new Date(),
            status: 'healthy'
        });
    }
    startRequest(requestId, method, tokenId) {
        this.requests.set(requestId, {
            requestId,
            method,
            tokenId,
            startTime: Date.now(),
            status: 'pending'
        });
    }
    endRequest(requestId, duration, status) {
        const request = this.requests.get(requestId);
        if (!request)
            return;
        request.endTime = Date.now();
        request.duration = duration;
        request.status = status;
        this.updateGlobalMetrics(request);
        this.checkPerformanceAlerts(request);
    }
    updateGlobalMetrics(request) {
        this.globalMetrics.requestCount++;
        if (request.duration) {
            // Update average response time
            const totalTime = this.globalMetrics.averageResponseTime * (this.globalMetrics.requestCount - 1);
            this.globalMetrics.averageResponseTime = (totalTime + request.duration) / this.globalMetrics.requestCount;
        }
        // Update error and success rates
        const errorCount = Array.from(this.requests.values()).filter(r => r.status === 'error').length;
        const successCount = Array.from(this.requests.values()).filter(r => r.status === 'success').length;
        const totalCompleted = errorCount + successCount;
        if (totalCompleted > 0) {
            this.globalMetrics.errorRate = errorCount / totalCompleted;
            this.globalMetrics.successRate = successCount / totalCompleted;
        }
        // Update throughput (requests per second)
        const uptimeSeconds = (Date.now() - this.startTime) / 1000;
        this.globalMetrics.throughput = this.globalMetrics.requestCount / uptimeSeconds;
        this.globalMetrics.uptime = uptimeSeconds;
    }
    checkPerformanceAlerts(request) {
        // Alert on slow requests
        if (request.duration && request.duration > 5000) { // 5 seconds
            this.emit('performance:alert', {
                type: 'slow_request',
                requestId: request.requestId,
                method: request.method,
                duration: request.duration,
                threshold: 5000
            });
        }
        // Alert on high error rate
        if (this.globalMetrics.errorRate > 0.1) { // 10%
            this.emit('performance:alert', {
                type: 'high_error_rate',
                errorRate: this.globalMetrics.errorRate,
                threshold: 0.1
            });
        }
        // Alert on low throughput
        if (this.globalMetrics.throughput < 1 && this.globalMetrics.requestCount > 100) {
            this.emit('performance:alert', {
                type: 'low_throughput',
                throughput: this.globalMetrics.throughput,
                threshold: 1
            });
        }
    }
    getGlobalMetrics() {
        return { ...this.globalMetrics };
    }
    getBackendMetrics(backendId) {
        return this.backendMetrics.get(backendId);
    }
    getAllBackendMetrics() {
        return Array.from(this.backendMetrics.values());
    }
    getRecentRequests(limit = 100) {
        return Array.from(this.requests.values())
            .sort((a, b) => b.startTime - a.startTime)
            .slice(0, limit);
    }
    cleanupOldRequests() {
        const cutoffTime = Date.now() - (5 * 60 * 1000); // 5 minutes ago
        for (const [requestId, request] of this.requests.entries()) {
            if (request.endTime && request.endTime < cutoffTime) {
                this.requests.delete(requestId);
            }
        }
    }
    async destroy() {
        this.requests.clear();
        this.backendMetrics.clear();
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
//# sourceMappingURL=performance-monitor.js.map