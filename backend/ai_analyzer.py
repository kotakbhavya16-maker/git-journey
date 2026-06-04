"""
ai_analyzer.py — Uses Google Gemini AI to generate developer personality,
fun roasts, and coding journey summaries from GitHub analytics data.
"""

import google.generativeai as genai
import json
import os


def configure_gemini():
    """Configure the Gemini API with the key from environment."""
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key or api_key == "your_gemini_api_key_here":
        return False
    genai.configure(api_key=api_key)
    return True


def generate_ai_analysis(github_data):
    """
    Generate complete AI analysis: personality, roast, and journey summary.
    Returns a dict with all AI-generated content.
    """
    if not configure_gemini():
        return get_fallback_analysis(github_data)

    model = genai.GenerativeModel("gemini-2.0-flash")

    # Build context string from GitHub data
    profile = github_data["profile"]
    stats = github_data["stats"]
    languages = github_data["languages"]
    timeline = github_data["timeline"]
    top_repo = github_data.get("top_repo")
    achievements = github_data["achievements"]

    unlocked = [a["name"] for a in achievements if a["unlocked"]]
    top_langs = ", ".join([f'{l["name"]} ({l["percentage"]}%)' for l in languages[:5]])
    timeline_str = ", ".join([f'{t["year"]}: {t["repos"]} repos' for t in timeline])

    context = f"""
GitHub Profile Analysis:
- Username: {profile['username']}
- Name: {profile['name']}
- Bio: {profile['bio']}
- Location: {profile['location']}
- Total Repos: {stats['total_repos']} ({stats['original_repos']} original, {stats['forked_repos']} forked)
- Total Stars: {stats['total_stars']}
- Total Forks: {stats['total_forks']}
- Followers: {profile['followers']}
- Following: {profile['following']}
- Account Age: {stats['account_age_years']} years
- Top Languages: {top_langs}
- Yearly Activity: {timeline_str}
- Top Repo: {top_repo['name'] if top_repo else 'N/A'} ({top_repo['stars'] if top_repo else 0} stars)
- Achievements Unlocked: {', '.join(unlocked) if unlocked else 'None yet'}
"""

    prompt = f"""You are a fun, witty developer personality analyzer. Based on this GitHub profile data, generate a JSON response with EXACTLY this structure (no markdown, no code blocks, just raw JSON):

{context}

Respond with this exact JSON format:
{{
    "personality": {{
        "type_name": "A creative 3-4 word personality title (e.g., 'Night-Owl Full-Stack Hustler', 'The Silent Architect', 'Weekend Code Warrior')",
        "emoji": "One relevant emoji for the personality",
        "description": "A 2-3 sentence personality description that's fun and encouraging",
        "traits": [
            {{"name": "Consistency", "score": 75, "label": "A short label like 'Steady Builder'"}},
            {{"name": "Diversity", "score": 60, "label": "A short label like 'Explorer'"}},
            {{"name": "Impact", "score": 40, "label": "A short label like 'Rising Star'"}},
            {{"name": "Community", "score": 55, "label": "A short label like 'Team Player'"}}
        ]
    }},
    "roast": {{
        "lines": [
            "A funny but KIND observation about their coding habits (max 4 lines)",
            "Another witty observation",
            "A third humorous line",
            "A final encouraging roast line"
        ],
        "overall_vibe": "A one-line summary of their GitHub vibe"
    }},
    "journey_summary": "A 3-4 sentence professional narrative of their coding journey evolution. Make it sound like a story. Mention specific languages and patterns you notice.",
    "tips": [
        "One specific actionable improvement tip",
        "Another helpful suggestion",
        "A third tip for growth"
    ]
}}

IMPORTANT RULES:
- Be FUNNY but NEVER mean or hurtful
- Be encouraging and positive overall
- Make observations specific to their actual data (languages, stars, repos)
- Trait scores should be 0-100 and realistic based on their data
- Keep roast lines short and punchy (under 15 words each)
- Return ONLY the JSON, no other text
"""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()

        # Clean up response — remove markdown code blocks if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1]  # Remove first line
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]  # Remove last ```
        text = text.replace("```json", "").replace("```", "").strip()

        result = json.loads(text)
        return result
    except (json.JSONDecodeError, Exception) as e:
        print(f"AI Analysis Error: {e}")
        return get_fallback_analysis(github_data)


def generate_battle_analysis(data1, data2):
    """Generate AI comparison between two GitHub profiles."""
    if not configure_gemini():
        return get_fallback_battle(data1, data2)

    model = genai.GenerativeModel("gemini-2.0-flash")

    prompt = f"""Compare these two GitHub developers and give a fun, short analysis.

Developer 1: {data1['profile']['username']}
- Repos: {data1['stats']['total_repos']}, Stars: {data1['stats']['total_stars']}
- Top languages: {', '.join([l['name'] for l in data1['languages'][:3]])}
- Followers: {data1['profile']['followers']}
- Account age: {data1['stats']['account_age_years']} years

Developer 2: {data2['profile']['username']}
- Repos: {data2['stats']['total_repos']}, Stars: {data2['stats']['total_stars']}
- Top languages: {', '.join([l['name'] for l in data2['languages'][:3]])}
- Followers: {data2['profile']['followers']}
- Account age: {data2['stats']['account_age_years']} years

Respond with ONLY this JSON (no markdown):
{{
    "winner": "username of overall winner",
    "verdict": "A fun 2-sentence comparison verdict",
    "categories": [
        {{"name": "Popularity", "winner": "username", "comment": "short fun comment"}},
        {{"name": "Productivity", "winner": "username", "comment": "short fun comment"}},
        {{"name": "Diversity", "winner": "username", "comment": "short fun comment"}}
    ]
}}
"""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        print(f"Battle Analysis Error: {e}")
        return get_fallback_battle(data1, data2)


