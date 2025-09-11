import { Router } from 'express';
import { Marketplace, MarketplacePlugin } from '../services/marketplace';
import { PluginManager } from '../services/plugin-manager';
import { AuthService } from '../services/auth-service';

export function createMarketplaceRoutes(
  marketplace: Marketplace,
  pluginManager: PluginManager,
  authService: AuthService
): Router {
  const router = Router();

  // Authentication middleware
  const authenticateToken = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const gatewayToken = await authService.validateToken(token);
    if (!gatewayToken) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = { token: gatewayToken };
    next();
  };

  // Search plugins
  router.get('/search', async (req, res) => {
    try {
      const {
        q: query,
        category,
        pricing,
        rating,
        featured,
        verified,
        sortBy,
        limit
      } = req.query;

      const filters: any = {};
      
      if (category) filters.category = category;
      if (pricing) filters.pricing = pricing;
      if (rating) filters.rating = parseFloat(rating as string);
      if (featured !== undefined) filters.featured = featured === 'true';
      if (verified !== undefined) filters.verified = verified === 'true';
      if (sortBy) filters.sortBy = sortBy;
      if (limit) filters.limit = parseInt(limit as string);

      const plugins = await marketplace.searchPlugins(query as string || '', filters);

      res.json({
        success: true,
        results: plugins,
        count: plugins.length,
        query: query || '',
        filters
      });

    } catch (error: any) {
      console.error('Plugin search failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search plugins',
        message: error?.message || 'Unknown error'
      });
    }
  });

  // Get featured plugins
  router.get('/featured', async (req, res) => {
    try {
      const featuredPlugins = await marketplace.getFeaturedPlugins();

      res.json({
        success: true,
        plugins: featuredPlugins,
        count: featuredPlugins.length
      });

    } catch (error: any) {
      console.error('Failed to get featured plugins:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get featured plugins',
        message: error?.message || 'Unknown error'
      });
    }
  });

  // Get plugin details
  router.get('/plugins/:pluginId', async (req, res) => {
    try {
      const { pluginId } = req.params;
      const plugin = await marketplace.getPlugin(pluginId);

      if (!plugin) {
        return res.status(404).json({
          success: false,
          error: 'Plugin not found'
        });
      }

      res.json({
        success: true,
        plugin
      });

    } catch (error: any) {
      console.error('Failed to get plugin:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get plugin details',
        message: error?.message || 'Unknown error'
      });
    }
  });

  // Install plugin (authenticated)
  router.post('/plugins/:pluginId/install', authenticateToken, async (req, res) => {
    try {
      const { pluginId } = req.params;
      const plugin = await marketplace.getPlugin(pluginId);

      if (!plugin) {
        return res.status(404).json({
          success: false,
          error: 'Plugin not found'
        });
      }

      // Install the plugin
      const result = await pluginManager.installPlugin(plugin.packageName);

      if (result.success) {
        // Record download
        await marketplace.recordDownload(pluginId);

        res.json({
          success: true,
          message: `Plugin ${plugin.name} installed successfully`,
          plugin: result.plugin
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Plugin installation failed',
          message: result.error
        });
      }

    } catch (error: any) {
      console.error('Plugin installation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Plugin installation failed',
        message: error?.message || 'Unknown error'
      });
    }
  });

  // Uninstall plugin (authenticated)
  router.delete('/plugins/:pluginId', authenticateToken, async (req, res) => {
    try {
      const { pluginId } = req.params;
      const plugin = await marketplace.getPlugin(pluginId);

      if (!plugin) {
        return res.status(404).json({
          success: false,
          error: 'Plugin not found'
        });
      }

      // Uninstall the plugin
      const result = await pluginManager.uninstallPlugin(plugin.packageName);

      if (result.success) {
        res.json({
          success: true,
          message: `Plugin ${plugin.name} uninstalled successfully`
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Plugin uninstallation failed',
          message: result.error
        });
      }

    } catch (error: any) {
      console.error('Plugin uninstallation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Plugin uninstallation failed',
        message: error?.message || 'Unknown error'
      });
    }
  });

  // Get installed plugins (authenticated)
  router.get('/installed', authenticateToken, async (req, res) => {
    try {
      const installedPlugins = pluginManager.getInstalledPlugins();

      res.json({
        success: true,
        plugins: installedPlugins,
        count: installedPlugins.length
      });

    } catch (error: any) {
      console.error('Failed to get installed plugins:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get installed plugins',
        message: error?.message || 'Unknown error'
      });
    }
  });

  // Get plugin categories
  router.get('/categories', async (req, res) => {
    try {
      // Get all plugins and extract unique categories
      const allPlugins = await marketplace.searchPlugins('');
      const categories = [...new Set(allPlugins.map(p => p.category))];

      res.json({
        success: true,
        categories: categories.map(category => ({
          id: category,
          name: category.charAt(0).toUpperCase() + category.slice(1),
          count: allPlugins.filter(p => p.category === category).length
        }))
      });

    } catch (error: any) {
      console.error('Failed to get categories:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get plugin categories',
        message: error?.message || 'Unknown error'
      });
    }
  });

  // Get marketplace stats
  router.get('/stats', async (req, res) => {
    try {
      const allPlugins = await marketplace.searchPlugins('');
      const totalDownloads = allPlugins.reduce((sum, p) => sum + p.downloads, 0);
      const averageRating = allPlugins.reduce((sum, p) => sum + p.rating, 0) / allPlugins.length;

      const stats = {
        totalPlugins: allPlugins.length,
        totalDownloads,
        averageRating: parseFloat(averageRating.toFixed(2)),
        featuredPlugins: allPlugins.filter(p => p.featured).length,
        verifiedPlugins: allPlugins.filter(p => p.verified).length,
        freePlugins: allPlugins.filter(p => p.pricing.type === 'free').length,
        paidPlugins: allPlugins.filter(p => p.pricing.type === 'paid').length,
        categories: [...new Set(allPlugins.map(p => p.category))].length
      };

      res.json({
        success: true,
        stats
      });

    } catch (error: any) {
      console.error('Failed to get marketplace stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get marketplace statistics',
        message: error?.message || 'Unknown error'
      });
    }
  });

  // Health check
  router.get('/health', (req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      marketplace: 'operational'
    });
  });

  return router;
}