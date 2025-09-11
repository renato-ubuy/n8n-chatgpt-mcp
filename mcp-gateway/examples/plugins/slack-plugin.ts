import { MCPPlugin, MCPBackendAdapter } from '../../src/types/plugin';
import { MCPBackendConfig, MCPTool } from '../../src/types/gateway';
import axios, { AxiosInstance } from 'axios';

// Slack Plugin Implementation Example
export const SlackPlugin: MCPPlugin = {
  name: '@mcp-gateway/slack-plugin',
  version: '1.2.0',
  description: 'Slack integration for messaging, channel management, and workspace automation',
  author: 'MCP Gateway Team',
  license: 'MIT',
  tags: ['communication', 'slack', 'messaging', 'official'],
  
  metadata: {
    category: 'communication',
    icon: '💬',
    documentation: 'https://docs.mcp-gateway.dev/plugins/slack',
    homepage: 'https://slack.com',
    repository: 'https://github.com/mcp-gateway/slack-plugin'
  },

  backend: {
    create: async (config: MCPBackendConfig): Promise<MCPBackendAdapter> => {
      return new SlackBackendAdapter(config);
    },

    validateConfig: (config: Partial<MCPBackendConfig>): boolean => {
      return !!(
        config.authentication?.credentials?.botToken ||
        config.authentication?.credentials?.appToken
      );
    },

    getDefaultConfig: (): Partial<MCPBackendConfig> => ({
      type: 'slack',
      baseUrl: 'https://slack.com/api',
      authentication: {
        type: 'oauth',
        credentials: {
          botToken: '',
          appToken: ''
        }
      },
      capabilities: ['messaging', 'channels', 'users', 'files']
    }),

    getConfigSchema: () => ({
      type: 'object',
      properties: {
        authentication: {
          type: 'object',
          properties: {
            type: { const: 'oauth' },
            credentials: {
              type: 'object',
              properties: {
                botToken: {
                  type: 'string',
                  description: 'Slack Bot User OAuth Token (xoxb-...)',
                  pattern: '^xoxb-'
                },
                appToken: {
                  type: 'string',
                  description: 'Slack App-Level Token (xapp-...)',
                  pattern: '^xapp-'
                }
              },
              required: ['botToken']
            }
          },
          required: ['type', 'credentials']
        }
      },
      required: ['authentication']
    })
  },

  async install(): Promise<void> {
    console.log('💬 Installing Slack plugin...');
  },

  async configure(config: any): Promise<void> {
    console.log('⚙️ Configuring Slack plugin...');
    // Test Slack connection
  }
};

class SlackBackendAdapter implements MCPBackendAdapter {
  private client: AxiosInstance;
  private config: MCPBackendConfig;

