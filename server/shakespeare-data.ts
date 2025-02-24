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
  isArray: (name) => ['div1', 'div2', 'l', 'sp', 'speaker', 'stage'].includes(name.toLowerCase()),
  preserveOrder: false,
  parseAttributeValue: true,
  trimValues: true,
  allowBooleanAttributes: true,
  ignoreDeclaration: true,
  cdataPropName: "__cdata",
  numberParseOptions: {
    hex: true,
    leadingZeros: false
  }
});

function processSpeech(speech: any): string | null {
  try {
    const speaker = speech.speaker?.[0]?.['#text'] || speech.speaker?.['#text'];
    if (!speaker) return null;

    const lines = speech.l || [];
    const textLines = lines
      .map((line: any) => {
        let text = line['#text']?.trim();
        if (!text) return null;
        if (line['@_part'] === 'Y' || line['@_part'] === 'I') text += ' ';
        return text;
      })
      .filter(Boolean)
      .join(' ');

    return textLines ? `${speaker}: ${textLines}` : null;
  } catch (error) {
    console.error('Error processing speech:', error);
    return null;
  }
}

function parseScene(sceneDiv: any): string | null {
  try {
    const lines: string[] = [];

    // Handle stage directions
    if (sceneDiv.stage) {
      const stages = Array.isArray(sceneDiv.stage) ? sceneDiv.stage : [sceneDiv.stage];
      stages.forEach((stage: any) => {
        const stageText = stage['#text']?.trim();
        if (stageText) lines.push(`[${stageText}]`);
      });
    }

    // Handle speeches
    if (sceneDiv.sp) {
      const speeches = Array.isArray(sceneDiv.sp) ? sceneDiv.sp : [sceneDiv.sp];
      speeches.forEach((speech: any) => {
        const processedSpeech = processSpeech(speech);
        if (processedSpeech) lines.push(processedSpeech);

        // Handle stage directions within speech
        if (speech.stage) {
          const stages = Array.isArray(speech.stage) ? speech.stage : [speech.stage];
          stages.forEach((stage: any) => {
            const stageText = stage['#text']?.trim();
            if (stageText) lines.push(`[${stageText}]`);
          });
        }
      });
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
    const root = parsed['TEI.2'] || parsed.TEI;
    if (!root) {
      console.error('Invalid TEI document structure');
      return null;
    }

    const titleStmt = root.teiHeader?.fileDesc?.titleStmt;
    const title = titleStmt?.title?.[0]?.['#text'] || titleStmt?.title?.['#text'];
    if (!title) {
      console.error('No title found in play');
      return null;
    }

    const acts = [];
    const actDivs = (root.text?.body?.div1 || [])
      .filter((div: any) => div['@_type']?.toLowerCase() === 'act');

    for (const actDiv of actDivs) {
      const actNum = actDiv['@_n'];
      if (actNum === 'cast') continue;

      const scenes = [];
      const sceneDivs = (actDiv.div2 || [])
        .filter((div: any) => div['@_type']?.toLowerCase() === 'scene');

      for (const sceneDiv of sceneDivs) {
        const content = parseScene(sceneDiv);
        if (content) {
          scenes.push({
            number: sceneDiv['@_n'],
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

    return acts.length > 0 ? { title, acts } : null;
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

  for (const filename of files) {
    if (!filename.endsWith('.xml')) continue;
    console.log(`\nProcessing ${filename}...`);

    const filePath = join(assetsDir, filename);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Handle sonnets
    if (filename === 'son.xml') {
      try {
        const parsed = parser.parse(content);
        const sonnets = (parsed.POEMS?.div1 || [])
          .filter((div: any) => div['@_type'] === 'sonnet' && div['@_n'] !== 'dedication');

        console.log(`Found ${sonnets.length} sonnets`);

        for (const sonnet of sonnets) {
          const lines = (sonnet.l || [])
            .map((line: any) => line['#text']?.trim())
            .filter(Boolean)
            .join('\n');

          if (lines) {
            const title = `Sonnet ${sonnet['@_n']}`;
            shakespeareWorks.push({
              id: workId,
              title,
              type: 'sonnet',
              year: 1609,
              description: lines.slice(0, 50) + '...'
            });

            passages.push({
              id: passageId,
              workId,
              title,
              content: lines,
              act: null,
              scene: null
            });

            workId++;
            passageId++;
          }
        }
      } catch (error) {
        console.error('Error processing sonnets:', error);
      }
      continue;
    }

    // Skip lexicon file
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