import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JsConfuser from 'js-confuser';
import dotenv from 'dotenv';

// Load .env with absolute path
const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error(`Error: .env file not found at ${envPath}`);
  process.exit(1);
}
dotenv.config({ path: envPath });
console.log(`dotenv loaded, SECRET: ${process.env.SECRET ? "[set]" : "undefined"}, GH_TOKEN: ${process.env.GH_TOKEN ? '[set]' : 'undefined'}`);
console.log(`dotenv loaded, AddonHash: ${process.env.ADDONHASH ? "[set]" : "undefined"}, VanillaHash: ${process.env.VANILLAHASH ? '[set]' : 'undefined'}`);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.join(__dirname, 'main.js');
const outputFile = path.join(__dirname, '..', '..', 'dist-electron', 'main-obfuscated.js');

// Read main.js
let code = fs.readFileSync(inputFile, 'utf8');

// Replace placeholders with SECRET and GH_TOKEN from .env
const secret = process.env.SECRET;
const ghToken = process.env.GH_TOKEN;
const AddonHash = process.env.ADDONHASH;
const VanillaHash = process.env.VANILLAHASH;



if (!secret) {
  console.error('Error: SECRET not found in .env');
  process.exit(1);
}
if (!ghToken) {
  console.error('Error: GH_TOKEN not found in .env');
  process.exit(1);
}
if (!AddonHash) {
  console.error('Error: AddonHash not found in .env');
  process.exit(1);
}
if (!VanillaHash) {
  console.error('Error: VanillaHash not found in .env');
  process.exit(1);
}







code = code.replace("'HARDCODED_SECRET_PLACEHOLDER'", `'${secret}'`);
code = code.replace("'HARDCODED_GH_TOKEN_PLACEHOLDER'", `'${ghToken}'`);
code = code.replace("'HARDCODED_ADDONHASH_PLACEHOLDER'", `'${AddonHash}'`);
code = code.replace("'HARDCODED_VANILLAHASH_PLACEHOLDER'", `'${VanillaHash}'`);


// Obfuscate using js-confusern
(async () => {
  try {
    const result = await JsConfuser.obfuscate(code, {
      target: 'node', // For Electron main process
      preset: 'high', // Maximum obfuscation
      stringEncoding: true, // Encode strings to protect const secret
      stringConcealing: true, // Further hide strings
      stringSplitting: true, // Split strings for added complexity
      controlFlowFlattening: true, // Obscure code flow
      deadCode: true, // Inject dead code
      identifierGenerator: 'mangled', // Short, unreadable variable names
      globalConcealing: true // Hide global variables
    });

    // Ensure dist-electron exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write obfuscated code
    fs.writeFileSync(outputFile, result.code); // Use result.code instead of result
    console.log('Obfuscation complete:', outputFile);
  } catch (error) {
    console.error('Obfuscation failed:', error);
    process.exit(1);
  }
})();