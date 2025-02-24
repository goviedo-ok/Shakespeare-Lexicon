
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
    
    const baseId = path.basename(filePath, '.xml');
    const id = parseInt(baseId) || Math.abs(baseId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
    
    // Handle both TEI and TEI.2 formats
    const header = result?.['TEI.2']?.teiHeader || result?.TEI?.teiHeader;
    if (!header) {
      throw new Error('No TEI header found in XML');
    }

    const fileDesc = header.fileDesc;
    const title = fileDesc?.titleStmt?.title?._text;
    if (!title) {
      throw new Error('No title found in XML');
    }

    const work: Work = {
      id,
      title,
      type: 'play',
      year: 1600, // Default year if not found
      description: `A play by William Shakespeare`
    };

    console.log('Successfully loaded work:', work);
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
