#!/usr/bin/env node

// Test script for Home Assistant and N8N integrations
const axios = require('axios');
const fs = require('fs');

console.log('🧪 Testing MCP Gateway Integrations');
console.log('===================================');

// Configuration
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';
const HOME_ASSISTANT_URL = process.env.HOME_ASSISTANT_URL;
const HOME_ASSISTANT_TOKEN = process.env.HOME_ASSISTANT_TOKEN;
const N8N_URL = process.env.N8N_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

// Load environment if .env exists
if (fs.existsSync('.env')) {
    const envFile = fs.readFileSync('.env', 'utf8');
    const envVars = envFile.split('\n').filter(line => line.includes('='));
    envVars.forEach(line => {
        const [key, value] = line.split('=');
        if (key && value && !process.env[key]) {
            process.env[key] = value;
        }
    });
}

// Test functions
async function testGatewayHealth() {
    console.log('\n📊 Testing Gateway Health...');
    try {
        const response = await axios.get(`${GATEWAY_URL}/health`);
        console.log('✅ Gateway is healthy:', response.data.status);
        return true;
    } catch (error) {
        console.log('❌ Gateway health check failed:', error.message);
        return false;
    }
}

async function testHomeAssistant() {
    console.log('\n🏠 Testing Home Assistant Connection...');
    
    if (!HOME_ASSISTANT_URL || !HOME_ASSISTANT_TOKEN) {
        console.log('⚠️  Home Assistant credentials not configured');
        return false;
    }
    
    try {
        const response = await axios.get(`${HOME_ASSISTANT_URL}/api/`, {
            headers: {
                'Authorization': `Bearer ${HOME_ASSISTANT_TOKEN}`
            }
        });
        console.log('✅ Home Assistant connected:', response.data.message);
        
        // Test getting states
        const statesResponse = await axios.get(`${HOME_ASSISTANT_URL}/api/states`, {
            headers: {
                'Authorization': `Bearer ${HOME_ASSISTANT_TOKEN}`
            }
        });
        console.log(`✅ Found ${statesResponse.data.length} entities in Home Assistant`);
        
        // Show some sample entities
        const sampleEntities = statesResponse.data.slice(0, 5);
        console.log('📋 Sample entities:');
        sampleEntities.forEach(entity => {
            console.log(`   • ${entity.entity_id}: ${entity.state}`);
        });
        
        return true;
    } catch (error) {
        console.log('❌ Home Assistant connection failed:', error.message);
        return false;
    }
}

async function testN8N() {
    console.log('\n⚡ Testing N8N Connection...');
    
    if (!N8N_URL || !N8N_API_KEY) {
        console.log('⚠️  N8N credentials not configured');
        return false;
    }
    
    try {
        const response = await axios.get(`${N8N_URL}/api/v1/workflows`, {
            headers: {
                'X-N8N-API-KEY': N8N_API_KEY
            }
        });
        console.log(`✅ N8N connected: Found ${response.data.data?.length || 0} workflows`);
        
        // Show some sample workflows
        const workflows = response.data.data || [];
        if (workflows.length > 0) {
            console.log('📋 Sample workflows:');
            workflows.slice(0, 5).forEach(workflow => {
                console.log(`   • ${workflow.name} (${workflow.active ? 'Active' : 'Inactive'})`);
            });
        } else {
            console.log('📋 No workflows found - you can create some in N8N');
        }
        
        return true;
    } catch (error) {
        console.log('❌ N8N connection failed:', error.message);
        return false;
    }
}

async function testGatewayAuth() {
    console.log('\n🔐 Testing Gateway Authentication...');
    
    try {
        // Test OAuth flow
        const authResponse = await axios.post(`${GATEWAY_URL}/api/auth/oauth/authorize`, {
            tenantId: 'default',
            redirectUri: 'http://localhost:3000/callback',
            scopes: ['read', 'write']
        });
        
        if (authResponse.data.success) {
            console.log('✅ OAuth initiation working');
            
            // Test callback
            const callbackResponse = await axios.post(`${GATEWAY_URL}/api/auth/oauth/callback`, {
                code: 'demo_code',
                state: 'demo_state'
            });
            
            if (callbackResponse.data.success) {
                console.log('✅ OAuth callback working');
                console.log('🔑 Demo access token:', callbackResponse.data.accessToken);
                return callbackResponse.data.accessToken;
            }
        }
        
        return null;
    } catch (error) {
        console.log('❌ Gateway authentication failed:', error.message);
        return null;
    }
}

