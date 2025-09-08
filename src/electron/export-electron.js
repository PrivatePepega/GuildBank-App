import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceFolder = __dirname;
const destinationFolder = path.join(__dirname, '..', '..', 'dist-electron');

function copyFolderRecursiveSync(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
    console.log(`Created folder: ${target}`);
  }

  const items = fs.readdirSync(source, { withFileTypes: true });

  for (const item of items) {
    const sourcePath = path.join(source, item.name);
    const targetPath = path.join(target, item.name);

    if (item.isFile() && item.name === 'main.js' || item.name === 'obfuscate.js') {
      console.log(`Skipped: ${sourcePath}`);
      continue;
    }

    if (item.isDirectory()) {
      copyFolderRecursiveSync(sourcePath, targetPath);
    } else if (item.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Copied file: ${sourcePath} to ${targetPath}`);
    }
  }
}

copyFolderRecursiveSync(sourceFolder, destinationFolder);
console.log(`Successfully copied files (except main.js) from ${sourceFolder} to ${destinationFolder}`);