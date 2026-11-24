import json
import re
import time
from urllib.parse import quote_plus
import requests
from bs4 import BeautifulSoup
from ddgs import DDGS




def search_web_folk_medicine(query: str) -> tuple[str, list[str]]:
    queries_to_try = [
        f"{query} ხალხური მედიცინით",
        f"{query.replace('სისხლ ძარღვების', 'სისხლძარღვების')} ხალხური მედიცინით",
        query,
    ]

    try:
        with DDGS() as ddgs:
            for q in queries_to_try:
                results = list(ddgs.text(q, max_results=4))
                snippets = []
                links = []

                for r in results:
                    body = (r.get("body") or "").strip()
                    href = (r.get("href") or "").strip()
                    if body:
                        snippets.append(body)
                        if href and href not in links:
                            links.append(href)

                if snippets:
                    answer_text = " ".join(snippets[:3])
                    if links:
                        links_formatted = "\n".join(f"- {link}" for link in links[:3])
                        answer_text = f"{answer_text}\n\nწყარო:\n{links_formatted}"
                    return answer_text, links[:3]
    except Exception as e:
        print(f"ძებნის შეცდომა: {e}")

    return (
        f"ინტერნეტში '{query} ხალხური მედიცინით' შესახებ ინფორმაცია ვერ მოიძებნა.",
        [],
    )


def extract_keywords(text: str) -> list[str]:
    words = re.findall(r"[ა-ჰa-zA-Z0-9]{3,}", text.lower())
    stop_words = {"და", "რომ", "არის", "თუ", "ან", "ხალხური", "მედიცინით", "გაწმენდა"}
    keywords = []
    for w in words:
        if w not in stop_words and w not in keywords:
            keywords.append(w)
    return keywords[:3] or [text]


def main():
    # 1. კითხვის წაკითხვა unanswered.json-დან
    with open("unanswered.json", "r", encoding="utf-8") as f:
        unanswered_data = json.load(f)

    if not unanswered_data:
        print("unanswered.json ცარიელია.")
        return

    question = unanswered_data[0]["question"].strip()
    print("ნაპოვნი კითხვა:", question)

    # 2. ინტერნეტში ძებნა
    answer_text = search_web_folk_medicine(question)

    # 3. knowledge.json-ის წაკითხვა
    with open("knowledge.json", "r", encoding="utf-8") as f:
        knowledge_data = json.load(f)

    if not isinstance(knowledge_data, list):
        knowledge_data = []

    # 4. ახალი ჩანაწერის შექმნა თქვენი ფორმატით
    answer_text, source_links = search_web_folk_medicine(question)

    new_entry = {
        "id": f"custom_{int(time.time() * 1000)}",
        "title": question,
        "category": "ხალხური მედიცინა",
        "keywords": extract_keywords(question),
        "questions": [
            question,
            f"{question} ხალხური მედიცინით",
        ],
        "sources": source_links,
        "answer": answer_text,
    }

    # 5. knowledge.json-ში ჩაწერა
    knowledge_data.append(new_entry)

    with open("knowledge.json", "w", encoding="utf-8") as f:
        json.dump(knowledge_data, f, ensure_ascii=False, indent=2)

    print("წარმატებით ჩაიწერა knowledge.json-ში!")


if __name__ == "__main__":
    main()