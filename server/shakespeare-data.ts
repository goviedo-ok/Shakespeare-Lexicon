import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let shakespeareWorks: any[] = [];
let passages: any[] = [];

try {
  // Read the generated JSON files
  const worksPath = join(__dirname, "shakespeare-works.json");
  const passagesPath = join(__dirname, "shakespeare-passages.json");

  if (fs.existsSync(worksPath) && fs.existsSync(passagesPath)) {
    shakespeareWorks = JSON.parse(fs.readFileSync(worksPath, "utf-8"));
    passages = JSON.parse(fs.readFileSync(passagesPath, "utf-8"));
    console.log(`Loaded ${shakespeareWorks.length} works and ${passages.length} passages`);
  } else {
    console.warn("Shakespeare data files not found. Please run the parser first.");
  }
} catch (error) {
  console.error("Error loading Shakespeare data:", error);
}

export { shakespeareWorks, passages };