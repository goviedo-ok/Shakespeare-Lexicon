from bs4 import BeautifulSoup
import json
import os

def parse_sonnet(sonnet_div):
    """Parse a single sonnet div and return its content."""
    number = sonnet_div.get('n', '')
    if number == 'dedication': # Skip dedication
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

def parse_sonnets_file(file_path):
    """Parse the sonnets XML file and return all sonnets."""
    with open(file_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'lxml-xml')

    sonnets = []
    for div in soup.find_all('div1', type='sonnet'):
        sonnet = parse_sonnet(div)
        if sonnet:  # Skip dedication
            sonnets.append(sonnet)

    return sonnets

def parse_play_file(file_path):
    """Parse a play XML file and return the play structure."""
    with open(file_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'lxml-xml')

    return parse_play(soup)

def detect_work_type(file_path):
    """Detect if a file contains a play or sonnets."""
    with open(file_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'lxml-xml')

    # Check for sonnets
    if soup.find('div1', type='sonnet'):
        return 'sonnet'
    # Check for acts and scenes structure
    elif soup.find('div1', type='act'):
        return 'play'
    else:
        return None

def process_work_file(file_path, work_id, passage_id):
    """Process a single work file and return work and passage data."""
    work_type = detect_work_type(file_path)
    if not work_type:
        print(f"Unknown work type in file: {file_path}")
        return None, None, passage_id

    if work_type == 'play':
        play_data = parse_play_file(file_path)
        work = {
            'id': work_id,
            'title': play_data['title'],
            'type': 'play',
            'year': 1600,  # Default year, could be made more accurate
            'description': f"A {work_type} by William Shakespeare"
        }

        work_passages = []
        for act in play_data['acts']:
            for scene in act['scenes']:
                work_passages.append({
                    'id': passage_id,
                    'workId': work_id,
                    'title': f"Act {act['number']}, Scene {scene['number']}",
                    'content': scene['content'],
                    'act': int(act['number']),
                    'scene': int(scene['number'])
                })
                passage_id += 1

        return work, work_passages, passage_id

    elif work_type == 'sonnet':
        sonnets = parse_sonnets_file(file_path)
        works = []
        work_passages = []

        for sonnet in sonnets:
            works.append({
                'id': work_id,
                'title': sonnet['title'],
                'type': 'sonnet',
                'year': 1609,
                'description': sonnet['content'][:50] + '...'
            })

            work_passages.append({
                'id': passage_id,
                'workId': work_id,
                'title': sonnet['title'],
                'content': sonnet['content'],
                'act': None,
                'scene': None
            })
            work_id += 1
            passage_id += 1

        return works, work_passages, passage_id

    return None, None, passage_id

def generate_works_data():
    """Generate the full works data from XML files."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"Script directory: {script_dir}")

    # Initialize collections
    all_works = []
    all_passages = []
    work_id = 1
    passage_id = 1

    # Process all XML files in the works directory
    works_dir = os.path.join(script_dir, '..', 'attached_assets')
    for filename in os.listdir(works_dir):
        if filename.endswith('.xml'):
            file_path = os.path.join(works_dir, filename)
            print(f"Processing file: {filename}")

            works, passages, new_passage_id = process_work_file(file_path, work_id, passage_id)

            if works:
                if isinstance(works, list):
                    all_works.extend(works)
                    work_id += len(works)
                else:
                    all_works.append(works)
                    work_id += 1

            if passages:
                if isinstance(passages, list):
                    all_passages.extend(passages)
                    passage_id = new_passage_id
                else:
                    all_passages.append(passages)
                    passage_id = new_passage_id

    # Write to JSON files
    output_works = os.path.join(script_dir, 'shakespeare-works.json')
    output_passages = os.path.join(script_dir, 'shakespeare-passages.json')

    print(f"Writing works to: {output_works}")
    print(f"Writing passages to: {output_passages}")

    with open(output_works, 'w', encoding='utf-8') as f:
        json.dump(all_works, f, indent=2)

    with open(output_passages, 'w', encoding='utf-8') as f:
        json.dump(all_passages, f, indent=2)

    print(f"Generated {len(all_works)} works and {len(all_passages)} passages")

if __name__ == '__main__':
    generate_works_data()