"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityManager = void 0;
const events_1 = require("events");
class SecurityManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.incidents = [];
        this.blockedTokens = new Set();
        this.suspiciousPatterns = [
            /eval\s*\(/i,
            /exec\s*\(/i,
            /system\s*\(/i,
            /\.\.\/\.\.\//,
            /<script/i,
            /javascript:/i,
            /data:text\/html/i
        ];
    }
    async validateRequest(request, token) {
        try {
            // Check if token is blocked
            if (this.blockedTokens.has(token.token)) {
                await this.logIncident({
                    type: 'blocked_token_access',
                    message: `Blocked token attempted access: ${token.id}`,
                    timestamp: new Date(),
                    severity: 'high',
                    metadata: { tokenId: token.id, method: request.method }
                });
                return {
                    valid: false,
                    reason: 'Token has been blocked due to security concerns'
                };
            }
            // Validate request parameters
            const paramValidation = this.validateRequestParameters(request);
            if (!paramValidation.valid) {
                return paramValidation;
            }
            // Check for suspicious patterns in request
            const patternValidation = this.checkSuspiciousPatterns(request);
            if (!patternValidation.valid) {
                return patternValidation;
            }
            // Rate limiting validation (basic)
            const rateLimitValidation = this.validateRateLimit(token);
            if (!rateLimitValidation.valid) {
                return rateLimitValidation;
            }
            return { valid: true };
        }
        catch (error) {
            await this.logIncident({
                type: 'security_validation_error',
                message: `Security validation failed: ${error.message}`,
                timestamp: new Date(),
                severity: 'medium'
            });
            return {
                valid: false,
                reason: 'Security validation error'
            };
        }
    }
    validateRequestParameters(request) {
        try {
            // Validate method name
            if (!request.method || typeof request.method !== 'string') {
                return {
                    valid: false,
                    reason: 'Invalid method parameter'
                };
            }
            // Check for oversized parameters
            const requestSize = JSON.stringify(request).length;
            if (requestSize > 1024 * 1024) { // 1MB limit
                return {
                    valid: false,
                    reason: 'Request size exceeds security limit'
                };
            }
            // Validate JSON structure
            if (request.params && typeof request.params !== 'object') {
                return {
                    valid: false,
                    reason: 'Invalid parameters structure'
                };
            }
            return { valid: true };
        }
        catch (error) {
            return {
                valid: false,
                reason: 'Parameter validation failed'
            };
        }
    }
    checkSuspiciousPatterns(request) {
        const requestStr = JSON.stringify(request);
        for (const pattern of this.suspiciousPatterns) {
            if (pattern.test(requestStr)) {
                this.logIncident({
                    type: 'suspicious_pattern_detected',
                    message: `Suspicious pattern detected in request: ${pattern.source}`,
                    timestamp: new Date(),
                    severity: 'high',
                    metadata: { pattern: pattern.source, method: request.method }
                });
                return {
                    valid: false,
                    reason: 'Request contains suspicious patterns'
                };
            }
        }
        return { valid: true };
    }
    validateRateLimit(token) {
        // Basic rate limiting - in production, this would be more sophisticated
        const now = Date.now();
        const windowStart = now - (60 * 1000); // 1 minute window
        // This is a simplified check - in practice, you'd track requests per token
        // For now, just return valid
        return { valid: true };
    }
    async scanBackend(backend) {
        try {
            // Validate backend configuration
            if (!backend.config.baseUrl || !backend.config.baseUrl.startsWith('https://')) {
                await this.logIncident({
                    type: 'insecure_backend_config',
                    message: `Backend ${backend.name} configured with insecure URL`,
                    timestamp: new Date(),
                    severity: 'medium',
                    metadata: { backendId: backend.id, url: backend.config.baseUrl }
                });
            }
            // Check for secure authentication
            if (!backend.config.authentication || !backend.config.authentication.credentials) {
                await this.logIncident({
                    type: 'weak_authentication',
                    message: `Backend ${backend.name} has weak authentication configuration`,
                    timestamp: new Date(),
                    severity: 'high',
                    metadata: { backendId: backend.id }
                });
            }
            // Validate SSL/TLS if applicable
            if (backend.config.baseUrl && backend.config.baseUrl.startsWith('http://')) {
                await this.logIncident({
                    type: 'unencrypted_connection',
                    message: `Backend ${backend.name} uses unencrypted connection`,
                    timestamp: new Date(),
                    severity: 'high',
                    metadata: { backendId: backend.id, url: backend.config.baseUrl }
                });
            }
        }
        catch (error) {
            await this.logIncident({
                type: 'backend_security_scan_error',
                message: `Failed to scan backend ${backend.name}: ${error.message}`,
                timestamp: new Date(),
                severity: 'medium'
            });
        }
    }
    async logIncident(incident) {
        const fullIncident = {
            ...incident,
            timestamp: incident.timestamp || new Date()
        };
        this.incidents.push(fullIncident);
        // Keep only last 1000 incidents
        if (this.incidents.length > 1000) {
            this.incidents = this.incidents.slice(-1000);
        }
        // Emit security event
        this.emit('security:incident', fullIncident);
        // Auto-block tokens on critical incidents
        if (incident.severity === 'critical' && incident.metadata?.tokenId) {
            this.blockToken(incident.metadata.tokenId);
        }
        console.warn(`Security incident [${incident.severity}]: ${incident.message}`, incident.metadata);
    }
    blockToken(tokenId) {
        this.blockedTokens.add(tokenId);
        this.emit('security:token_blocked', { tokenId, timestamp: new Date() });
    }
    unblockToken(tokenId) {
        this.blockedTokens.delete(tokenId);
        this.emit('security:token_unblocked', { tokenId, timestamp: new Date() });
    }
    getSecurityStatus() {
        const now = Date.now();
        const recentIncidents = this.incidents.filter(incident => (now - incident.timestamp.getTime()) < (24 * 60 * 60 * 1000) // Last 24 hours
        );
        const criticalIncidents = recentIncidents.filter(i => i.severity === 'critical').length;
        const highIncidents = recentIncidents.filter(i => i.severity === 'high').length;
        let securityLevel = 'secure';
        if (criticalIncidents > 0) {
            securityLevel = 'breach';
        }
        else if (highIncidents > 5) {
            securityLevel = 'alert';
        }
        else if (recentIncidents.length > 10) {
            securityLevel = 'monitoring';
        }
        return {
            threatsDetected: recentIncidents.length,
            blockedRequests: this.blockedTokens.size,
            lastIncident: this.incidents.length > 0 ? this.incidents[this.incidents.length - 1].timestamp : undefined,
            securityLevel
        };
    }
    getRecentIncidents(limit = 50) {
        return this.incidents
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    getIncidentsByType(type) {
        return this.incidents.filter(incident => incident.type === type);
    }
    getIncidentsBySeverity(severity) {
        return this.incidents.filter(incident => incident.severity === severity);
    }
    // Security policies
    addSuspiciousPattern(pattern) {
        if (typeof pattern === 'string') {
            this.suspiciousPatterns.push(new RegExp(pattern, 'i'));
        }
        else {
            this.suspiciousPatterns.push(pattern);
        }
    }
    removeSuspiciousPattern(pattern) {
        this.suspiciousPatterns = this.suspiciousPatterns.filter(p => p.source !== pattern);
    }
    // Threat intelligence
    async updateThreatIntelligence() {
        try {
            // In a real implementation, this would fetch from threat intelligence feeds
            // For now, we'll just update some basic patterns
            const newPatterns = [
                /malware/i,
                /exploit/i,
                /payload/i,
                /injection/i
            ];
            for (const pattern of newPatterns) {
                if (!this.suspiciousPatterns.some(p => p.source === pattern.source)) {
                    this.suspiciousPatterns.push(pattern);
                }
            }
            this.emit('security:threat_intelligence_updated', {
                timestamp: new Date(),
                patternsCount: this.suspiciousPatterns.length
            });
        }
        catch (error) {
            await this.logIncident({
                type: 'threat_intelligence_update_failed',
                message: `Failed to update threat intelligence: ${error.message}`,
                timestamp: new Date(),
                severity: 'low'
            });
        }
    }
    // Audit logging
    async auditLog(action, details) {
        const auditEntry = {
            action,
            timestamp: new Date(),
            details,
            level: 'audit'
        };
        // In production, this would go to a secure audit log
        console.log('AUDIT:', JSON.stringify(auditEntry));
        this.emit('security:audit', auditEntry);
    }
    async destroy() {
        this.incidents = [];
        this.blockedTokens.clear();
        this.suspiciousPatterns = [];
    }
}
exports.SecurityManager = SecurityManager;
//# sourceMappingURL=security-manager.js.map