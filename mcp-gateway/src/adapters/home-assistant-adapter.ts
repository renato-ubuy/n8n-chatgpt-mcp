import { MCPBackendAdapter, MCPTool } from '../types/gateway';
import { MCPBackendConfig } from '../types/gateway';
import axios, { AxiosInstance } from 'axios';

export class HomeAssistantAdapter implements MCPBackendAdapter {
  private client: AxiosInstance;
  private config: MCPBackendConfig;
  private isConnected: boolean = false;

  constructor(config: MCPBackendConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.authentication.credentials.token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async connect(): Promise<void> {
    try {
      // Test connection by getting Home Assistant info
      const response = await this.client.get('/api/');
      console.log(`✅ Connected to Home Assistant: ${response.data.message}`);
      this.isConnected = true;
    } catch (error: any) {
      console.error('❌ Failed to connect to Home Assistant:', error.message);
      throw new Error(`Home Assistant connection failed: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    console.log('🔌 Disconnected from Home Assistant');
  }

  async getTools(): Promise<MCPTool[]> {
    const tools: MCPTool[] = [
      {
        name: 'get_states',
        description: 'Get states of all entities or specific entity',
        inputSchema: {
          type: 'object',
          properties: {
            entity_id: {
              type: 'string',
              description: 'Optional entity ID to get specific state'
            }
          }
        },
        backendId: this.config.id,
        category: 'state',
        tags: ['homeassistant', 'state', 'entities']
      },
      {
        name: 'call_service',
        description: 'Call a Home Assistant service',
        inputSchema: {
          type: 'object',
          required: ['domain', 'service'],
          properties: {
            domain: {
              type: 'string',
              description: 'Service domain (e.g., light, switch, automation)'
            },
            service: {
              type: 'string', 
              description: 'Service name (e.g., turn_on, turn_off, toggle)'
            },
            entity_id: {
              type: 'string',
              description: 'Target entity ID'
            },
            service_data: {
              type: 'object',
              description: 'Additional service data/parameters'
            }
          }
        },
        backendId: this.config.id,
        category: 'control',
        tags: ['homeassistant', 'service', 'control']
      },
      {
        name: 'get_entities',
        description: 'List all available entities by domain',
        inputSchema: {
          type: 'object',
          properties: {
            domain: {
              type: 'string',
              description: 'Filter by domain (light, switch, sensor, etc.)'
            }
          }
        },
        backendId: this.config.id,
        category: 'discovery',
        tags: ['homeassistant', 'entities', 'discovery']
      },
      {
        name: 'get_services',
        description: 'Get available services',
        inputSchema: {
          type: 'object',
          properties: {
            domain: {
              type: 'string',
              description: 'Filter services by domain'
            }
          }
        },
        backendId: this.config.id,
        category: 'discovery',
        tags: ['homeassistant', 'services', 'discovery']
      },
      {
        name: 'trigger_automation',
        description: 'Trigger a Home Assistant automation',
        inputSchema: {
          type: 'object',
          required: ['entity_id'],
          properties: {
            entity_id: {
              type: 'string',
              description: 'Automation entity ID'
            }
          }
        },
        backendId: this.config.id,
        category: 'automation',
        tags: ['homeassistant', 'automation', 'trigger']
      },
      {
        name: 'set_state',
        description: 'Set entity state and attributes',
        inputSchema: {
          type: 'object',
          required: ['entity_id', 'state'],
          properties: {
            entity_id: {
              type: 'string',
              description: 'Entity ID to update'
            },
            state: {
              type: 'string',
              description: 'New state value'
            },
            attributes: {
              type: 'object',
              description: 'Entity attributes to update'
            }
          }
        },
        backendId: this.config.id,
        category: 'state',
        tags: ['homeassistant', 'state', 'update']
      },
      {
        name: 'get_history',
        description: 'Get entity history',
        inputSchema: {
          type: 'object',
          properties: {
            entity_id: {
              type: 'string',
              description: 'Entity ID for history'
            },
            start_time: {
              type: 'string',
              description: 'Start time (ISO format)'
            },
            end_time: {
              type: 'string', 
              description: 'End time (ISO format)'
            }
          }
        },
        backendId: this.config.id,
        category: 'history',
        tags: ['homeassistant', 'history', 'data']
      }
    ];

    return tools;
  }

  async callTool(name: string, args: any): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Home Assistant adapter not connected');
    }

    try {
      console.log(`🏠 Calling Home Assistant tool: ${name}`, args);

      switch (name) {
        case 'get_states':
          if (args.entity_id) {
            const response = await this.client.get(`/api/states/${args.entity_id}`);
            return response.data;
          } else {
            const response = await this.client.get('/api/states');
            return response.data;
          }

        case 'call_service':
          const serviceUrl = `/api/services/${args.domain}/${args.service}`;
          const serviceData = {
            entity_id: args.entity_id,
            ...args.service_data
          };
          const response = await this.client.post(serviceUrl, serviceData);
          return response.data;

        case 'get_entities':
          const statesResponse = await this.client.get('/api/states');
          let entities = statesResponse.data;
          
          if (args.domain) {
            entities = entities.filter((entity: any) => 
              entity.entity_id.startsWith(args.domain + '.')
            );
          }
          
          return entities.map((entity: any) => ({
            entity_id: entity.entity_id,
            friendly_name: entity.attributes.friendly_name || entity.entity_id,
            state: entity.state,
            domain: entity.entity_id.split('.')[0]
          }));

        case 'get_services':
          const servicesResponse = await this.client.get('/api/services');
          let services = servicesResponse.data;
          
          if (args.domain) {
            services = { [args.domain]: services[args.domain] };
          }
          
          return services;

        case 'trigger_automation':
          const triggerResponse = await this.client.post(
            `/api/services/automation/trigger`,
            { entity_id: args.entity_id }
          );
          return triggerResponse.data;

        case 'set_state':
          const setStateResponse = await this.client.post(
            `/api/states/${args.entity_id}`,
            {
              state: args.state,
              attributes: args.attributes || {}
            }
          );
          return setStateResponse.data;

        case 'get_history':
          let historyUrl = '/api/history/period';
          const params: any = {};
          
          if (args.start_time) params.start_time = args.start_time;
          if (args.end_time) params.end_time = args.end_time;
          if (args.entity_id) params.filter_entity_id = args.entity_id;
          
          const historyResponse = await this.client.get(historyUrl, { params });
          return historyResponse.data;

        default:
          throw new Error(`Unknown Home Assistant tool: ${name}`);
      }
    } catch (error: any) {
      console.error(`❌ Home Assistant tool error (${name}):`, error.message);
      throw new Error(`Home Assistant API error: ${error.response?.data?.message || error.message}`);
    }
  }

  async authenticate(credentials: any): Promise<boolean> {
    try {
      this.client.defaults.headers['Authorization'] = `Bearer ${credentials.token}`;
      await this.client.get('/api/');
      return true;
    } catch (error) {
      return false;
    }
  }

  async getStatus(): Promise<'connected' | 'disconnected' | 'error'> {
    if (!this.isConnected) return 'disconnected';
    
    try {
      await this.client.get('/api/');
      return 'connected';
    } catch (error) {
      return 'error';
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}