import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateLatestYml(platform) {
  const outputDir = path.join(__dirname, "..", "release");
  const packageJsonPath = path.join(__dirname, "..", "package.json");

  console.log(`Generating YAML for platform: ${platform}`);
  console.log(`Output directory: ${outputDir}`);
  console.log(`package.json path: ${packageJsonPath}`);

  let version;
  try {
    const packageJsonContent = await fs.readFile(packageJsonPath, "utf8");
    const packageJson = JSON.parse(packageJsonContent);
    version = packageJson.version;
    if (!version) throw new Error("Version not found in package.json");
    console.log(`Version from package.json: ${version}`);
  } catch (error) {
    console.error(`Failed to read package.json: ${error.message}`);
    process.exit(1);
  }

  // Platform-specific file extensions and names
  const platformConfig = {
    win: {
      ext: "exe",
      possibleNames: [
        `GuildBankApp-${version}-win.exe`,
        `GuildBankApp-${version}-portable.exe`,
      ],
      ymlFile: "latest.yml",
    },
    mac: {
      ext: "dmg",
      possibleNames: [`GuildBankApp-${version}-mac.dmg`],
      ymlFile: "latest-mac.yml",
    },
    linux: {
      ext: "AppImage",
      possibleNames: [`GuildBankApp-${version}-linux.AppImage`],
      ymlFile: "latest-linux.yml",
    },
  };

  const config = platformConfig[platform];
  if (!config) {
    console.error(`Invalid platform: ${platform}. Use 'win', 'mac', or 'linux'.`);
    process.exit(1);
  }

  let fileName;
  let filePath;

  // Check for existing file in release/
  console.log(`Checking for .${config.ext} in release/`);
  try {
    const files = await fs.readdir(outputDir);
    console.log(`Files in release/: ${files.join(", ")}`);

    for (const name of config.possibleNames) {
      const potentialPath = path.join(outputDir, name);
      try {
        await fs.access(potentialPath);
        fileName = name;
        filePath = potentialPath;
        console.log(`Found .${config.ext}: ${filePath}`);
        break;
      } catch {
        // Continue to next name
      }
    }

    if (!fileName) {
      console.error(
        `File not found. Expected one of: ${config.possibleNames.join(", ")} in ${outputDir}. ` +
        `Run 'npm run dist:${platform}' first to generate the .${config.ext}.`
      );
      process.exit(1);
    }
  } catch (error) {
    console.error(`Failed to read release/ directory: ${error.message}`);
    process.exit(1);
  }

  try {
    // Read file and compute SHA512
    const fileBuffer = await fs.readFile(filePath);
    const sha512 = crypto.createHash("sha512").update(fileBuffer).digest("base64");
    const size = fileBuffer.length;

    // Create YAML content
    const latestYml = {
      version,
      files: [
        {
          url: fileName,
          sha512,
          size,
        },
      ],
      path: fileName,
      sha512,
      releaseDate: new Date().toISOString(),
    };

    // Write platform-specific YAML file
    const latestYmlPath = path.join(outputDir, config.ymlFile);
    await fs.writeFile(
      latestYmlPath,
      `version: ${latestYml.version}\n` +
        `files:\n` +
        `  - url: ${latestYml.files[0].url}\n` +
        `    sha512: ${latestYml.files[0].sha512}\n` +
        `    size: ${latestYml.files[0].size}\n` +
        `path: ${latestYml.path}\n` +
        `sha512: ${latestYml.sha512}\n` +
        `releaseDate: ${latestYml.releaseDate}`
    );

    console.log(`Generated ${config.ymlFile} at ${latestYmlPath}`);
  } catch (error) {
    console.error(`Failed to generate ${config.ymlFile}: ${error.message}`);
    process.exit(1);
  }
}

// Get platform from command-line argument
const platform = process.argv[2];
if (!["win", "mac", "linux"].includes(platform)) {
  console.error("Usage: node generate-latest-yml.js <win|mac|linux>");
  process.exit(1);
}

generateLatestYml(platform);