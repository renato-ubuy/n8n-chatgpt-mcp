import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { WorkflowDefinition, WorkflowNode, WorkflowConnection, TestingSession, TestCase, TestResult } from '../types/plugin';
import { GatewayService } from './gateway-service';

export class WorkflowEngine extends EventEmitter {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private activeExecutions: Map<string, WorkflowExecution> = new Map();
  private gatewayService: GatewayService;

  constructor(gatewayService: GatewayService) {
    super();
    this.gatewayService = gatewayService;
  }

  // Workflow Management
  async createWorkflow(definition: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkflowDefinition> {
    const workflow: WorkflowDefinition = {
      ...definition,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate workflow
    await this.validateWorkflow(workflow);

    this.workflows.set(workflow.id, workflow);
    this.emit('workflow:created', workflow);

    console.log(`✅ Workflow "${workflow.name}" created with ${workflow.nodes.length} nodes`);
    return workflow;
  }

  async updateWorkflow(id: string, updates: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      throw new Error(`Workflow ${id} not found`);
    }

    const updatedWorkflow: WorkflowDefinition = {
      ...workflow,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date()
    };

    // Validate updated workflow
    await this.validateWorkflow(updatedWorkflow);

    this.workflows.set(id, updatedWorkflow);
    this.emit('workflow:updated', updatedWorkflow);

    return updatedWorkflow;
  }

  async deleteWorkflow(id: string): Promise<void> {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      throw new Error(`Workflow ${id} not found`);
    }

    // Stop any active executions
    for (const [executionId, execution] of this.activeExecutions.entries()) {
      if (execution.workflowId === id) {
        await this.stopExecution(executionId);
      }
    }

    this.workflows.delete(id);
    this.emit('workflow:deleted', id);
  }

  // Workflow Execution
  async executeWorkflow(
    workflowId: string, 
    input?: any, 
    gatewayToken?: string
  ): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const execution: WorkflowExecution = {
      id: uuidv4(),
      workflowId,
      status: 'running',
      startTime: new Date(),
      input,
      output: null,
      error: null,
      nodeResults: new Map(),
      currentNodeId: null
    };

    this.activeExecutions.set(execution.id, execution);
    this.emit('execution:started', execution);

    try {
      // Execute workflow nodes in order
      const result = await this.executeWorkflowNodes(workflow, execution, gatewayToken);
      
      execution.status = 'completed';
      execution.endTime = new Date();
      execution.output = result;
      
      this.emit('execution:completed', execution);
      console.log(`✅ Workflow execution ${execution.id} completed successfully`);
      
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.error = error.message;
      
      this.emit('execution:failed', execution);
      console.error(`❌ Workflow execution ${execution.id} failed:`, error);
    }

