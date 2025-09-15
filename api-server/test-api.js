#!/usr/bin/env node

/**
 * API Test Script
 * 
 * Simple test script to verify API endpoints work correctly
 */

const http = require('http');

const API_BASE = 'http://localhost:3001';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${API_BASE}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => reject(new Error('Request timeout')));
  });
}

async function testAPI() {
  console.log('🧪 Testing AI Document System API...\n');
  
  const tests = [
    { name: 'Health Check', path: '/health' },
    { name: 'System Stats', path: '/api/stats' },
    { name: 'Documents List', path: '/api/documents?limit=5' },
    { name: 'Search Test', path: '/api/search?q=golden&limit=3' },
    { name: 'Watch Folders', path: '/api/watch-folders' }
  ];
  
  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      const result = await makeRequest(test.path);
      
      if (result.status === 200) {
        console.log(`✅ ${test.name}: OK`);
        if (test.name === 'System Stats') {
          console.log(`   📊 Documents: ${result.data.total_documents}, Chunks: ${result.data.total_chunks}`);
        }
      } else {
        console.log(`❌ ${test.name}: HTTP ${result.status}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
  
  console.log('\n🎯 API Test Complete!');
  console.log('\n📖 Available endpoints:');
  console.log('   GET  /health                    - Health check');
  console.log('   GET  /api/stats                 - System statistics');
  console.log('   GET  /api/documents             - List documents');
  console.log('   GET  /api/documents/:id         - Get document details');
  console.log('   GET  /api/documents/:id/chunks   - Get document chunks');
  console.log('   GET  /api/search?q=term         - Search documents');
  console.log('   POST /api/search/similar        - Vector similarity search');
  console.log('   POST /api/ai/query              - AI-powered query');
  console.log('   GET  /api/watch-folders         - List watch folders');
}

if (require.main === module) {
  testAPI().catch(console.error);
}

module.exports = { makeRequest, testAPI };
