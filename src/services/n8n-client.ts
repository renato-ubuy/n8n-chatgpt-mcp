import axios, { AxiosInstance, AxiosResponse } from 'axios.js';
import { config } from '../config/index.js';
import { N8nWorkflow, N8nExecution } from '../types/mcp.js';

export interface N8nClientOptions {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
}

export class N8nClient {
  private client: AxiosInstance;
  private readonly baseUrl: string;

  constructor(options: N8nClientOptions = {}) {
    this.baseUrl = (options.baseUrl || config.n8n.baseUrl).replace(/\/$/, '');
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'X-N8N-API-KEY': options.apiKey || config.n8n.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: options.timeout ?? 10000,
    });
  }

  private get normalizedBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * List workflows with optional filters. Aligns with n8n list API semantics.
   */
  async getWorkflows(params?: {
    limit?: number;
    offset?: number;
    active?: boolean;
    tags?: string[];
    search?: string;
  }): Promise<N8nWorkflow[]> {
    try {
      const response: AxiosResponse<{ data: N8nWorkflow[] }> = await this.client.get('/api/v1/workflows', {
        params: params?.tags ? { ...params, tags: params.tags.join(',') } : params,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to fetch workflows: ${error}`);
    }
  }

  async getWorkflow(id: string): Promise<N8nWorkflow> {
    try {
      const response: AxiosResponse<{ data: N8nWorkflow }> = await this.client.get(`/api/v1/workflows/${id}`);
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to fetch workflow ${id}: ${error}`);
    }
  }

  async getWorkflowDetails(id: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/v1/workflows/${id}`, {
        params: { includeUsage: true },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch workflow details for ${id}: ${error}`);
    }
  }

  async createWorkflow(workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    try {
      const response: AxiosResponse<{ data: N8nWorkflow }> = await this.client.post('/api/v1/workflows', workflow);
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to create workflow: ${error}`);
    }
  }

  async updateWorkflow(id: string, workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    try {
      const response: AxiosResponse<{ data: N8nWorkflow }> = await this.client.patch(`/api/v1/workflows/${id}`, workflow);
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to update workflow ${id}: ${error}`);
    }
  }

  async deleteWorkflow(id: string): Promise<void> {
    try {
      await this.client.delete(`/api/v1/workflows/${id}`);
    } catch (error) {
      throw new Error(`Failed to delete workflow ${id}: ${error}`);
    }
  }

  async activateWorkflow(id: string): Promise<N8nWorkflow> {
    try {
      const response: AxiosResponse<{ data: N8nWorkflow }> = await this.client.patch(`/api/v1/workflows/${id}/activate`);
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to activate workflow ${id}: ${error}`);
    }
  }

  async deactivateWorkflow(id: string): Promise<N8nWorkflow> {
    try {
      const response: AxiosResponse<{ data: N8nWorkflow }> = await this.client.patch(`/api/v1/workflows/${id}/deactivate`);
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to deactivate workflow ${id}: ${error}`);
    }
  }

  async executeWorkflow(id: string, data?: any): Promise<N8nExecution> {
    try {
      const payload = data ? { data } : {};
      const response: AxiosResponse<{ data: N8nExecution }> = await this.client.post(`/api/v1/workflows/${id}/execute`, payload);
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to execute workflow ${id}: ${error}`);
    }
  }

  async getExecutions(params?: {
    workflowId?: string;
    limit?: number;
    status?: string;
    lastId?: string;
    finished?: boolean;
  }): Promise<N8nExecution[]> {
    try {
      const response: AxiosResponse<{ data: N8nExecution[] }> = await this.client.get('/api/v1/executions', {
        params,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to fetch executions: ${error}`);
    }
  }

  async getExecution(id: string, includeData: boolean = false): Promise<N8nExecution> {
    try {
      const response: AxiosResponse<{ data: N8nExecution }> = await this.client.get(`/api/v1/executions/${id}`, {
        params: includeData ? { includeData: true } : undefined,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to fetch execution ${id}: ${error}`);
    }
  }

  async stopExecution(id: string): Promise<N8nExecution> {
    try {
      const response: AxiosResponse<{ data: N8nExecution }> = await this.client.post(`/api/v1/executions/${id}/stop`);
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to stop execution ${id}: ${error}`);
    }
  }

  async deleteExecution(id: string): Promise<void> {
    try {
      await this.client.delete(`/api/v1/executions/${id}`);
    } catch (error) {
      throw new Error(`Failed to delete execution ${id}: ${error}`);
    }
  }

  async healthCheck(): Promise<{ status: string; details?: any }> {
    const normalize = (url: string) => url.replace(/\/$/, '').replace(/\/api\/v\d+$/, '');
    const base = normalize(this.normalizedBaseUrl);
    const candidates = [`${base}/healthz`, `${base}/health`];

    for (const url of candidates) {
      try {
        const response = await axios.get(url, { timeout: 5000 });
        if (response.status < 500) {
          const status = response.data?.status || (response.status === 200 ? 'ok' : 'unknown');
          return { status, details: response.data };
        }
      } catch (error) {
        // try next candidate
      }
    }

    try {
      await this.client.get('/api/v1/workflows', { params: { limit: 1 } });
      return { status: 'ok' };
    } catch (error) {
      throw new Error(`Failed to verify n8n health: ${error}`);
    }
  }

  async triggerWebhook(args: {
    webhookUrl: string;
    httpMethod?: string;
    data?: any;
    headers?: Record<string, string>;
    waitForResponse?: boolean;
  }): Promise<{ status: number; data?: any; headers?: Record<string, string> }> {
    const method = (args.httpMethod || 'POST').toUpperCase();
    try {
      const response = await axios.request({
        url: args.webhookUrl,
        method,
        data: args.data,
        headers: args.headers,
        timeout: args.waitForResponse === false ? 3000 : 10000,
        validateStatus: () => true,
      });

      if (args.waitForResponse === false) {
        return { status: response.status };
      }

      return {
        status: response.status,
        data: response.data,
        headers: response.headers as Record<string, string>,
      };
    } catch (error) {
      throw new Error(`Failed to trigger webhook: ${error instanceof Error ? error.message : error}`);
    }
  }
}
