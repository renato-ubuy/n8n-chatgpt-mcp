import { EventEmitter } from 'events';
import { JsonRpcRequest } from '../types/mcp';
import { GatewayToken, MCPBackend } from '../types/gateway';
export interface SecurityIncident {
    type: string;
    message: string;
    requestId?: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
    metadata?: any;
}
export interface SecurityStatus {
    threatsDetected: number;
    blockedRequests: number;
    lastIncident?: Date;
    securityLevel: 'secure' | 'monitoring' | 'alert' | 'breach';
}
export interface ValidationResult {
    valid: boolean;
    reason?: string;
    actions?: string[];
}
export declare class SecurityManager extends EventEmitter {
    private incidents;
    private blockedTokens;
    private suspiciousPatterns;
    constructor();
    validateRequest(request: JsonRpcRequest, token: GatewayToken): Promise<ValidationResult>;
    private validateRequestParameters;
    private checkSuspiciousPatterns;
    private validateRateLimit;
    scanBackend(backend: MCPBackend): Promise<void>;
    logIncident(incident: Omit<SecurityIncident, 'id'>): Promise<void>;
    blockToken(tokenId: string): void;
    unblockToken(tokenId: string): void;
    getSecurityStatus(): SecurityStatus;
    getRecentIncidents(limit?: number): SecurityIncident[];
    getIncidentsByType(type: string): SecurityIncident[];
    getIncidentsBySeverity(severity: SecurityIncident['severity']): SecurityIncident[];
    addSuspiciousPattern(pattern: string | RegExp): void;
    removeSuspiciousPattern(pattern: string): void;
    updateThreatIntelligence(): Promise<void>;
    auditLog(action: string, details: any): Promise<void>;
    destroy(): Promise<void>;
}
//# sourceMappingURL=security-manager.d.ts.map