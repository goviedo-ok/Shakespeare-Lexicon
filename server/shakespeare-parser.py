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

def parse_sonnets(file_path):
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

def generate_works_data():
    """Generate the full works data from XML files."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"Script directory: {script_dir}")

    # Parse Hamlet
    hamlet = parse_play_file(os.path.join(script_dir, '..', 'attached_assets', 'ham.xml'))

    # Parse Sonnets
    sonnets = parse_sonnets(os.path.join(script_dir, '..', 'attached_assets', 'son.xml'))

    # Generate works data
    works = []
    passages = []

    # Add Hamlet
    hamlet_id = 1
    works.append({
        'id': hamlet_id,
        'title': 'Hamlet',
        'type': 'play',
        'year': 1603,
        'description': 'The tragedy of the Prince of Denmark'
    })

    # Add Hamlet's passages (one per scene)
    passage_id = 1
    for act in hamlet['acts']:
        for scene in act['scenes']:
            passages.append({
                'id': passage_id,
                'workId': hamlet_id,
                'title': f"Act {act['number']}, Scene {scene['number']}",
                'content': scene['content'],
                'act': int(act['number']),
                'scene': int(scene['number'])
            })
            passage_id += 1

    # Add Sonnets
    for sonnet in sonnets:
        work_id = len(works) + 1
        works.append({
            'id': work_id,
            'title': sonnet['title'],
            'type': 'sonnet',
            'year': 1609,
            'description': sonnet['content'][:50] + '...'  # First 50 chars as description
        })

        # Add sonnet passage
        passages.append({
            'id': passage_id,
            'workId': work_id,
            'title': sonnet['title'],
            'content': sonnet['content'],
            'act': None,
            'scene': None
        })
        passage_id += 1

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