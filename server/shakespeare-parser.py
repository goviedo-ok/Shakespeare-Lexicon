def safe_int(value):
    """Safely convert a string to int, handling special cases."""
    if not value:
        return 0
    value = value.lower()
    if value == 'prologue':
        return 0
    if value == 'epilogue':
        return 99
    try:
        return int(value)
    except ValueError:
        return 0

from bs4 import BeautifulSoup
import json
import os
import re

def load_xml(file_path):
    """Loads and parses the XML file using BeautifulSoup with lxml."""
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            content = file.read()
        return BeautifulSoup(content, "lxml-xml")  # Use lxml-xml for better parsing
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return None

def parse_sonnet(sonnet_div):
    """Parse a single sonnet div and return its content."""
    number = sonnet_div.get('n', '')
    if number == 'dedication':  # Skip dedication
        return None

    lines = sonnet_div.find_all('l')
    content = '\n'.join(line.get_text(strip=True) for line in lines)

    return {
        'number': number,
        'title': f"Sonnet {number}",
        'content': content
    }

def get_xml_format(soup):
    """Detect the XML format type based on structure."""
    # Format 1 uses sp/speaker/l tags (like Hamlet)
    if soup.find('sp') and soup.find('speaker'):
        return "format1"
    # Format 2 uses speech/speaker1/line tags
    elif soup.find('speech') and soup.find('speaker1'):
        return "format2"
    # Default to format1 if we can't definitively determine
    return "format1"

def parse_scene_format1(scene_div):
    """Parse scene content for format 1 (like Hamlet)."""
    lines = []
    current_speech = []
    current_speaker = None

    def process_speech_part(part_elem):
        """Process a speech part, handling line continuations."""
        text = part_elem.get_text(strip=True)
        part_type = part_elem.get('part', '')
        if part_type in ['I', 'Y']:
            return text + ' '
        return text

    def add_stage_direction(stage_elem):
        """Add a stage direction to current speech or lines."""
        if stage_elem:
            stage_text = f"[{stage_elem.get_text(strip=True)}]"
            if current_speaker:
                current_speech.append(stage_text)
            else:
                lines.append(stage_text)

    def process_element(elem):
        nonlocal current_speaker, current_speech
        if elem.name == 'speaker':
            if current_speaker and current_speech:
                lines.append(f"{current_speaker}: {' '.join(current_speech)}")
            current_speaker = elem.get_text(strip=True)
            current_speech = []
        elif elem.name == 'l':
            if elem.get('part'):
                text = process_speech_part(elem)
            else:
                text = elem.get_text(strip=True)
            if current_speaker:
                current_speech.append(text)
            else:
                lines.append(text)
        elif elem.name == 'stage':
            add_stage_direction(elem)

    # First process stage directions at scene level
    for stage in scene_div.find_all('stage', recursive=False):
        add_stage_direction(stage)

    # Process all speeches and other elements
    for elem in scene_div.find_all(['sp', 'l'], recursive=True):
        if elem.name == 'sp':
            for child in elem.children:
                if isinstance(child, str):
                    continue
                process_element(child)
            if current_speaker and current_speech:
                lines.append(f"{current_speaker}: {' '.join(current_speech)}")
                current_speaker = None
                current_speech = []
        else:
            process_element(elem)

    # Add any remaining speech
    if current_speaker and current_speech:
        lines.append(f"{current_speaker}: {' '.join(current_speech)}")

    content = '\n'.join(line for line in lines if line.strip())
    return content if content.strip() else None

def parse_scene_format2(scene_div):
    """Parse scene content for format 2."""
    lines = []

    # Handle stage directions
    for stage in scene_div.find_all('stage'):
        lines.append(f"[{stage.get_text(strip=True)}]")

    # Handle dialogue sections
    for speech in scene_div.find_all('speech'):
        speaker = speech.find('speaker1')
        if speaker:
            speaker_text = speaker.get_text(strip=True)
            speech_lines = []

            # Collect all lines in the speech
            for line in speech.find_all('line'):
                text = line.get_text(strip=True)
                if text:
                    speech_lines.append(text)

            if speech_lines:
                lines.append(f"{speaker_text}: {' '.join(speech_lines)}")

    # Handle standalone lines
    for line in scene_div.find_all('line', recursive=False):
        text = line.get_text(strip=True)
        if text:
            lines.append(text)

    content = '\n'.join(line for line in lines if line.strip())
    return content if content.strip() else None

def parse_scene(scene_div, format_type):
    """Parse a single scene using the specified format."""
    if format_type == "format2":
        content = parse_scene_format2(scene_div)
        if content:
            return content

    # Try format1 as fallback
    return parse_scene_format1(scene_div)

