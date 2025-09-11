"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Marketplace = void 0;
const events_1 = require("events");
class Marketplace extends events_1.EventEmitter {
    constructor() {
        super();
        this.plugins = new Map();
        this.initializeMarketplace();
    }
    async initializeMarketplace() {
        await this.loadPluginData();
    }
    async searchPlugins(query, filters) {
        let results = Array.from(this.plugins.values());
        // Apply text search
        if (query) {
            const searchTerms = query.toLowerCase().split(' ');
            results = results.filter(plugin => {
                const searchText = `${plugin.name} ${plugin.description} ${plugin.tags.join(' ')}`.toLowerCase();
                return searchTerms.every(term => searchText.includes(term));
            });
        }
        // Apply filters
        if (filters) {
            if (filters.category) {
                results = results.filter(p => p.category === filters.category);
            }
            if (filters.pricing) {
                results = results.filter(p => p.pricing.type === filters.pricing);
            }
            if (filters.rating) {
                results = results.filter(p => p.rating >= filters.rating);
            }
            if (filters.featured !== undefined) {
                results = results.filter(p => p.featured === filters.featured);
            }
            if (filters.verified !== undefined) {
                results = results.filter(p => p.verified === filters.verified);
            }
        }
        // Apply sorting
        const sortBy = filters?.sortBy || 'downloads';
        results.sort((a, b) => {
            switch (sortBy) {
                case 'downloads':
                    return b.downloads - a.downloads;
                case 'rating':
                    return b.rating - a.rating;
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'updated':
                    return b.updatedAt.getTime() - a.updatedAt.getTime();
                default:
                    return b.downloads - a.downloads;
            }
        });
        // Apply limit
        if (filters?.limit) {
            results = results.slice(0, filters.limit);
        }
        return results;
    }
    async getPlugin(pluginId) {
        return this.plugins.get(pluginId);
    }
    async getFeaturedPlugins() {
        return Array.from(this.plugins.values()).filter(p => p.featured);
    }
    async recordDownload(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (plugin) {
            plugin.downloads++;
            this.emit('plugin:downloaded', { pluginId, totalDownloads: plugin.downloads });
        }
    }
    async loadPluginData() {
        // Sample marketplace data
        const samplePlugins = [
            {
                id: 'n8n-plugin',
                name: 'N8N Workflow Automation',
                version: '1.0.0',
                description: 'Complete N8N workflow automation integration',
                author: 'Right API Team',
                license: 'MIT',
                packageName: '@right-api/n8n-plugin',
                path: './plugins/n8n',
                className: 'N8nPlugin',
                capabilities: ['workflows', 'executions', 'nodes'],
                category: 'automation',
                tags: ['n8n', 'workflow', 'automation'],
                homepage: 'https://right-api.com/plugins/n8n',
                repository: { type: 'git', url: 'https://github.com/right-api/n8n-plugin' },
                bugs: { url: 'https://github.com/right-api/n8n-plugin/issues' },
                installSize: 1024 * 1024,
                downloads: 1250,
                rating: 4.8,
                reviews: 24,
                verified: true,
                featured: true,
                pricing: { type: 'free' },
                screenshots: ['/images/n8n-plugin-1.png'],
                documentation: 'Complete N8N integration documentation',
                changelog: ['1.0.0: Initial release'],
                createdAt: new Date('2025-05-01'),
                updatedAt: new Date('2025-07-01')
            },
            {
                id: 'slack-plugin',
                name: 'Slack Workspace',
                version: '1.2.0',
                description: 'Complete Slack workspace automation and communication',
                author: 'Right API Team',
                license: 'MIT',
                packageName: '@right-api/slack-plugin',
                path: './plugins/slack',
                className: 'SlackPlugin',
                capabilities: ['messaging', 'channels', 'users'],
                category: 'communication',
                tags: ['slack', 'messaging', 'communication'],
                homepage: 'https://right-api.com/plugins/slack',
                repository: { type: 'git', url: 'https://github.com/right-api/slack-plugin' },
                bugs: { url: 'https://github.com/right-api/slack-plugin/issues' },
                installSize: 2048 * 1024,
                downloads: 987,
                rating: 4.9,
                reviews: 18,
                verified: true,
                featured: true,
                pricing: { type: 'free' },
                screenshots: ['/images/slack-plugin-1.png'],
                documentation: 'Slack workspace integration documentation',
                changelog: ['1.2.0: Added file support', '1.1.0: Enhanced messaging'],
                createdAt: new Date('2025-06-01'),
                updatedAt: new Date('2025-07-05')
            }
        ];
        for (const plugin of samplePlugins) {
            this.plugins.set(plugin.id, plugin);
        }
    }
    async destroy() {
        this.plugins.clear();
    }
}
exports.Marketplace = Marketplace;
//# sourceMappingURL=marketplace.js.map