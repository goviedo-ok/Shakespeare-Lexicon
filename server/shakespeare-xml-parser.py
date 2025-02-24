from bs4 import BeautifulSoup
import json

def load_xml(file_path):
    """Loads and parses the XML file using BeautifulSoup with lxml."""
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            content = file.read()
        return BeautifulSoup(content, "lxml-xml")
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return None

def parse_play(soup):
    """Parse a play XML file and return structured data."""
    if not soup:
        return None

    # Get basic play info
    title = soup.find("title").text
    
    acts = []
    current_act = None
    
    # Find all act divisions
    for div1 in soup.find_all("div1", {"type": "act"}):
        act_num = int(div1.get("n", 0))
        act = {"number": act_num, "scenes": []}
        
        # Find all scenes in this act
        for div2 in div1.find_all("div2", {"type": "scene"}):
            scene_num = int(div2.get("n", 0))
            
            # Collect all lines in this scene
            lines = []
            for l in div2.find_all("l"):
                lines.append(l.get_text(strip=True))
            
            scene = {
                "number": scene_num,
                "content": "\n".join(lines)
            }
            act["scenes"].append(scene)
        
        acts.append(act)
    
    return {
        "title": title,
        "type": "play",
        "acts": acts
    }

def parse_sonnets(soup):
    """Parse the sonnets XML file and return structured data."""
    if not soup:
        return None

    sonnets = []
    
    # Find all sonnet divisions
    for div in soup.find_all("div1", {"type": "sonnet"}):
        sonnet_num = div.get("n")
        if sonnet_num.isdigit():  # Skip dedication
            lines = []
            for l in div.find_all("l"):
                lines.append(l.get_text(strip=True))
            
            sonnets.append({
                "number": int(sonnet_num),
                "content": "\n".join(lines)
            })
    
    return {
        "title": "Sonnets",
        "type": "sonnet_collection",
        "sonnets": sonnets
    }

def load_shakespeare_works():
    """Load all Shakespeare works from XML files."""
    works = []
    
    # Load Hamlet
    hamlet_soup = load_xml("attached_assets/ham.xml")
    if hamlet_soup:
        hamlet = parse_play(hamlet_soup)
        if hamlet:
            works.append(hamlet)
    
    # Load Sonnets
    sonnets_soup = load_xml("attached_assets/son.xml")
    if sonnets_soup:
        sonnets = parse_sonnets(sonnets_soup)
        if sonnets:
            works.append(sonnets)
    
    return works

if __name__ == "__main__":
    works = load_shakespeare_works()
    print(json.dumps(works, indent=2))
