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
  isArray: (name) => ['DIV1', 'DIV2', 'l', 'sp', 'stage', 'speaker'].includes(name),
  preserveOrder: false,
  parseAttributeValue: true,
  trimValues: true
});

function parseSonnet(sonnetDiv: any): { title: string; content: string } | null {
  try {
    const number = sonnetDiv['@_n'];
    if (number === 'dedication') return null;

    const lines = sonnetDiv.l || [];
    const content = lines
      .filter((line: any) => line['#text'])
      .map((line: any) => line['#text'].trim())
      .join('\n');

    return {
      title: `Sonnet ${number}`,
      content
    };
  } catch (error) {
    console.error('Error parsing sonnet:', error);
    return null;
  }
}

function parseScene(sceneDiv: any): string | null {
  try {
    const lines: string[] = [];
    let currentSpeaker: string | null = null;
    let currentSpeech: string[] = [];

    // Process stage directions and speeches
    if (Array.isArray(sceneDiv.stage)) {
      sceneDiv.stage.forEach((stage: any) => {
        if (stage['#text']) {
          lines.push(`[${stage['#text'].trim()}]`);
        }
      });
    }

    if (Array.isArray(sceneDiv.sp)) {
      sceneDiv.sp.forEach((speech: any) => {
        // Handle speaker
        if (speech.speaker && speech.speaker[0]?.['#text']) {
          if (currentSpeaker && currentSpeech.length > 0) {
            lines.push(`${currentSpeaker}: ${currentSpeech.join(' ')}`);
            currentSpeech = [];
          }
          currentSpeaker = speech.speaker[0]['#text'].trim();
        }

        // Handle lines
        if (Array.isArray(speech.l)) {
          speech.l.forEach((line: any) => {
            if (line['#text']) {
              const text = line['#text'].trim();
              if (currentSpeaker) {
                currentSpeech.push(text);
              } else {
                lines.push(text);
              }
            }
          });
        }
      });
    }

    // Add any remaining speech
    if (currentSpeaker && currentSpeech.length > 0) {
      lines.push(`${currentSpeaker}: ${currentSpeech.join(' ')}`);
    }

    const content = lines.join('\n').trim();
    return content || null;
  } catch (error) {
    console.error('Error parsing scene:', error);
    return null;
  }
}

function parsePlay(xmlContent: string): { title: string; acts: any[] } | null {
  try {
    const parsed = parser.parse(xmlContent);
    const play = parsed.PLAY || parsed.play;
    if (!play) {
      console.error('No play found in XML');
      return null;
    }

    // Find title
    let title = '';
    if (play.TITLE) {
      title = Array.isArray(play.TITLE) ? play.TITLE[0]['#text'] : play.TITLE['#text'];
    } else if (play.title) {
      title = Array.isArray(play.title) ? play.title[0]['#text'] : play.title['#text'];
    }

    if (!title) {
      console.error('No title found in play');
      return null;
    }

    const acts = [];
    const actElements = play.ACT || play.act || [];
    const actArray = Array.isArray(actElements) ? actElements : [actElements];

    for (const actDiv of actArray) {
      const actNum = actDiv['@_n'];
      if (actNum === 'cast') continue;

      const scenes = [];
      const sceneElements = actDiv.SCENE || actDiv.scene || [];
      const sceneArray = Array.isArray(sceneElements) ? sceneElements : [sceneElements];

      for (const sceneDiv of sceneArray) {
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
  } catch (error) {
    console.error('Error parsing play:', error);
    return null;
  }
}

// Load and parse all works
let shakespeareWorks: Work[] = [];
let passages: Passage[] = [];

try {
  const assetsDir = join(__dirname, '..', 'attached_assets');
  console.log('Loading Shakespeare works from:', assetsDir);

  const files = fs.readdirSync(assetsDir);
  let workId = 1;
  let passageId = 1;

  // Process each XML file
  for (const filename of files) {
    if (!filename.endsWith('.xml')) continue;
    console.log(`\nProcessing ${filename}...`);

    const filePath = join(assetsDir, filename);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Handle sonnets
    if (filename === 'son.xml') {
      const parsed = parser.parse(content);
      const sonnets = parsed.POEMS?.DIV1 || [];
      console.log(`Found ${sonnets.length} sonnets`);

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
      if (!play) {
        console.error(`Failed to parse play from ${filename}`);
        continue;
      }

      console.log(`Parsing play: ${play.title}`);
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
          console.log(`Adding scene ${scene.number} from act ${act.number} in ${play.title}`);

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
      console.log(`Successfully added ${play.title}`);
    } catch (error) {
      console.error(`Error processing play ${filename}:`, error);
      continue;
    }
  }

  console.log(`\nGenerated ${shakespeareWorks.length} works and ${passages.length} passages`);
} catch (error) {
  console.error("Error loading Shakespeare data:", error);
}

export { shakespeareWorks, passages };