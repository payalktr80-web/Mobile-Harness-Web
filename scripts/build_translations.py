import os
import glob
import xml.etree.ElementTree as ET
import json

LANG_DIRS = {
    "en": "Mobile-Harness/app/src/main/res/values",
    "ar": "Mobile-Harness/app/src/main/res/values-ar",
    "el": "Mobile-Harness/app/src/main/res/values-el",
    "es": "Mobile-Harness/app/src/main/res/values-es",
    "hi": "Mobile-Harness/app/src/main/res/values-hi",
    "ru": "Mobile-Harness/app/src/main/res/values-ru",
    "zh": "Mobile-Harness/app/src/main/res/values-zh",
}

def parse_xml_strings(dir_path):
    strings = {}
    if not os.path.exists(dir_path):
        return strings
    for file_path in glob.glob(os.path.join(dir_path, "strings*.xml")):
        try:
            tree = ET.parse(file_path)
            root = tree.getroot()
            for elem in root.findall("string"):
                name = elem.get("name")
                # Text content with unescaping
                text = elem.text or ""
                # Handle inner tags or formatting
                if len(elem):
                    text = "".join(elem.itertext())
                # Unescape standard android entities
                text = text.replace("\\'", "'").replace('\\"', '"').replace("\\n", "\n")
                if name:
                    strings[name] = text
        except Exception as e:
            print(f"Error parsing {file_path}: {e}")
    return strings

def main():
    print("Building translations from Mobile Harness Android strings.xml...")
    translations = {}
    for lang, path in LANG_DIRS.items():
        parsed = parse_xml_strings(path)
        translations[lang] = parsed
        print(f"Loaded {len(parsed)} strings for '{lang}' from {path}")

    os.makedirs("src/i18n", exist_ok=True)
    with open("src/i18n/translations.json", "w", encoding="utf-8") as f:
        json.dump(translations, f, ensure_ascii=False, indent=2)
    print("Saved src/i18n/translations.json successfully!")

if __name__ == "__main__":
    main()
