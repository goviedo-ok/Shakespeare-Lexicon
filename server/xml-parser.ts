
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs/promises';
import path from 'path';
import type { Work, Passage } from '@shared/schema';

const parser = new XMLParser();

export async function loadWorkFromXML(filePath: string): Promise<Work> {
  const xmlData = await fs.readFile(filePath, 'utf-8');
  const result = parser.parse(xmlData);
  // Adjust this based on your XML structure
  return {
    id: result.work.id,
    title: result.work.title,
    type: result.work.type,
    year: result.work.year,
    description: result.work.description
  };
}

export async function loadLexiconFromXML(filePath: string): Promise<Record<string, string>> {
  const xmlData = await fs.readFile(filePath, 'utf-8');
  const result = parser.parse(xmlData);
  // Adjust this based on your lexicon XML structure
  return result.lexicon.entries.reduce((acc: Record<string, string>, entry: any) => {
    acc[entry.word] = entry.definition;
    return acc;
  }, {});
}
