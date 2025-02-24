import fs from "fs";
import path from "path";

let shakespeareWorks: any[] = [];
let passages: any[] = [];

try {
  // Read the generated JSON files
  const worksPath = path.join(__dirname, "shakespeare-works.json");
  const passagesPath = path.join(__dirname, "shakespeare-passages.json");

  if (fs.existsSync(worksPath) && fs.existsSync(passagesPath)) {
    shakespeareWorks = JSON.parse(fs.readFileSync(worksPath, "utf-8"));
    passages = JSON.parse(fs.readFileSync(passagesPath, "utf-8"));
  } else {
    console.warn("Shakespeare data files not found. Please run the parser first.");
  }
} catch (error) {
  console.error("Error loading Shakespeare data:", error);
}

export { shakespeareWorks, passages };