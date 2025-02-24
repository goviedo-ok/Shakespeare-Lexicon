from bs4 import BeautifulSoup

def load_xml(file_path):
    """Loads and parses the XML file using BeautifulSoup with lxml."""
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            content = file.read()
        return BeautifulSoup(content, "lxml-xml")  # Use lxml-xml for better parsing
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return None

def find_definition(soup, word):
    """Finds and prints the definition of a given word."""
    if soup is None:
        print("Error: XML file not loaded.")
        return
    
    word_lower = word.lower()
    entries = soup.find_all("entryFree")
    
    matched_entries = []
    for entry in entries:
        key = entry.get("key", "").lower()
        if key == word_lower or key.rstrip("0123456789") == word_lower:
            matched_entries.append(entry)
    
    if matched_entries:
        for entry in matched_entries:
            orth = entry.find("orth").text if entry.find("orth") else "N/A"
            definition = entry.get_text(" ", strip=True)  # Extracts text with spacing
            print(f"\nDefinition of {orth}:")
            print(definition)

if __name__ == "__main__":
    xml_file = "schmidt.xml"  # Change this to the actual file path
    soup = load_xml(xml_file)
    
    if soup:
        while (True):
            word = input("Enter a word: ").strip()
            find_definition(soup, word)
