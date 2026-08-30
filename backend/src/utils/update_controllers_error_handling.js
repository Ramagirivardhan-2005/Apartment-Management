import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const controllersDir = path.join(__dirname, '..', 'controllers');

const files = fs.readdirSync(controllersDir).filter((f) => f.endsWith('.js'));

console.log(`Found ${files.length} controller files to process...`);

let totalReplacements = 0;

for (const file of files) {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Ensure (req, res) has next: e.g. async (req, res) => or async (req, res, next) =>
  // Replace `async (req, res) =>` with `async (req, res, next) =>`
  content = content.replace(/async\s*\(\s*req\s*,\s*res\s*\)\s*=>/g, 'async (req, res, next) =>');
  content = content.replace(/async\s*\(\s*req\s*,\s*res\s*,\s*next\s*\)\s*=>/g, 'async (req, res, next) =>');

  // 2. Replace `res.status(500).json({ success: false, message: error.message });` or variations with `next(error);`
  const regex500 = /res\s*\.\s*status\s*\(\s*500\s*\)\s*\.\s*json\s*\(\s*\{\s*success\s*:\s*false\s*,\s*message\s*:\s*(error|err)\s*\.\s*message\s*\}\s*\)\s*;?/g;
  
  const matches = content.match(regex500);
  if (matches) {
    totalReplacements += matches.length;
    content = content.replace(regex500, (match, errVar) => `next(${errVar});`);
  }

  // Also replace `res.status(500).json({ success: false, message: error.message || '...' });`
  const regex500Fallback = /res\s*\.\s*status\s*\(\s*500\s*\)\s*\.\s*json\s*\(\s*\{\s*success\s*:\s*false\s*,\s*message\s*:\s*(error|err)\s*\.\s*message\s*\|\|\s*['"`][^'"`]+['"`]\s*\}\s*\)\s*;?/g;
  const fallbackMatches = content.match(regex500Fallback);
  if (fallbackMatches) {
    totalReplacements += fallbackMatches.length;
    content = content.replace(regex500Fallback, (match, errVar) => `next(${errVar});`);
  }

  // Also replace `res.status(500).json({ success: false, message: '...' });` in catch blocks with `next(error);`
  const regex500CatchString = /catch\s*\(\s*(error|err)\s*\)\s*\{\s*res\s*\.\s*status\s*\(\s*500\s*\)\s*\.\s*json\s*\(\s*\{\s*success\s*:\s*false\s*,\s*message\s*:\s*['"`][^'"`]+['"`]\s*\}\s*\)\s*;?\s*\}/g;
  content = content.replace(regex500CatchString, (match, errVar) => `catch (${errVar}) {\n    next(${errVar});\n  }`);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed ${file}`);
}

console.log(`Completed refactoring across all controllers. Total 500 error replacements: ${totalReplacements}`);
