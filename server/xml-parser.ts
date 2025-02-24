
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
    console.log('Parsed work XML:', JSON.stringify(result, null, 2));

    // Extract work ID from filename
    const id = parseInt(path.basename(filePath, '.xml'));
    
    // Handle TEI format for plays/works
    const work: Work = {
      id,
      title: result?.TEI?.teiHeader?.fileDesc?.titleStmt?.title?._text || path.basename(filePath, '.xml'),
      type: result?.TEI?.teiHeader?.fileDesc?.sourceDesc?.biblStruct?.analytic?.title?._text === 'SONNETS' ? 'sonnet' : 'play',
      year: result?.TEI?.teiHeader?.fileDesc?.sourceDesc?.biblStruct?.monogr?.imprint?.date?._text || 1600,
      description: result?.TEI?.teiHeader?.fileDesc?.sourceDesc?.biblStruct?.monogr?.title?._text || ''
    };

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