def get_fallback_analysis(github_data):
    """Fallback analysis when Gemini API is not available."""
    stats = github_data["stats"]
    languages = github_data["languages"]
    top_lang = languages[0]["name"] if languages else "Code"

    return {
        "personality": {
            "type_name": f"The {top_lang} Explorer",
            "emoji": "🚀",
            "description": f"A developer with {stats['total_repos']} repos and a passion for {top_lang}. "
                          f"With {stats['account_age_years']} years on GitHub, they're building their legacy one commit at a time.",
            "traits": [
                {"name": "Consistency", "score": min(stats['total_repos'] * 3, 90), "label": "Builder"},
                {"name": "Diversity", "score": min(stats['total_languages'] * 15, 90), "label": "Explorer"},
                {"name": "Impact", "score": min(stats['total_stars'] * 5, 90), "label": "Influencer"},
                {"name": "Community", "score": min(github_data['profile']['followers'] * 2, 90), "label": "Networker"},
            ]
        },
        "roast": {
            "lines": [
                f"{stats['total_repos']} repos? Someone's been busy! 💪",
                f"Top language is {top_lang}. A person of culture! 🎯",
                f"{stats['total_stars']} stars — every star tells a story ⭐",
                "Keep pushing code, greatness is loading... ⏳"
            ],
            "overall_vibe": f"A {top_lang} enthusiast on a coding adventure!"
        },
        "journey_summary": f"Starting their GitHub journey {stats['account_age_years']} years ago, this developer has built {stats['total_repos']} repositories. "
                          f"Their primary weapon of choice is {top_lang}, with {stats['total_stars']} stars earned along the way. "
                          f"The journey continues with new commits and new possibilities!",
        "tips": [
            "Add detailed READMEs to all your projects — it's the first thing recruiters see!",
            "Try contributing to open source projects to boost visibility",
            "Pin your best 6 repositories on your GitHub profile"
        ]
    }


def get_fallback_battle(data1, data2):
    """Fallback battle analysis."""
    u1 = data1['profile']['username']
    u2 = data2['profile']['username']
    s1 = data1['stats']['total_stars']
    s2 = data2['stats']['total_stars']
    winner = u1 if s1 >= s2 else u2

    return {
        "winner": winner,
        "verdict": f"{winner} takes the crown in this coding showdown! Both developers bring unique strengths to the table.",
        "categories": [
            {"name": "Popularity", "winner": u1 if data1['profile']['followers'] >= data2['profile']['followers'] else u2, "comment": "The people have spoken!"},
            {"name": "Productivity", "winner": u1 if data1['stats']['total_repos'] >= data2['stats']['total_repos'] else u2, "comment": "Shipping code like a machine!"},
            {"name": "Diversity", "winner": u1 if data1['stats']['total_languages'] >= data2['stats']['total_languages'] else u2, "comment": "The polyglot wins!"},
        ]
    }


def generate_profile_readme(github_data):
    """Generate an awesome GitHub profile README using Gemini AI."""
    if not configure_gemini():
        return get_fallback_readme(github_data)

    model = genai.GenerativeModel("gemini-2.0-flash")

    profile = github_data["profile"]
    stats = github_data["stats"]
    languages = github_data["languages"]
    achievements = github_data["achievements"]

    unlocked = [a["name"] for a in achievements if a["unlocked"]]
    top_langs = ", ".join([f'{l["name"]} ({l["percentage"]}%)' for l in languages[:5]])

    prompt = f"""You are a senior technical writer. Create a beautiful, modern, and highly professional GitHub Profile README in Markdown (.md format) for the following developer based on their statistics:

Developer Context:
- Name: {profile['name']} (@{profile['username']})
- Bio: {profile['bio']}
- Location: {profile['location']}
- Total Repos: {stats['total_repos']}
- Stars Earned: {stats['total_stars']}
- Top Programming Languages: {top_langs}
- Key Achievements: {', '.join(unlocked) if unlocked else 'None yet'}

Your markdown should look extremely clean, premium, and be ready to copy and paste. Use standard markdown formatting.
Include:
1. An eye-catching welcome header (e.g. "👋 Hi, I'm {profile['name']}")
2. A short, professional, and engaging "About Me" summary tailored to their profile (approx 3 sentences).
3. A visual "Tech Stack" section categorizing their languages (use simple markdown or formatting).
4. A "Stats & Highlights" section listing achievements (use emojis and clean lists).
5. A footer inviting collaboration.

Do NOT include any surrounding explanation or markdown code block wrapper (like ```markdown). Respond with ONLY the raw README markdown text.
"""
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Strip any accidental code block wraps
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.replace("```markdown", "").replace("```", "").strip()
        return {"markdown": text}
    except Exception as e:
        print(f"Readme Generation Error: {e}")
        return get_fallback_readme(github_data)


def get_fallback_readme(github_data):
    """Fallback profile README when Gemini is unavailable."""
    profile = github_data["profile"]
    stats = github_data["stats"]
    languages = github_data["languages"]

    langs_str = "\n".join([f"- **{l['name']}** - {l['percentage']}%" for l in languages[:5]])

    markdown = f"""# 👋 Hi, I'm {profile['name']} (@{profile['username']})

{profile['bio'] or 'A developer building awesome things on GitHub.'}

## 💻 Tech Stack
Here are my primary tools and programming languages:
{langs_str}

## 📊 GitHub Stats
- 📦 **{stats['total_repos']}** Repositories
- 🌟 **{stats['total_stars']}** Stars earned
- 👥 **{profile['followers']}** Followers

## 🤝 Let's Connect
Feel free to explore my repositories or get in touch for collaboration!
"""
    return {"markdown": markdown.strip()}



