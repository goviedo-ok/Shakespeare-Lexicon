import { loadWorkFromXML, loadLexiconFromXML } from './xml-parser';
import path from 'path';
import fs from 'fs/promises';

// Defining types for Work and Passage.  These are inferred from the original code.  Adjust if necessary.
interface Work {
  id: number;
  title: string;
  type: string;
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


// These will be populated when loaded
export let shakespeareWorks: Work[] = [];
export let passages: Passage[] = [];
export let lexicon: Record<string, string> = {};

export async function loadData() {
  try {
    // Adjust these paths to where you'll store your XML files
    const xmlDir = path.join(__dirname, '../data');

    // Load works
    const worksDir = path.join(xmlDir, 'works');
    console.log('Looking for works in:', worksDir);
    
    const workFiles = await fs.readdir(worksDir);
    console.log('Found XML files:', workFiles);
    
    shakespeareWorks = await Promise.all(
      workFiles
        .filter(file => file.endsWith('.xml'))
        .map(async file => {
          try {
            console.log('Loading work from:', file);
            const work = await loadWorkFromXML(path.join(worksDir, file));
            console.log('Loaded work:', work);
            return work;
          } catch (error) {
            console.error('Error loading work from', file, ':', error);
            throw error;
          }
        })
    );
    console.log('All works loaded:', shakespeareWorks);

    // Load passages -  This requires modification to the xml-parser to handle passages.  
    //  Placeholder for now.  The implementation will depend on the XML structure.

    // Load lexicon
    lexicon = await loadLexiconFromXML(path.join(xmlDir, 'lexicon.xml'));
  } catch (error) {
    console.error('Error loading XML data:', error);
    // Fallback to empty arrays if loading fails
    shakespeareWorks = [];
    passages = [];
    lexicon = {};
  }
}