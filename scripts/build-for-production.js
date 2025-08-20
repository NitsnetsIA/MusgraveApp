#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function buildForProduction() {
  try {
    console.log('🏗️ Building for production deployment...');
    
    // Set production environment variable
    process.env.NODE_ENV = 'production';
    process.env.VITE_GRAPHQL_ENDPOINT = 'https://pim-grocery-ia64.replit.app/graphql';
    
    console.log('📦 Running Vite build...');
    await execAsync('vite build');
    
    console.log('🔧 Building server...');
    await execAsync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist');
    
    console.log('🚀 Preparing deployment files...');
    await execAsync('node scripts/deploy-prepare.js');
    
    console.log('✅ Production build completed!');
    console.log('📡 GraphQL endpoint configured for production: https://pim-grocery-ia64.replit.app/graphql');
    console.log('📁 Files ready for deployment in dist/ directory');
    
  } catch (error) {
    console.error('❌ Production build failed:', error.message);
    process.exit(1);
  }
}

buildForProduction();