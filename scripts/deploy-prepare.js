#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

async function prepareForDeployment() {
  try {
    console.log('Preparing files for static deployment...');
    
    const sourceDir = path.join(projectRoot, 'dist', 'public');
    const targetDir = path.join(projectRoot, 'dist');
    
    // Check if source directory exists
    try {
      await fs.access(sourceDir);
    } catch (error) {
      throw new Error(`Source directory ${sourceDir} does not exist. Run 'npm run build' first.`);
    }
    
    // Copy all files from dist/public to dist/
    const files = await fs.readdir(sourceDir, { withFileTypes: true });
    
    for (const file of files) {
      const sourcePath = path.join(sourceDir, file.name);
      const targetPath = path.join(targetDir, file.name);
      
      if (file.isDirectory()) {
        // Copy directory recursively
        await copyDirectory(sourcePath, targetPath);
      } else {
        // Copy file
        await fs.copyFile(sourcePath, targetPath);
        console.log(`Copied: ${file.name}`);
      }
    }
    
    // Create _redirects file for SPA routing (Replit deployments support this)
    const redirectsContent = '/* /index.html 200\n';
    await fs.writeFile(path.join(targetDir, '_redirects'), redirectsContent);
    console.log('Created _redirects file for SPA routing');
    
    console.log('✅ Deployment preparation complete!');
    console.log('Files are now ready for static deployment from the dist/ directory');
    
  } catch (error) {
    console.error('❌ Error preparing deployment:', error.message);
    process.exit(1);
  }
}

async function copyDirectory(source, target) {
  await fs.mkdir(target, { recursive: true });
  const files = await fs.readdir(source, { withFileTypes: true });
  
  for (const file of files) {
    const sourcePath = path.join(source, file.name);
    const targetPath = path.join(target, file.name);
    
    if (file.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
    } else {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
  
  console.log(`Copied directory: ${path.relative(path.join(source, '..'), target)}`);
}

prepareForDeployment();