import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { TestingSession, TestCase, TestResult, TestAssertion } from '../types/plugin';
import { GatewayService } from './gateway-service';
import { WorkflowEngine } from './workflow-engine';

export class DeveloperTools extends EventEmitter {
  private testingSessions: Map<string, TestingSession> = new Map();
  private gatewayService: GatewayService;
  private workflowEngine: WorkflowEngine;
  private debugSessions: Map<string, DebugSession> = new Map();

  constructor(gatewayService: GatewayService, workflowEngine: WorkflowEngine) {
    super();
    this.gatewayService = gatewayService;
    this.workflowEngine = workflowEngine;
  }

  // Testing Framework
  async createTestingSession(
    name: string,
    backendId: string,
    toolName: string,
    environment: 'development' | 'staging' | 'production' = 'development'
  ): Promise<TestingSession> {
    const session: TestingSession = {
      id: uuidv4(),
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

  async addTestCase(sessionId: string, testCase: Omit<TestCase, 'id'>): Promise<TestCase> {
    const session = this.testingSessions.get(sessionId);
    if (!session) {
      throw new Error(`Testing session ${sessionId} not found`);
    }

    const newTestCase: TestCase = {
      ...testCase,
      id: uuidv4()
    };

    session.testCases.push(newTestCase);
    this.emit('testing:test-case-added', { session, testCase: newTestCase });

    return newTestCase;
  }

  async runTestingSession(sessionId: string, gatewayToken?: string): Promise<TestResult[]> {
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
      let result: TestResult;

      try {
        // Execute the tool
        const output = await backend.adapter.callTool(session.toolName, testCase.input);
        
        // Run assertions
        const assertionResults = await this.runAssertions(testCase.assertions, output);
        const passed = assertionResults.every(a => a.passed);
        
        if (!passed) allPassed = false;

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

      } catch (error) {
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

  private async runAssertions(assertions: TestAssertion[], output: any): Promise<AssertionResult[]> {
    const results: AssertionResult[] = [];

    for (const assertion of assertions) {
      const result = await this.runAssertion(assertion, output);
      results.push(result);
    }

    return results;
  }

  private async runAssertion(assertion: TestAssertion, output: any): Promise<AssertionResult> {
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
          } else if (Array.isArray(actualValue)) {
            passed = actualValue.includes(assertion.value);
            message = passed ? 'Array contains expected value' : `Array does not contain ${assertion.value}`;
          } else {
            passed = false;
            message = 'Contains assertion requires string or array';
          }
          break;

        case 'matches':
          if (typeof actualValue === 'string') {
            const regex = new RegExp(assertion.value);
            passed = regex.test(actualValue);
            message = passed ? 'String matches pattern' : `"${actualValue}" does not match pattern ${assertion.value}`;
          } else {
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
    } catch (error) {
      return {
        passed: false,
        message: `Assertion error: ${error.message}`,
        actualValue: undefined,
        expectedValue: assertion.value
      };
    }
  }

  private getValueByPath(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  // Interactive Testing
  async testTool(
    backendId: string,
    toolName: string,
    args: any,
    gatewayToken?: string
  ): Promise<ToolTestResult> {
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

    } catch (error) {
      console.error(`❌ Tool test failed:`, error);

      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  private validateToolInput(schema: any, input: any): ValidationResult {
    // Basic JSON Schema validation
    // In a real implementation, you'd use a proper JSON Schema validator
    const errors: string[] = [];
    
    if (schema.required) {
      for (const requiredField of schema.required) {
        if (!(requiredField in input)) {
          errors.push(`Missing required field: ${requiredField}`);
        }
      }
    }

    // Type validation
    if (schema.properties) {
      for (const [field, fieldSchema] of Object.entries(schema.properties as any)) {
        if (field in input) {
          const value = input[field];
          const expectedType = (fieldSchema as any).type;
          
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
  async startDebugSession(workflowId: string): Promise<DebugSession> {
    const workflow = this.workflowEngine.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const debugSession: DebugSession = {
      id: uuidv4(),
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

  async addBreakpoint(debugSessionId: string, nodeId: string): Promise<void> {
    const session = this.debugSessions.get(debugSessionId);
    if (!session) {
      throw new Error(`Debug session ${debugSessionId} not found`);
    }

    session.breakpoints.add(nodeId);
    this.emit('debug:breakpoint-added', { session, nodeId });
  }

  async removeBreakpoint(debugSessionId: string, nodeId: string): Promise<void> {
    const session = this.debugSessions.get(debugSessionId);
    if (!session) {
      throw new Error(`Debug session ${debugSessionId} not found`);
    }

    session.breakpoints.delete(nodeId);
    this.emit('debug:breakpoint-removed', { session, nodeId });
  }

  // Performance Monitoring
  async getPerformanceMetrics(backendId?: string): Promise<PerformanceMetrics> {
    const backends = backendId 
      ? [this.gatewayService.getBackend(backendId)].filter(Boolean)
      : this.gatewayService.getAllBackends();

    const metrics: PerformanceMetrics = {
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
  getTestingSession(id: string): TestingSession | undefined {
    return this.testingSessions.get(id);
  }

  getAllTestingSessions(): TestingSession[] {
    return Array.from(this.testingSessions.values());
  }

  getDebugSession(id: string): DebugSession | undefined {
    return this.debugSessions.get(id);
  }
}

// Supporting interfaces
interface AssertionResult {
  passed: boolean;
  message: string;
  actualValue: any;
  expectedValue: any;
}

interface ToolTestResult {
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
  timestamp: Date;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
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