from bs4 import BeautifulSoup
import json
from flask import Flask, jsonify

app = Flask(__name__)

def load_xml(file_path):
    """Loads and parses the XML file using BeautifulSoup with lxml."""
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            content = file.read()
        return BeautifulSoup(content, "lxml-xml")
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return None

def find_definition(soup, word):
    """Finds the definition of a given word."""
    if soup is None:
        return None

    word_lower = word.lower()
    entries = soup.find_all("entryFree")

    # Try exact match first
    for entry in entries:
        key = entry.get("key", "").lower()
        if key == word_lower or key.rstrip("0123456789") == word_lower:
            orth = entry.find("orth").text if entry.find("orth") else word
            definition = entry.get_text(" ", strip=True)

            return {
                "word": orth,
                "definition": definition,
                "partOfSpeech": "n/a"  # Shakespeare lexicon doesn't consistently mark parts of speech
            }

    # If no match found and word ends in 's', try singular form
    if word_lower.endswith('s'):
        singular = word_lower[:-1]
        for entry in entries:
            key = entry.get("key", "").lower()
            if key == singular or key.rstrip("0123456789") == singular:
                orth = entry.find("orth").text if entry.find("orth") else word
                definition = entry.get_text(" ", strip=True)

                return {
                    "word": orth,
                    "definition": definition,
                    "partOfSpeech": "n/a"
                }

    return None

# Load the XML file once when the server starts
soup = load_xml("attached_assets/schmidt.xml")

@app.route("/api/lexicon/<word>")
def get_definition(word):
    definition = find_definition(soup, word)
    if definition:
        return jsonify(definition)
    return jsonify({"message": "Definition not found"}), 404

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3001)