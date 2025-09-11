import { EventEmitter } from 'events';
import { PluginMetadata } from '../types/plugin';
export interface MarketplacePlugin extends PluginMetadata {
    downloads: number;
    rating: number;
    reviews: number;
    verified: boolean;
    featured: boolean;
    pricing: {
        type: 'free' | 'paid' | 'freemium';
        price?: number;
        currency?: string;
    };
    screenshots: string[];
    documentation: string;
    changelog: string[];
}
export declare class Marketplace extends EventEmitter {
    private plugins;
    constructor();
    private initializeMarketplace;
    searchPlugins(query: string, filters?: {
        category?: string;
        pricing?: 'free' | 'paid' | 'freemium';
        rating?: number;
        featured?: boolean;
        verified?: boolean;
        sortBy?: 'downloads' | 'rating' | 'name' | 'updated';
        limit?: number;
    }): Promise<MarketplacePlugin[]>;
    getPlugin(pluginId: string): Promise<MarketplacePlugin | undefined>;
    getFeaturedPlugins(): Promise<MarketplacePlugin[]>;
    recordDownload(pluginId: string): Promise<void>;
    private loadPluginData;
    destroy(): Promise<void>;
}
//# sourceMappingURL=marketplace.d.ts.map