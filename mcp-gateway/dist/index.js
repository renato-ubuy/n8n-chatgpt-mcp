"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = require("./app");
// Load environment variables
dotenv_1.default.config();
class MCPGatewayServer {
    constructor() {
        this.gatewayApp = new app_1.MCPGatewayApp();
    }
    async start() {
        const port = parseInt(process.env.PORT || '3000');
        try {
            console.log('🚀 Starting Universal MCP Gateway...');
            await this.gatewayApp.start(port);
            this.setupGracefulShutdown();
        }
        catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }
    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
            try {
                // Cleanup services
                await this.gatewayApp.stop();
                console.log('✅ Gateway services cleaned up');
                console.log('👋 Shutdown complete');
                process.exit(0);
            }
            catch (error) {
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
exports.default = MCPGatewayServer;
//# sourceMappingURL=index.js.map