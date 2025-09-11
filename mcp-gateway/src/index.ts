import dotenv from 'dotenv';
import { MCPGatewayApp } from './app';

// Load environment variables
dotenv.config();

class MCPGatewayServer {
  private gatewayApp: MCPGatewayApp;

  constructor() {
    this.gatewayApp = new MCPGatewayApp();
  }

  public async start(): Promise<void> {
    const port = parseInt(process.env.PORT || '3000');

    try {
      console.log('🚀 Starting Universal MCP Gateway...');
      await this.gatewayApp.start(port);
      this.setupGracefulShutdown();
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      
      try {
        // Cleanup services
        await this.gatewayApp.stop();
        console.log('✅ Gateway services cleaned up');

        console.log('👋 Shutdown complete');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });
  }
}

// Start the server
if (require.main === module) {
  const server = new MCPGatewayServer();
  server.start().catch((error) => {
    console.error('💥 Fatal error starting server:', error);
    process.exit(1);
  });
}

export default MCPGatewayServer;