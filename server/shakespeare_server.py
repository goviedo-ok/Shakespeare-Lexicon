from flask import Flask, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename
import os
from shakespeare_xml_parser import load_shakespeare_works, load_xml, parse_play, parse_sonnets
from bs4 import BeautifulSoup

app = Flask(__name__)

# Configure upload folder
UPLOAD_FOLDER = 'attached_assets'
ALLOWED_EXTENSIONS = {'xml'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Load the lexicon
def load_lexicon():
    return load_xml("attached_assets/schmidt.xml")

lexicon_soup = load_lexicon()
shakespeare_works = load_shakespeare_works()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def find_definition(word):
    """Finds the definition of a given word."""
    if lexicon_soup is None:
        return None

    word_lower = word.lower()
    entries = lexicon_soup.find_all("entryFree")

    # Try exact match first
    for entry in entries:
        key = entry.get("key", "").lower()
        if key == word_lower or key.rstrip("0123456789") == word_lower:
            orth = entry.find("orth").text if entry.find("orth") else word
            definition = entry.get_text(" ", strip=True)

            return {
                "word": orth,
                "definition": definition,
                "partOfSpeech": "n/a"
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

@app.route("/api/lexicon/<word>")
def get_definition(word):
    definition = find_definition(word)
    if definition:
        return jsonify(definition)
    return jsonify({"message": "Definition not found"}), 404

@app.route("/api/works")
def get_works():
    return jsonify(shakespeare_works)

@app.route("/api/upload", methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"message": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"message": "No selected file"}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Parse the new file
        new_work_soup = load_xml(filepath)
        if filename.startswith('son'):
            new_work = parse_sonnets(new_work_soup)
        else:
            new_work = parse_play(new_work_soup)
        
        if new_work:
            shakespeare_works.append(new_work)
            return jsonify({"message": "File uploaded and parsed successfully"})
        
        return jsonify({"message": "Failed to parse file"}), 400
    
    return jsonify({"message": "File type not allowed"}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3001)
