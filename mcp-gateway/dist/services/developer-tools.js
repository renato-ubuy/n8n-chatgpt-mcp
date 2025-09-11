"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeveloperTools = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
class DeveloperTools extends events_1.EventEmitter {
    constructor(gatewayService, workflowEngine) {
        super();
        this.testingSessions = new Map();
        this.debugSessions = new Map();
        this.gatewayService = gatewayService;
        this.workflowEngine = workflowEngine;
    }
    // Testing Framework
    async createTestingSession(name, backendId, toolName, environment = 'development') {
        const session = {
            id: (0, uuid_1.v4)(),
            name,
            backendId,
            toolName,
            testCases: [],
            environment,
            results: [],
            status: 'pending'
        };
        this.testingSessions.set(session.id, session);
        this.emit('testing:session-created', session);
        return session;
    }
    async addTestCase(sessionId, testCase) {
        const session = this.testingSessions.get(sessionId);
        if (!session) {
            throw new Error(`Testing session ${sessionId} not found`);
        }
        const newTestCase = {
            ...testCase,
            id: (0, uuid_1.v4)()
        };
        session.testCases.push(newTestCase);
        this.emit('testing:test-case-added', { session, testCase: newTestCase });
        return newTestCase;
    }
    async runTestingSession(sessionId, gatewayToken) {
        const session = this.testingSessions.get(sessionId);
        if (!session) {
            throw new Error(`Testing session ${sessionId} not found`);
        }
        session.status = 'running';
        session.results = [];
        session.lastRun = new Date();
        this.emit('testing:session-started', session);
        const backend = this.gatewayService.getBackend(session.backendId);
        if (!backend) {
            throw new Error(`Backend ${session.backendId} not found`);
        }
        let allPassed = true;
        for (const testCase of session.testCases) {
            this.emit('testing:test-case-started', { session, testCase });
            const startTime = Date.now();
            let result;
            try {
                // Execute the tool
                const output = await backend.adapter.callTool(session.toolName, testCase.input);
                // Run assertions
                const assertionResults = await this.runAssertions(testCase.assertions, output);
                const passed = assertionResults.every(a => a.passed);
                if (!passed)
                    allPassed = false;
                result = {
                    testCaseId: testCase.id,
                    status: passed ? 'passed' : 'failed',
                    output,
                    duration: Date.now() - startTime,
                    timestamp: new Date()
                };
                if (!passed) {
                    result.error = assertionResults
                        .filter(a => !a.passed)
                        .map(a => a.message)
                        .join('; ');
                }
            }
            catch (error) {
                allPassed = false;
                result = {
                    testCaseId: testCase.id,
                    status: 'failed',
                    output: null,
                    error: error.message,
                    duration: Date.now() - startTime,
                    timestamp: new Date()
                };
            }
            session.results.push(result);
            this.emit('testing:test-case-completed', { session, testCase, result });
        }
        session.status = allPassed ? 'passed' : 'failed';
        this.emit('testing:session-completed', session);
        console.log(`🧪 Testing session "${session.name}" completed: ${session.results.length} tests, ${session.results.filter(r => r.status === 'passed').length} passed`);
        return session.results;
    }
    async runAssertions(assertions, output) {
        const results = [];
        for (const assertion of assertions) {
            const result = await this.runAssertion(assertion, output);
            results.push(result);
        }
        return results;
    }
    async runAssertion(assertion, output) {
        try {
            const actualValue = this.getValueByPath(output, assertion.field);
            let passed = false;
            let message = '';
            switch (assertion.type) {
                case 'equals':
                    passed = actualValue === assertion.value;
                    message = passed ? 'Values are equal' : `Expected ${assertion.value}, got ${actualValue}`;
                    break;
                case 'contains':
                    if (typeof actualValue === 'string' && typeof assertion.value === 'string') {
                        passed = actualValue.includes(assertion.value);
                        message = passed ? 'String contains expected value' : `"${actualValue}" does not contain "${assertion.value}"`;
                    }
                    else if (Array.isArray(actualValue)) {
                        passed = actualValue.includes(assertion.value);
                        message = passed ? 'Array contains expected value' : `Array does not contain ${assertion.value}`;
                    }
                    else {
                        passed = false;
                        message = 'Contains assertion requires string or array';
                    }
                    break;
                case 'matches':
                    if (typeof actualValue === 'string') {
                        const regex = new RegExp(assertion.value);
                        passed = regex.test(actualValue);
                        message = passed ? 'String matches pattern' : `"${actualValue}" does not match pattern ${assertion.value}`;
                    }
                    else {
                        passed = false;
                        message = 'Matches assertion requires string value';
                    }
                    break;
                case 'custom':
                    // Custom assertion logic would go here
                    passed = false;
                    message = 'Custom assertions not implemented yet';
                    break;
                default:
                    passed = false;
                    message = `Unknown assertion type: ${assertion.type}`;
            }
            return { passed, message, actualValue, expectedValue: assertion.value };
        }
        catch (error) {
            return {
                passed: false,
                message: `Assertion error: ${error.message}`,
                actualValue: undefined,
                expectedValue: assertion.value
            };
        }
    }
    getValueByPath(obj, path) {
        const parts = path.split('.');
        let current = obj;
        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            }
            else {
                return undefined;
            }
        }
        return current;
    }
    // Interactive Testing
    async testTool(backendId, toolName, args, gatewayToken) {
        console.log(`🔧 Testing tool ${backendId}:${toolName}`);
        const startTime = Date.now();
        try {
            const backend = this.gatewayService.getBackend(backendId);
            if (!backend) {
                throw new Error(`Backend ${backendId} not found`);
            }
            const tool = backend.tools.find(t => t.name === toolName);
            if (!tool) {
                throw new Error(`Tool ${toolName} not found in backend ${backendId}`);
            }
            // Validate input against schema
            const validationResult = this.validateToolInput(tool.inputSchema, args);
            if (!validationResult.valid) {
                return {
                    success: false,
                    error: `Input validation failed: ${validationResult.errors.join(', ')}`,
                    duration: Date.now() - startTime,
                    timestamp: new Date()
                };
            }
            // Execute tool
            const result = await backend.adapter.callTool(toolName, args);
            console.log(`✅ Tool test successful in ${Date.now() - startTime}ms`);
            return {
                success: true,
                result,
                duration: Date.now() - startTime,
                timestamp: new Date()
            };
        }
        catch (error) {
            console.error(`❌ Tool test failed:`, error);
            return {
                success: false,
                error: error.message,
                duration: Date.now() - startTime,
                timestamp: new Date()
            };
        }
    }
    validateToolInput(schema, input) {
        // Basic JSON Schema validation
        // In a real implementation, you'd use a proper JSON Schema validator
        const errors = [];
        if (schema.required) {
            for (const requiredField of schema.required) {
                if (!(requiredField in input)) {
                    errors.push(`Missing required field: ${requiredField}`);
                }
            }
        }
        // Type validation
        if (schema.properties) {
            for (const [field, fieldSchema] of Object.entries(schema.properties)) {
                if (field in input) {
                    const value = input[field];
                    const expectedType = fieldSchema.type;
                    if (expectedType && typeof value !== expectedType && expectedType !== 'any') {
                        errors.push(`Field ${field} should be ${expectedType}, got ${typeof value}`);
                    }
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    // Debugging Tools
    async startDebugSession(workflowId) {
        const workflow = this.workflowEngine.getWorkflow(workflowId);
        if (!workflow) {
            throw new Error(`Workflow ${workflowId} not found`);
        }
        const debugSession = {
            id: (0, uuid_1.v4)(),
            workflowId,
            status: 'active',
            breakpoints: new Set(),
            watchVariables: new Map(),
            executionHistory: [],
            startTime: new Date()
        };
        this.debugSessions.set(debugSession.id, debugSession);
        this.emit('debug:session-started', debugSession);
        return debugSession;
    }
    async addBreakpoint(debugSessionId, nodeId) {
        const session = this.debugSessions.get(debugSessionId);
        if (!session) {
            throw new Error(`Debug session ${debugSessionId} not found`);
        }
        session.breakpoints.add(nodeId);
        this.emit('debug:breakpoint-added', { session, nodeId });
    }
    async removeBreakpoint(debugSessionId, nodeId) {
        const session = this.debugSessions.get(debugSessionId);
        if (!session) {
            throw new Error(`Debug session ${debugSessionId} not found`);
        }
        session.breakpoints.delete(nodeId);
        this.emit('debug:breakpoint-removed', { session, nodeId });
    }
    // Performance Monitoring
    async getPerformanceMetrics(backendId) {
        const backends = backendId
            ? [this.gatewayService.getBackend(backendId)].filter(Boolean)
            : this.gatewayService.getAllBackends();
        const metrics = {
            totalRequests: 0,
            averageResponseTime: 0,
            errorRate: 0,
            backends: {}
        };
        for (const backend of backends) {
            if (backend) {
                // In a real implementation, you'd collect these metrics over time
                metrics.backends[backend.id] = {
                    name: backend.name,
                    status: backend.status,
                    requestCount: 0,
                    averageResponseTime: 0,
                    errorCount: 0,
                    lastRequest: new Date()
                };
            }
        }
        return metrics;
    }
    // Getters
    getTestingSession(id) {
        return this.testingSessions.get(id);
    }
    getAllTestingSessions() {
        return Array.from(this.testingSessions.values());
    }
    getDebugSession(id) {
        return this.debugSessions.get(id);
    }
}
exports.DeveloperTools = DeveloperTools;
//# sourceMappingURL=developer-tools.js.map