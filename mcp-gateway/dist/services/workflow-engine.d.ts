import { EventEmitter } from 'events';
import { WorkflowDefinition } from '../types/plugin';
import { GatewayService } from './gateway-service';
export declare class WorkflowEngine extends EventEmitter {
    private workflows;
    private activeExecutions;
    private gatewayService;
    constructor(gatewayService: GatewayService);
    createWorkflow(definition: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkflowDefinition>;
    updateWorkflow(id: string, updates: Partial<WorkflowDefinition>): Promise<WorkflowDefinition>;
    deleteWorkflow(id: string): Promise<void>;
    executeWorkflow(workflowId: string, input?: any, gatewayToken?: string): Promise<WorkflowExecution>;
    stopExecution(executionId: string): Promise<void>;
    private executeWorkflowNodes;
    private executeNode;
    private resolveDataPath;
    private getExecutionOrder;
    private validateWorkflow;
    private hasCycle;
    getWorkflow(id: string): WorkflowDefinition | undefined;
    getAllWorkflows(): WorkflowDefinition[];
    getExecution(id: string): WorkflowExecution | undefined;
    getActiveExecutions(): WorkflowExecution[];
    destroy(): Promise<void>;
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
//# sourceMappingURL=workflow-engine.d.ts.map