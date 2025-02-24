import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from "fs";
import xml2js from 'xml2js';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure XML parser with more lenient options
const parser = new xml2js.Parser({
  strict: false,
  trim: true,
  normalize: true,
  explicitRoot: true,
  explicitArray: false,
  mergeAttrs: false,
  attrNameProcessors: [(name) => name.toLowerCase()],
  attrValueProcessors: [(value) => value?.toString()],
  valueProcessors: [(value) => value?.toString()],
  xmlns: true
});

const parseXML = promisify(parser.parseString).bind(parser);

export interface Work {
  id: number;
  title: string;
  type: 'play' | 'sonnet';
  year: number;
  description: string;
}

export interface Passage {
  id: number;
  workId: number;
  title: string;
  content: string;
  act: number | null;
  scene: number | null;
}

function safeInt(value: string | undefined): number {
  if (!value) return 0;
  const lowered = value.toLowerCase();
  if (lowered === 'prologue') return 0;
  if (lowered === 'epilogue') return 99;
  const num = parseInt(value);
  return isNaN(num) ? 0 : num;
}

async function preprocessXMLContent(content: string): Promise<string> {
  // Replace problematic entities with their Unicode equivalents
  return content
    .replace(/&AElig;/g, 'Æ')
    .replace(/&aelig;/g, 'æ')
    .replace(/&szlig;/g, 'ß')
    .replace(/&[lr]squo;/g, "'")
    .replace(/&[lr]dquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&[A-Za-z]+;/g, ''); // Strip any remaining entities as fallback
}

async function loadXMLFile(filePath: string): Promise<any> {
  try {
    console.log(`Loading XML file: ${filePath}`);
    let content = await fs.promises.readFile(filePath, 'utf-8');
    content = await preprocessXMLContent(content);
    return await parseXML(content);
  } catch (error) {
    console.error(`Error loading XML file ${filePath}:`, error);
    return null;
  }
}

async function getPlayYear(xmlContent: string): Promise<number> {
  const match = xmlContent.match(/\b(15|16)\d{2}\b/);
  return match ? parseInt(match[0]) : 1600;
}

async function parseScene(sceneElement: any): Promise<string | null> {
  try {
    const lines: string[] = [];

    // Handle stage directions
    const stages = sceneElement.stage || [];
    (Array.isArray(stages) ? stages : [stages]).forEach((stage: any) => {
      if (stage && stage._) {
        lines.push(`[${stage._}]`);
      }
    });

    // Handle speeches
    const speeches = sceneElement.sp || [];
    (Array.isArray(speeches) ? speeches : [speeches]).forEach((speech: any) => {
      const speaker = speech.speaker?.[0];
      const speechLines: string[] = [];

      // Handle lines within speech
      const speechContent = speech.l || [];
      (Array.isArray(speechContent) ? speechContent : [speechContent]).forEach((line: any) => {
        if (typeof line === 'string') {
          speechLines.push(line);
        } else if (line && line._) {
          speechLines.push(line._);
        }
      });

      if (speaker && speechLines.length > 0) {
        lines.push(`${speaker}: ${speechLines.join(' ')}`);
      }
    });

    const content = lines.join('\n').trim();
    return content || null;
  } catch (error) {
    console.error('Error parsing scene:', error);
    return null;
  }
}

let cachedWorks: Work[] = [];
let cachedPassages: Passage[] = [];
let isLoading = false;

async function loadShakespeareData() {
  if (isLoading) return;
  isLoading = true;

  try {
    const assetsDir = join(__dirname, '..', 'attached_assets');
    const files = await fs.promises.readdir(assetsDir);

    let workId = 1;
    let passageId = 1;
    const works: Work[] = [];
    const passages: Passage[] = [];

    // Handle plays first (skip sonnets and lexicon)
    for (const filename of files) {
      if (!filename.endsWith('.xml') || filename === 'son.xml' || filename === 'schmidt.xml') {
        continue;
      }

      const filePath = join(assetsDir, filename);
      console.log(`Processing ${filename}...`);

      try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const year = await getPlayYear(content);
        const playXml = await loadXMLFile(filePath);

        if (!playXml?.['TEI.2']?.teiHeader?.[0]?.fileDesc?.[0]?.titleStmt?.[0]?.title?.[0]) {
          console.warn(`Missing title information in ${filename}`);
          continue;
        }

        const title = playXml['TEI.2'].teiHeader[0].fileDesc[0].titleStmt[0].title[0];
        console.log(`Found play: ${title}`);

        works.push({
          id: workId,
          title,
          type: 'play',
          year,
          description: `A ${year} play by William Shakespeare`
        });

        const acts = playXml['TEI.2']?.text?.[0]?.body?.[0]?.div1 || [];
        for (const act of acts) {
          if (act?.['$']?.type !== 'act' || act?.['$']?.n === 'cast') continue;

          const actNumber = safeInt(act?.['$']?.n);
          const scenes = act.div2 || [];

          for (const scene of scenes) {
            if (scene?.['$']?.type !== 'scene') continue;

            const sceneNumber = safeInt(scene?.['$']?.n);
            const content = await parseScene(scene);

            if (content) {
              passages.push({
                id: passageId++,
                workId,
                title: `Act ${act?.['$']?.n}, Scene ${scene?.['$']?.n}`,
                content,
                act: actNumber,
                scene: sceneNumber
              });
            }
          }
        }

        workId++;
      } catch (error) {
        console.error(`Error processing ${filename}:`, error);
      }
    }

    console.log(`Loaded ${works.length} plays`);
    cachedWorks = works;
    cachedPassages = passages;

  } catch (error) {
    console.error('Error loading Shakespeare data:', error);
  } finally {
    isLoading = false;
  }
}

// Load data initially
loadShakespeareData();

export const shakespeareWorks = cachedWorks;
export const passages = cachedPassages;