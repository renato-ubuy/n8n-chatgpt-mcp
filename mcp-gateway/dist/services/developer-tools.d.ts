import { EventEmitter } from 'events';
import { TestingSession, TestCase, TestResult } from '../types/plugin';
import { GatewayService } from './gateway-service';
import { WorkflowEngine } from './workflow-engine';
export declare class DeveloperTools extends EventEmitter {
    private testingSessions;
    private gatewayService;
    private workflowEngine;
    private debugSessions;
    constructor(gatewayService: GatewayService, workflowEngine: WorkflowEngine);
    createTestingSession(name: string, backendId: string, toolName: string, environment?: 'development' | 'staging' | 'production'): Promise<TestingSession>;
    addTestCase(sessionId: string, testCase: Omit<TestCase, 'id'>): Promise<TestCase>;
    runTestingSession(sessionId: string, gatewayToken?: string): Promise<TestResult[]>;
    private runAssertions;
    private runAssertion;
    private getValueByPath;
    testTool(backendId: string, toolName: string, args: any, gatewayToken?: string): Promise<ToolTestResult>;
    private validateToolInput;
    startDebugSession(workflowId: string): Promise<DebugSession>;
    addBreakpoint(debugSessionId: string, nodeId: string): Promise<void>;
    removeBreakpoint(debugSessionId: string, nodeId: string): Promise<void>;
    getPerformanceMetrics(backendId?: string): Promise<PerformanceMetrics>;
    getTestingSession(id: string): TestingSession | undefined;
    getAllTestingSessions(): TestingSession[];
    getDebugSession(id: string): DebugSession | undefined;
}
interface ToolTestResult {
    success: boolean;
    result?: any;
    error?: string;
    duration: number;
    timestamp: Date;
}
interface DebugSession {
    id: string;
    workflowId: string;
    status: 'active' | 'paused' | 'stopped';
    breakpoints: Set<string>;
    watchVariables: Map<string, any>;
    executionHistory: DebugEvent[];
    startTime: Date;
}
interface DebugEvent {
    timestamp: Date;
    type: 'node-start' | 'node-complete' | 'node-error' | 'breakpoint';
    nodeId: string;
    data?: any;
}
interface PerformanceMetrics {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    backends: Record<string, BackendMetrics>;
}
interface BackendMetrics {
    name: string;
    status: string;
    requestCount: number;
    averageResponseTime: number;
    errorCount: number;
    lastRequest: Date;
}
export {};
//# sourceMappingURL=developer-tools.d.ts.map