from bs4 import BeautifulSoup
import json
import os
import re

def load_xml(file_path):
    """Loads and parses the XML file using BeautifulSoup with lxml."""
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            content = file.read()
        return BeautifulSoup(content, "lxml-xml")
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

def parse_scene(scene_div):
    """Parse a single scene and return its content."""
    lines = []
    for elem in scene_div.children:
        if elem.name == 'l':
            lines.append(elem.get_text(strip=True))
        elif elem.name == 'sp':
            speaker = elem.find('speaker')
            speech = [l.get_text(strip=True) for l in elem.find_all('l')]
            if speaker and speech:
                lines.append(f"{speaker.get_text(strip=True)}: {' '.join(speech)}")

    return '\n'.join(lines)

def parse_play(soup):
    """Parse a play and return its structure with acts and scenes."""
    title = soup.find('title').get_text(strip=True)
    acts = []

    for act_div in soup.find_all('div1', type='act'):
        act_num = act_div.get('n', '')
        if act_num == 'cast':  # Skip cast list
            continue

        scenes = []
        for scene_div in act_div.find_all('div2', type='scene'):
            scene_num = scene_div.get('n', '')
            content = parse_scene(scene_div)
            scenes.append({
                'number': scene_num,
                'content': content
            })

        acts.append({
            'number': act_num,
            'scenes': scenes
        })

    return {
        'title': title,
        'acts': acts
    }

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
        if not filename.endswith('.xml'):
            continue

        file_path = os.path.join(assets_dir, filename)
        print(f"Processing {filename}...")

        # Handle sonnets
        if filename == 'son.xml':
            sonnets = parse_sonnets_file(file_path)
            for sonnet in sonnets:
                works.append({
                    'id': work_id,
                    'title': sonnet['title'],
                    'type': 'sonnet',
                    'year': 1609,  # Sonnets were published in 1609
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

        # Handle plays
        play = parse_play_file(file_path)
        if play:
            # Get play year from file content or use default
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            year = get_play_year(content)

            works.append({
                'id': work_id,
                'title': play['title'],
                'type': 'play',
                'year': year,
                'description': f"A {year} play by William Shakespeare"
            })

            # Add passages for each scene
            for act in play['acts']:
                for scene in act['scenes']:
                    passages.append({
                        'id': passage_id,
                        'workId': work_id,
                        'title': f"Act {act['number']}, Scene {scene['number']}",
                        'content': scene['content'],
                        'act': int(act['number']),
                        'scene': int(scene['number'])
                    })
                    passage_id += 1
            work_id += 1

    # Write to JSON files
    output_works = os.path.join(script_dir, 'shakespeare-works.json')
    output_passages = os.path.join(script_dir, 'shakespeare-passages.json')

    print(f"Writing works to: {output_works}")
    print(f"Writing passages to: {output_passages}")

    with open(output_works, 'w', encoding='utf-8') as f:
        json.dump(works, f, indent=2)

    with open(output_passages, 'w', encoding='utf-8') as f:
        json.dump(passages, f, indent=2)

    print(f"Generated {len(works)} works and {len(passages)} passages")

if __name__ == '__main__':
    generate_works_data()