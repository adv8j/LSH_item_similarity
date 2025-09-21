import json
from pathlib import Path
from bs4 import BeautifulSoup

# Input/output files
input_file = Path("cl1.json")   # change to your file
output_file = Path("cl1_clean.json")


with input_file.open() as f:
    data = json.load(f)

def parse_html_table(html_str):
    """Extract key-value pairs from messy HTML tables (tech1, tech2)."""
    if not html_str or not html_str.strip():
        return {}

    soup = BeautifulSoup(html_str, "html.parser")
    result = {}

    for row in soup.find_all("tr"):
        th = row.find("th")
        td = row.find("td")
        if th and td:
            key = th.get_text(strip=True)
            value = td.get_text(strip=True)
            result[key] = value
    return result

cleaned = []
for item in data:
    new_item = {
        "asin": item.get("asin"),
        "title": item.get("title"),
        "brand": item.get("brand"),
        "category": item.get("category"),
        "features": item.get("feature"),
        "description": item.get("description"),
        "rank": item.get("rank"),
        "price": item.get("price"),
        "image_URL": item.get("imageURLHighRes"),
        "also_view": item.get("also_view", []),
        "also_buy": item.get("also_buy", [])
    }

    tech1 = parse_html_table(item.get("tech1", ""))
    tech2 = parse_html_table(item.get("tech2", ""))
    new_item["details"] = {**tech1, **tech2}

    cleaned.append(new_item)

# Save cleaned JSON
with output_file.open("w") as f:
    json.dump(cleaned, f, indent=2)

print(f"Cleaned {len(cleaned)} items → {output_file}")
