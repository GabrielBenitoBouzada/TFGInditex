import re
import numpy as np
import html

def strip_html(html_input: str) -> str:
    text = re.sub(r"<[^>]+>", "", html_input)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def extract_first_h2(content: str) -> str:
    match = re.search(r"<h2[^>]*>(.*?)</h2>", content, re.IGNORECASE)
    return match.group(1).strip() if match else "Curso Formativo"

def cosine_similarity(a, b):
    a = np.array(a)
    b = np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def detectar_tamano_letra(texto: str) -> str:
    match_px = re.search(r"(?:tamaño de letra|letra de tamaño)\s*(\d{1,2})", texto)
    match_pct = re.search(r"(?:letra|texto)\s*a\s*(\d{2,3})%", texto)
    if match_px:
        size = match_px.group(1)
        return f"<style>body, p, h2, h3 {{ font-size: {size}px; }}</style>"
    elif match_pct:
        pct = match_pct.group(1)
        return f"<style>body, p, h2, h3 {{ font-size: {pct}%; }}</style>"
    return ""
