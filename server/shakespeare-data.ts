import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from "fs";
import { XMLParser } from 'fast-xml-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Common utility functions
function safeInt(value: string | undefined): number {
  if (!value) return 0;
  value = value.toLowerCase();
  if (value === 'prologue') return 0;
  if (value === 'epilogue') return 99;
  const num = parseInt(value);
  return isNaN(num) ? 0 : num;
}

function getPlayYear(content: string): number {
  const yearMatch = content.match(/\b(15|16)\d{2}\b/);
  return yearMatch ? parseInt(yearMatch[0]) : 1600;
}

// Types
interface Work {
  id: number;
  title: string;
  type: 'play' | 'sonnet';
  year: number;
  description: string;
}

interface Passage {
  id: number;
  workId: number;
  title: string;
  content: string;
  act: number | null;
  scene: number | null;
}

// XML Parsing Configuration
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  preserveOrder: true
});

function parseSonnet(sonnetDiv: any): { title: string; content: string } | null {
  const number = sonnetDiv['@_n'];
  if (number === 'dedication') return null;

  const lines = sonnetDiv.l || [];
  const content = lines.map((line: any) => line['#text']).join('\n');

  return {
    title: `Sonnet ${number}`,
    content
  };
}

function parseScene(sceneDiv: any): string | null {
  const lines: string[] = [];
  let currentSpeaker: string | null = null;
  let currentSpeech: string[] = [];

  function addStageDirection(stage: any) {
    if (stage) {
      const stageText = `[${stage['#text']}]`;
      if (currentSpeaker) {
        currentSpeech.push(stageText);
      } else {
        lines.push(stageText);
      }
    }
  }

  function processSpeech(speech: any) {
    if (speech.speaker) {
      if (currentSpeaker && currentSpeech.length > 0) {
        lines.push(`${currentSpeaker}: ${currentSpeech.join(' ')}`);
      }
      currentSpeaker = speech.speaker['#text'];
      currentSpeech = [];
    }

    if (speech.l) {
      const speechLines = Array.isArray(speech.l) ? speech.l : [speech.l];
      speechLines.forEach((line: any) => {
        const text = line['#text'];
        if (currentSpeaker) {
          currentSpeech.push(text);
        } else {
          lines.push(text);
        }
      });
    }
  }

  // Handle stage directions
  if (sceneDiv.stage) {
    const stages = Array.isArray(sceneDiv.stage) ? sceneDiv.stage : [sceneDiv.stage];
    stages.forEach(addStageDirection);
  }

  // Handle speeches
  if (sceneDiv.sp) {
    const speeches = Array.isArray(sceneDiv.sp) ? sceneDiv.sp : [sceneDiv.sp];
    speeches.forEach(processSpeech);
  }

  // Add any remaining speech
  if (currentSpeaker && currentSpeech.length > 0) {
    lines.push(`${currentSpeaker}: ${currentSpeech.join(' ')}`);
  }

  const content = lines.join('\n').trim();
  return content || null;
}

function parsePlay(xmlContent: string): { title: string; acts: any[] } | null {
  const parsed = parser.parse(xmlContent);
  const play = parsed.PLAY || parsed.play;
  if (!play) return null;

  const title = play.TITLE?.[0]?.['#text'] || play.title?.[0]?.['#text'];
  if (!title) return null;

  const acts = [];
  const actDivs = play.ACT || play.act || [];

  for (const actDiv of actDivs) {
    const actNum = actDiv['@_n'];
    if (actNum === 'cast') continue;

    const scenes = [];
    const sceneDivs = actDiv.SCENE || actDiv.scene || [];

    for (const sceneDiv of sceneDivs) {
      const sceneNum = sceneDiv['@_n'];
      const content = parseScene(sceneDiv);

      if (content) {
        scenes.push({
          number: sceneNum,
          content
        });
      }
    }

    if (scenes.length > 0) {
      acts.push({
        number: actNum,
        scenes
      });
    }
  }

  return { title, acts };
}

// Load and parse all works
let shakespeareWorks: Work[] = [];
let passages: Passage[] = [];

try {
  const assetsDir = join(__dirname, '..', 'attached_assets');
  const files = fs.readdirSync(assetsDir);
  let workId = 1;
  let passageId = 1;

  // Process each XML file
  for (const filename of files) {
    if (!filename.endsWith('.xml')) continue;
    const filePath = join(assetsDir, filename);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Handle sonnets
    if (filename === 'son.xml') {
      const parsed = parser.parse(content);
      const sonnets = parsed.POEMS?.DIV1 || [];

      for (const sonnet of sonnets) {
        const parsed = parseSonnet(sonnet);
        if (parsed) {
          shakespeareWorks.push({
            id: workId,
            title: parsed.title,
            type: 'sonnet',
            year: 1609,
            description: parsed.content.slice(0, 50) + '...'
          });

          passages.push({
            id: passageId,
            workId,
            title: parsed.title,
            content: parsed.content,
            act: null,
            scene: null
          });

          workId++;
          passageId++;
        }
      }
      continue;
    }

    // Skip non-play files
    if (filename === 'schmidt.xml') continue;

    // Handle plays
    try {
      const play = parsePlay(content);
      if (!play) continue;

      const year = getPlayYear(content);

      shakespeareWorks.push({
        id: workId,
        title: play.title,
        type: 'play',
        year,
        description: `A ${year} play by William Shakespeare`
      });

      // Add passages for each scene
      for (const act of play.acts) {
        const actNumber = safeInt(act.number);

        for (const scene of act.scenes) {
          const sceneNumber = safeInt(scene.number);

          passages.push({
            id: passageId,
            workId,
            title: `Act ${act.number}, Scene ${scene.number}`,
            content: scene.content,
            act: actNumber,
            scene: sceneNumber
          });
          passageId++;
        }
      }

      workId++;
    } catch (error) {
      console.error(`Error processing play ${filename}:`, error);
      continue;
    }
  }

  console.log(`Loaded ${shakespeareWorks.length} works and ${passages.length} passages directly from XML`);
} catch (error) {
  console.error("Error loading Shakespeare data:", error);
}

export { shakespeareWorks, passages };