async function testMCPEndpoints(token) {
    console.log('\n🔌 Testing MCP Endpoints...');
    
    if (!token) {
        console.log('⚠️  No authentication token available');
        return false;
    }
    
    try {
        // Test getting backends
        const backendsResponse = await axios.get(`${GATEWAY_URL}/api/mcp/backends`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ MCP backends endpoint working');
        console.log(`📋 Available backends: ${backendsResponse.data.backends?.length || 0}`);
        
        // Test MCP RPC call
        const rpcResponse = await axios.post(`${GATEWAY_URL}/api/mcp/rpc`, {
            jsonrpc: '2.0',
            method: 'tools/list',
            params: {},
            id: 1
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (rpcResponse.data.result) {
            console.log('✅ MCP RPC endpoint working');
            console.log('📋 Sample response:', rpcResponse.data.result.message);
        }
        
        return true;
    } catch (error) {
        console.log('❌ MCP endpoints failed:', error.message);
        return false;
    }
}

async function testMarketplace() {
    console.log('\n🏪 Testing Marketplace...');
    
    try {
        const searchResponse = await axios.get(`${GATEWAY_URL}/api/marketplace/search?q=n8n`);
        
        if (searchResponse.data.success) {
            console.log('✅ Marketplace search working');
            console.log(`📋 Found ${searchResponse.data.count} plugins matching "n8n"`);
        }
        
        const statsResponse = await axios.get(`${GATEWAY_URL}/api/marketplace/stats`);
        
        if (statsResponse.data.success) {
            console.log('✅ Marketplace stats working');
            console.log(`📊 Total plugins: ${statsResponse.data.stats.totalPlugins}`);
        }
        
        return true;
    } catch (error) {
        console.log('❌ Marketplace endpoints failed:', error.message);
        return false;
    }
}

async function generateTestReport() {
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    
    const results = {
        gateway: await testGatewayHealth(),
        homeAssistant: await testHomeAssistant(),
        n8n: await testN8N(),
        auth: null,
        mcp: false,
        marketplace: await testMarketplace()
    };
    
    // Test auth and MCP together
    const token = await testGatewayAuth();
    results.auth = !!token;
    if (token) {
        results.mcp = await testMCPEndpoints(token);
    }
    
    console.log('\n🎯 Final Results:');
    console.log(`Gateway Health: ${results.gateway ? '✅' : '❌'}`);
    console.log(`Home Assistant: ${results.homeAssistant ? '✅' : '❌'}`);
    console.log(`N8N: ${results.n8n ? '✅' : '❌'}`);
    console.log(`Authentication: ${results.auth ? '✅' : '❌'}`);
    console.log(`MCP Endpoints: ${results.mcp ? '✅' : '❌'}`);
    console.log(`Marketplace: ${results.marketplace ? '✅' : '❌'}`);
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n📈 Score: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 All tests passed! Your MCP Gateway is ready to use.');
        console.log('\n🚀 Next steps:');
        console.log('   1. Configure Claude.ai to use your gateway');
        console.log('   2. Try some voice commands with Claude');
        console.log('   3. Create custom workflows in N8N');
    } else {
        console.log('\n⚠️  Some tests failed. Check the error messages above.');
        console.log('\n🔧 Troubleshooting:');
        if (!results.gateway) console.log('   • Make sure the gateway is running: docker-compose up -d');
        if (!results.homeAssistant) console.log('   • Check HOME_ASSISTANT_URL and HOME_ASSISTANT_TOKEN in .env');
        if (!results.n8n) console.log('   • Check N8N_URL and N8N_API_KEY in .env');
    }
    
    return results;
}

// Run tests
if (require.main === module) {
    generateTestReport().catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = {
    testGatewayHealth,
    testHomeAssistant,
    testN8N,
    testGatewayAuth,
    testMCPEndpoints,
    testMarketplace,
    generateTestReport
};