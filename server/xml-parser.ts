
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs/promises';
import path from 'path';
import type { Work, Passage } from '@shared/schema';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "_text"
});

export async function loadWorkFromXML(filePath: string): Promise<Work> {
  try {
    const xmlData = await fs.readFile(filePath, 'utf-8');
    console.log('Reading work file:', filePath);
    const result = parser.parse(xmlData);
    
    // Get filename without extension (e.g., "ham" from "ham.xml")
    const baseId = path.basename(filePath, '.xml');
    // Generate numeric ID from filename
    const id = parseInt(baseId) || Math.abs(baseId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
    
    // Handle TEI.2 format used in Shakespeare plays
    const fileDesc = result?.TEI?.teiHeader?.fileDesc || result?.['TEI.2']?.teiHeader?.fileDesc;
    const title = fileDesc?.titleStmt?.title?._text || '';
    const author = fileDesc?.titleStmt?.author?._text || 'William Shakespeare';
    const sourceDesc = fileDesc?.sourceDesc?.biblStruct?.monogr;
    
    const work: Work = {
      id,
      title,
      type: 'play', // Since these are all plays for now
      year: sourceDesc?.imprint?.date?._text || 1600,
      description: `A play by ${author}, published by ${sourceDesc?.publisher?._text || 'unknown publisher'}`
    };

    console.log('Loaded work:', work);
    return work;
  } catch (error) {
    console.error('Error parsing work XML:', filePath, error);
    throw error;
  }
}

export async function loadLexiconFromXML(filePath: string): Promise<Record<string, string>> {
  try {
    const xmlData = await fs.readFile(filePath, 'utf-8');
    console.log('Reading lexicon file:', filePath);
    const result = parser.parse(xmlData);
    console.log('Parsed lexicon XML:', JSON.stringify(result, null, 2));

    // Handle TEI dictionary format
    const entries = result?.TEI?.text?.body?.entryFree || [];
    return entries.reduce((acc: Record<string, string>, entry: any) => {
      const word = entry?.orth?._text || '';
      const definition = entry?._text || '';
      if (word) {
        acc[word.toLowerCase()] = definition;
      }
      return acc;
    }, {});
  } catch (error) {
    console.error('Error parsing lexicon XML:', filePath, error);
    throw error;
  }
}
