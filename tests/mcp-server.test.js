const { McpServer } = require('../dist/services/mcp-server.js');

const baseWorkflow = {
  id: 'wf_1',
  name: 'Original Workflow',
  active: true,
  nodes: [
    {
      id: '1',
      name: 'Start',
      type: 'n8n-nodes-base.start',
      typeVersion: 1,
      position: [0, 0],
      parameters: {},
    },
  ],
  connections: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tags: ['alpha'],
  settings: {
    executionOrder: 'v1',
  },
};

describe('McpServer tool execution', () => {
  test('applies partial workflow updates', async () => {
    const mockClient = {
      getWorkflow: jest.fn().mockResolvedValue(baseWorkflow),
      updateWorkflow: jest
        .fn()
        .mockImplementation(async (_id, payload) => ({ ...baseWorkflow, ...payload })),
      deleteWorkflow: jest.fn(),
      activateWorkflow: jest.fn(),
      deactivateWorkflow: jest.fn(),
      executeWorkflow: jest.fn(),
      getExecutions: jest.fn(),
      getExecution: jest.fn(),
      stopExecution: jest.fn(),
      deleteExecution: jest.fn(),
      getWorkflowDetails: jest.fn(),
      healthCheck: jest.fn(),
      triggerWebhook: jest.fn(),
    };

    const server = new McpServer(mockClient);

    const result = await server.callTool('n8n_update_partial_workflow', {
      id: 'wf_1',
      operations: [
        { type: 'updateName', name: 'Renamed Workflow' },
        { type: 'addTag', tag: 'beta' },
      ],
    });

    expect(mockClient.getWorkflow).toHaveBeenCalledWith('wf_1');
    expect(mockClient.updateWorkflow).toHaveBeenCalledTimes(1);
    expect(mockClient.updateWorkflow).toHaveBeenCalledWith(
      'wf_1',
      expect.objectContaining({
        name: 'Renamed Workflow',
        tags: expect.arrayContaining(['alpha', 'beta']),
      })
    );

    const payload = JSON.parse(result.content[0].text);
    expect(payload.operations).toEqual(
      expect.arrayContaining(['updateName:Renamed Workflow', 'addTag:beta'])
    );
  });

  test('validateOnly does not persist changes', async () => {
    const mockClient = {
      getWorkflow: jest.fn().mockResolvedValue(baseWorkflow),
      updateWorkflow: jest.fn(),
      deleteWorkflow: jest.fn(),
      activateWorkflow: jest.fn(),
      deactivateWorkflow: jest.fn(),
      executeWorkflow: jest.fn(),
      getExecutions: jest.fn(),
      getExecution: jest.fn(),
      stopExecution: jest.fn(),
      deleteExecution: jest.fn(),
      getWorkflowDetails: jest.fn(),
      healthCheck: jest.fn(),
      triggerWebhook: jest.fn(),
    };

    const server = new McpServer(mockClient);

    const result = await server.callTool('n8n_update_partial_workflow', {
      id: 'wf_1',
      validateOnly: true,
      operations: [{ type: 'updateName', name: 'Preview Name' }],
    });

    expect(mockClient.updateWorkflow).not.toHaveBeenCalled();
    const payload = JSON.parse(result.content[0].text);
    expect(payload.message).toContain('validated successfully');
    expect(payload.operations).toEqual(['updateName:Preview Name']);
  });
});