def parse_play(soup):
    """Parse a play and return its structure with acts and scenes."""
    if not soup:
        return None

    title = soup.find('title')
    if not title:
        print("Warning: No title found in play")
        return None

    title = title.get_text(strip=True)
    print(f"Parsing play: {title}")

    # Detect format for this play
    format_type = get_xml_format(soup)
    print(f"Detected format: {format_type}")

    acts = []
    for act_div in soup.find_all('div1', type='act'):
        act_num = act_div.get('n', '')
        if act_num == 'cast':  # Skip cast list
            continue

        print(f"Parsing act {act_num}")
        scenes = []
        for scene_div in act_div.find_all('div2', type='scene'):
            scene_num = scene_div.get('n', '')
            print(f"Parsing scene {scene_num}")

            try:
                content = parse_scene(scene_div, format_type)
                if content:  # Only add scene if we have valid content
                    scenes.append({
                        'number': scene_num,
                        'content': content
                    })
                else:
                    print(f"Warning: Empty content for Act {act_num}, Scene {scene_num}")
            except Exception as e:
                print(f"Error parsing scene {scene_num} in act {act_num}: {str(e)}")
                continue

        if scenes:  # Only add act if it has scenes
            acts.append({
                'number': act_num,
                'scenes': scenes
            })
        else:
            print(f"Warning: No valid scenes found in act {act_num}")

    return {
        'title': title,
        'acts': acts
    }

def parse_sonnets_file(file_path):
    """Parse the sonnets XML file and return all sonnets."""
    soup = load_xml(file_path)
    if not soup:
        return []

    sonnets = []
    for div in soup.find_all('div1', type='sonnet'):
        sonnet = parse_sonnet(div)
        if sonnet:  # Skip dedication
            sonnets.append(sonnet)

    return sonnets

def is_play_file(filename):
    """Check if a file is a Shakespeare play XML."""
    return (filename.endswith('.xml') and 
            filename != 'son.xml' and  # Not sonnets
            filename != 'schmidt.xml')  # Not lexicon

def get_play_year(file_content):
    """Extract the approximate year from play metadata or return default."""
    # This is a simplified approach - in real data we'd want more sophisticated dating
    year_match = re.search(r'\b(15|16)\d{2}\b', file_content)
    return int(year_match.group()) if year_match else 1600

def parse_play_file(file_path):
    """Parse a play XML file and return the play structure."""
    soup = load_xml(file_path)
    if not soup:
        return None
    return parse_play(soup)

def generate_works_data():
    """Generate the full works data from XML files."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    assets_dir = os.path.join(script_dir, '..', 'attached_assets')
    print(f"Loading Shakespeare works from: {assets_dir}")

    works = []
    passages = []
    work_id = 1
    passage_id = 1

    # Process all XML files in the assets directory
    for filename in os.listdir(assets_dir):
        file_path = os.path.join(assets_dir, filename)
        print(f"\nProcessing {filename}...")

        # Handle sonnets
        if filename == 'son.xml':
            sonnets = parse_sonnets_file(file_path)
            for sonnet in sonnets:
                works.append({
                    'id': work_id,
                    'title': sonnet['title'],
                    'type': 'sonnet',
                    'year': 1609,
                    'description': sonnet['content'][:50] + '...'
                })

                passages.append({
                    'id': passage_id,
                    'workId': work_id,
                    'title': sonnet['title'],
                    'content': sonnet['content'],
                    'act': None,
                    'scene': None
                })
                work_id += 1
                passage_id += 1
            continue

        # Skip non-play files
        if not is_play_file(filename):
            continue

        # Handle plays
        try:
            # Get play year from file content
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            year = get_play_year(content)

            play = parse_play_file(file_path)
            if not play:
                print(f"Error: Failed to parse play from {filename}")
                continue

            works.append({
                'id': work_id,
                'title': play['title'],
                'type': 'play',
                'year': year,
                'description': f"A {year} play by William Shakespeare"
            })

            # Add passages for each scene
            for act in play['acts']:
                act_number = safe_int(act['number'])

                for scene in act['scenes']:
                    scene_number = safe_int(scene['number'])

                    if not scene['content']:
                        print(f"Warning: Empty content for {play['title']} Act {act_number} Scene {scene_number}")
                        continue

                    print(f"Adding scene {scene_number} from act {act_number} in {play['title']}")
                    passages.append({
                        'id': passage_id,
                        'workId': work_id,
                        'title': f"Act {act['number']}, Scene {scene['number']}",
                        'content': scene['content'],
                        'act': act_number,
                        'scene': scene_number
                    })
                    passage_id += 1

            work_id += 1
            print(f"Successfully added {play['title']}")
        except Exception as e:
            print(f"Error processing {filename}: {str(e)}")
            continue

    # Write to JSON files
    output_works = os.path.join(script_dir, 'shakespeare-works.json')
    output_passages = os.path.join(script_dir, 'shakespeare-passages.json')

    print(f"\nWriting works to: {output_works}")
    print(f"Writing passages to: {output_passages}")

    with open(output_works, 'w', encoding='utf-8') as f:
        json.dump(works, f, indent=2)

    with open(output_passages, 'w', encoding='utf-8') as f:
        json.dump(passages, f, indent=2)

    print(f"\nGenerated {len(works)} works and {len(passages)} passages")

if __name__ == '__main__':
    generate_works_data()