import { copyFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const distDir = resolve(rootDir, 'dist');

// Ensure dist directory exists
if (!existsSync(distDir)) {
  console.error('Error: dist folder does not exist. Run "npm run build" first.');
  process.exit(1);
}

// Copy _headers and _redirects to dist
const filesToCopy = ['_headers', '_redirects'];

filesToCopy.forEach(file => {
  const sourceFile = resolve(rootDir, file);
  const destFile = resolve(distDir, file);
  
  if (existsSync(sourceFile)) {
    try {
      copyFileSync(sourceFile, destFile);
      console.log(`✓ Copied ${file} to dist/`);
    } catch (error) {
      console.error(`✗ Failed to copy ${file}:`, error.message);
    }
  } else {
    console.warn(`⚠ Warning: ${file} not found in root directory`);
  }
});

console.log('\n✓ Cloudflare files copied successfully!');