    return execution;
  }

  async stopExecution(executionId: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    execution.status = 'stopped';
    execution.endTime = new Date();
    
    this.activeExecutions.delete(executionId);
    this.emit('execution:stopped', execution);
  }

  private async executeWorkflowNodes(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    gatewayToken?: string
  ): Promise<any> {
    const nodeResults = new Map<string, any>();
    const executionOrder = this.getExecutionOrder(workflow);

    for (const nodeId of executionOrder) {
      if (execution.status !== 'running') {
        break; // Execution was stopped
      }

      const node = workflow.nodes.find(n => n.id === nodeId);
      if (!node || !node.enabled) {
        continue;
      }

      execution.currentNodeId = nodeId;
      this.emit('execution:node-started', { execution, node });

      try {
        const nodeResult = await this.executeNode(node, nodeResults, gatewayToken);
        nodeResults.set(nodeId, nodeResult);
        execution.nodeResults.set(nodeId, nodeResult);
        
        this.emit('execution:node-completed', { execution, node, result: nodeResult });
      } catch (error) {
        this.emit('execution:node-failed', { execution, node, error });
        
        if (workflow.settings.errorHandling === 'stop') {
          throw error;
        } else if (workflow.settings.errorHandling === 'retry') {
          // Implement retry logic
          console.log(`Retrying node ${nodeId}...`);
        }
        // Continue on error
      }
    }

    return nodeResults.get(executionOrder[executionOrder.length - 1]);
  }

  private async executeNode(
    node: WorkflowNode,
    previousResults: Map<string, any>,
    gatewayToken?: string
  ): Promise<any> {
    // Get the backend
    const backend = this.gatewayService.getBackend(node.backendId);
    if (!backend) {
      throw new Error(`Backend ${node.backendId} not found`);
    }

    // Prepare parameters
    const parameters = { ...node.config.parameters };
    
    // Apply input mapping from previous nodes
    if (node.config.mapping) {
      for (const [param, sourcePath] of Object.entries(node.config.mapping)) {
        const value = this.resolveDataPath(sourcePath, previousResults);
        parameters[param] = value;
      }
    }

    // Execute the tool
    console.log(`🔧 Executing ${backend.name}:${node.toolName} with parameters:`, parameters);
    return await backend.adapter.callTool(node.toolName, parameters);
  }

  private resolveDataPath(path: string, data: Map<string, any>): any {
    // Example path: "node1.output.data.id"
    const parts = path.split('.');
    const nodeId = parts[0];
    const nodeResult = data.get(nodeId);
    
    if (!nodeResult) {
      return undefined;
    }

    let current = nodeResult;
    for (let i = 1; i < parts.length; i++) {
      if (current && typeof current === 'object') {
        current = current[parts[i]];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  private getExecutionOrder(workflow: WorkflowDefinition): string[] {
    const nodes = workflow.nodes;
    const connections = workflow.connections;
    const visited = new Set<string>();
    const order: string[] = [];

    // Find trigger nodes (nodes with no incoming connections)
    const incomingConnections = new Set(connections.map(c => c.targetNodeId));
    const triggerNodes = nodes.filter(n => !incomingConnections.has(n.id));

    // Depth-first traversal
    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      // Visit dependencies first
      const dependencies = connections
        .filter(c => c.targetNodeId === nodeId)
        .map(c => c.sourceNodeId);
      
      for (const depId of dependencies) {
        visit(depId);
      }

      order.push(nodeId);
    };

    // Start from trigger nodes
    for (const triggerNode of triggerNodes) {
      visit(triggerNode.id);
    }

    return order;
  }

  // Workflow Validation
  private async validateWorkflow(workflow: WorkflowDefinition): Promise<void> {
    // Check for cycles
    if (this.hasCycle(workflow)) {
      throw new Error('Workflow contains cycles');
    }

    // Validate nodes
    for (const node of workflow.nodes) {
      const backend = this.gatewayService.getBackend(node.backendId);
      if (!backend) {
        throw new Error(`Backend ${node.backendId} not found for node ${node.name}`);
      }

      const tool = backend.tools.find(t => t.name === node.toolName);
      if (!tool) {
        throw new Error(`Tool ${node.toolName} not found in backend ${backend.name}`);
      }
    }

    // Validate connections
    const nodeIds = new Set(workflow.nodes.map(n => n.id));
    for (const connection of workflow.connections) {
      if (!nodeIds.has(connection.sourceNodeId)) {
        throw new Error(`Invalid connection: source node ${connection.sourceNodeId} not found`);
      }
      if (!nodeIds.has(connection.targetNodeId)) {
        throw new Error(`Invalid connection: target node ${connection.targetNodeId} not found`);
      }
    }
  }

  private hasCycle(workflow: WorkflowDefinition): boolean {
    const graph = new Map<string, string[]>();
    
    // Build adjacency list
    for (const node of workflow.nodes) {
      graph.set(node.id, []);
    }
    
    for (const connection of workflow.connections) {
      const edges = graph.get(connection.sourceNodeId) || [];
      edges.push(connection.targetNodeId);
      graph.set(connection.sourceNodeId, edges);
    }

    // DFS cycle detection
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycleDFS = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = graph.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (hasCycleDFS(neighbor)) return true;
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of graph.keys()) {
      if (hasCycleDFS(nodeId)) return true;
    }

    return false;
  }

  // Getters
  getWorkflow(id: string): WorkflowDefinition | undefined {
    return this.workflows.get(id);
  }

  getAllWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  getExecution(id: string): WorkflowExecution | undefined {
    return this.activeExecutions.get(id);
  }

  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  async destroy(): Promise<void> {
    // Stop all active executions
    const activeIds = Array.from(this.activeExecutions.keys());
    for (const executionId of activeIds) {
      try {
        await this.stopExecution(executionId);
      } catch (error) {
        console.error('Failed to stop execution:', error);
      }
    }

    this.workflows.clear();
    this.activeExecutions.clear();
  }
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  startTime: Date;
  endTime?: Date;
  input?: any;
  output?: any;
  error?: string;
  nodeResults: Map<string, any>;
  currentNodeId?: string;
}