  constructor(config: MCPBackendConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: 'https://slack.com/api',
      headers: {
        'Authorization': `Bearer ${config.authentication.credentials.botToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
  }

  async connect(): Promise<void> {
    try {
      const response = await this.client.post('/auth.test');
      if (!response.data.ok) {
        throw new Error(`Slack auth failed: ${response.data.error}`);
      }
      console.log('✅ Connected to Slack workspace:', response.data.team);
    } catch (error) {
      throw new Error(`Failed to connect to Slack: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    console.log('🔌 Disconnected from Slack');
  }

  async getTools(): Promise<MCPTool[]> {
    return [
      {
        name: 'send_message',
        description: 'Send a message to a Slack channel or user',
        inputSchema: {
          type: 'object',
          properties: {
            channel: { type: 'string', description: 'Channel ID or name (#channel) or user ID' },
            text: { type: 'string', description: 'Message text (supports Slack formatting)' },
            blocks: { type: 'array', description: 'Rich message blocks (optional)' },
            thread_ts: { type: 'string', description: 'Reply to thread (optional)' }
          },
          required: ['channel', 'text']
        },
        backendId: this.config.id,
        category: 'messaging'
      },
      {
        name: 'get_channels',
        description: 'List all channels in the workspace',
        inputSchema: {
          type: 'object',
          properties: {
            types: { type: 'string', description: 'Channel types (public_channel,private_channel,mpim,im)' },
            exclude_archived: { type: 'boolean', description: 'Exclude archived channels' }
          }
        },
        backendId: this.config.id,
        category: 'channels'
      },
      {
        name: 'create_channel',
        description: 'Create a new Slack channel',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Channel name (lowercase, no spaces)' },
            is_private: { type: 'boolean', description: 'Create as private channel' },
            topic: { type: 'string', description: 'Channel topic (optional)' },
            purpose: { type: 'string', description: 'Channel purpose (optional)' }
          },
          required: ['name']
        },
        backendId: this.config.id,
        category: 'channels'
      },
      {
        name: 'get_users',
        description: 'List users in the workspace',
        inputSchema: {
          type: 'object',
          properties: {
            include_locale: { type: 'boolean', description: 'Include user locale information' }
          }
        },
        backendId: this.config.id,
        category: 'users'
      },
      {
        name: 'get_channel_history',
        description: 'Get message history from a channel',
        inputSchema: {
          type: 'object',
          properties: {
            channel: { type: 'string', description: 'Channel ID' },
            count: { type: 'number', description: 'Number of messages to retrieve (max 1000)' },
            latest: { type: 'string', description: 'End of time range of messages' },
            oldest: { type: 'string', description: 'Start of time range of messages' }
          },
          required: ['channel']
        },
        backendId: this.config.id,
        category: 'messaging'
      },
      {
        name: 'upload_file',
        description: 'Upload a file to Slack',
        inputSchema: {
          type: 'object',
          properties: {
            channels: { type: 'string', description: 'Comma-separated list of channel IDs' },
            file: { type: 'string', description: 'File content (base64 encoded)' },
            filename: { type: 'string', description: 'Name of the file' },
            title: { type: 'string', description: 'Title of the file' },
            initial_comment: { type: 'string', description: 'Initial comment about the file' }
          },
          required: ['file', 'filename']
        },
        backendId: this.config.id,
        category: 'files'
      },
      {
        name: 'set_channel_topic',
        description: 'Set or update a channel topic',
        inputSchema: {
          type: 'object',
          properties: {
            channel: { type: 'string', description: 'Channel ID' },
            topic: { type: 'string', description: 'New channel topic' }
          },
          required: ['channel', 'topic']
        },
        backendId: this.config.id,
        category: 'channels'
      },
      {
        name: 'add_reaction',
        description: 'Add an emoji reaction to a message',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Emoji name (without colons)' },
            channel: { type: 'string', description: 'Channel ID' },
            timestamp: { type: 'string', description: 'Message timestamp' }
          },
          required: ['name', 'channel', 'timestamp']
        },
        backendId: this.config.id,
        category: 'messaging'
      }
    ];
  }

  async callTool(name: string, args: any): Promise<any> {
    console.log(`💬 Executing Slack tool: ${name}`);

    switch (name) {
      case 'send_message':
        return this.sendMessage(args);
      case 'get_channels':
        return this.getChannels(args);
      case 'create_channel':
        return this.createChannel(args);
      case 'get_users':
        return this.getUsers(args);
      case 'get_channel_history':
        return this.getChannelHistory(args);
      case 'upload_file':
        return this.uploadFile(args);
      case 'set_channel_topic':
        return this.setChannelTopic(args);
      case 'add_reaction':
        return this.addReaction(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async authenticate(credentials: any): Promise<boolean> {
    try {
      this.client.defaults.headers['Authorization'] = `Bearer ${credentials.botToken}`;
      const response = await this.client.post('/auth.test');
      return response.data.ok;
    } catch {
      return false;
    }
  }

  async getStatus(): Promise<'connected' | 'disconnected' | 'error'> {
    try {
      const response = await this.client.post('/auth.test', {}, { timeout: 5000 });
      return response.data.ok ? 'connected' : 'error';
    } catch {
      return 'error';
    }
  }

  async healthCheck(): Promise<boolean> {
    return (await this.getStatus()) === 'connected';
  }

  // Slack-specific methods
  private async sendMessage(params: any): Promise<any> {
    const payload: any = {
      channel: params.channel,
      text: params.text
    };

    if (params.blocks) {
      payload.blocks = params.blocks;
    }
    if (params.thread_ts) {
      payload.thread_ts = params.thread_ts;
    }

    const response = await this.client.post('/chat.postMessage', payload);
    
    if (!response.data.ok) {
      throw new Error(`Failed to send message: ${response.data.error}`);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: 'Message sent successfully',
          channel: response.data.channel,
          timestamp: response.data.ts,
          permalink: `https://${response.data.team}.slack.com/archives/${response.data.channel}/p${response.data.ts.replace('.', '')}`
        }, null, 2)
      }]
    };
  }

  private async getChannels(params: any = {}): Promise<any> {
    const queryParams: any = {
      exclude_archived: params.exclude_archived !== false,
      types: params.types || 'public_channel,private_channel'
    };

    const response = await this.client.get('/conversations.list', { params: queryParams });
    
    if (!response.data.ok) {
      throw new Error(`Failed to get channels: ${response.data.error}`);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          channels: response.data.channels.map((channel: any) => ({
            id: channel.id,
            name: channel.name,
            purpose: channel.purpose?.value,
            topic: channel.topic?.value,
            is_private: channel.is_private,
            is_archived: channel.is_archived,
            member_count: channel.num_members
          })),
          total: response.data.channels.length
        }, null, 2)
      }]
    };
  }

  private async createChannel(params: any): Promise<any> {
    const payload: any = {
      name: params.name,
      is_private: params.is_private || false
    };

    const response = await this.client.post('/conversations.create', payload);
    
    if (!response.data.ok) {
      throw new Error(`Failed to create channel: ${response.data.error}`);
    }

    // Set topic and purpose if provided
    if (params.topic) {
      await this.client.post('/conversations.setTopic', {
        channel: response.data.channel.id,
        topic: params.topic
      });
    }

    if (params.purpose) {
      await this.client.post('/conversations.setPurpose', {
        channel: response.data.channel.id,
        purpose: params.purpose
      });
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `Channel "${params.name}" created successfully`,
          channel: {
            id: response.data.channel.id,
            name: response.data.channel.name,
            is_private: response.data.channel.is_private
          }
        }, null, 2)
      }]
    };
  }

  private async getUsers(params: any = {}): Promise<any> {
    const response = await this.client.get('/users.list', {
      params: { include_locale: params.include_locale }
    });
    
    if (!response.data.ok) {
      throw new Error(`Failed to get users: ${response.data.error}`);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          users: response.data.members
            .filter((user: any) => !user.deleted && !user.is_bot)
            .map((user: any) => ({
              id: user.id,
              name: user.name,
              real_name: user.real_name,
              display_name: user.profile?.display_name,
              email: user.profile?.email,
              is_admin: user.is_admin,
              is_owner: user.is_owner,
              timezone: user.tz
            })),
          total: response.data.members.length
        }, null, 2)
      }]
    };
  }

  private async getChannelHistory(params: any): Promise<any> {
    const queryParams: any = {
      channel: params.channel,
      count: Math.min(params.count || 100, 1000)
    };

    if (params.latest) queryParams.latest = params.latest;
    if (params.oldest) queryParams.oldest = params.oldest;

    const response = await this.client.get('/conversations.history', { params: queryParams });
    
    if (!response.data.ok) {
      throw new Error(`Failed to get channel history: ${response.data.error}`);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          messages: response.data.messages.map((msg: any) => ({
            user: msg.user,
            text: msg.text,
            timestamp: msg.ts,
            type: msg.type,
            thread_ts: msg.thread_ts,
            reactions: msg.reactions
          })),
          has_more: response.data.has_more,
          total: response.data.messages.length
        }, null, 2)
      }]
    };
  }

  private async uploadFile(params: any): Promise<any> {
    const formData = new FormData();
    
    // Convert base64 to buffer
    const fileBuffer = Buffer.from(params.file, 'base64');
    formData.append('file', fileBuffer, params.filename);
    
    if (params.channels) formData.append('channels', params.channels);
    if (params.title) formData.append('title', params.title);
    if (params.initial_comment) formData.append('initial_comment', params.initial_comment);

    const response = await this.client.post('/files.upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (!response.data.ok) {
      throw new Error(`Failed to upload file: ${response.data.error}`);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: 'File uploaded successfully',
          file: {
            id: response.data.file.id,
            name: response.data.file.name,
            size: response.data.file.size,
            url: response.data.file.url_private
          }
        }, null, 2)
      }]
    };
  }

  private async setChannelTopic(params: any): Promise<any> {
    const response = await this.client.post('/conversations.setTopic', {
      channel: params.channel,
      topic: params.topic
    });
    
    if (!response.data.ok) {
      throw new Error(`Failed to set channel topic: ${response.data.error}`);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: 'Channel topic updated successfully',
          topic: params.topic
        }, null, 2)
      }]
    };
  }

  private async addReaction(params: any): Promise<any> {
    const response = await this.client.post('/reactions.add', {
      name: params.name,
      channel: params.channel,
      timestamp: params.timestamp
    });
    
    if (!response.data.ok) {
      throw new Error(`Failed to add reaction: ${response.data.error}`);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `Reaction :${params.name}: added successfully`
        }, null, 2)
      }]
    };
  }
}

export default SlackPlugin;