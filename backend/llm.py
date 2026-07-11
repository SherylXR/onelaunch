"""Thin Anthropic wrapper. All stage calls go through call_stage(), which checks
the cache BEFORE touching the network and retries once on malformed JSON.
"""
import json
import os

from backend import cache
from backend.config import MODEL, PROMPTS_DIR


def _client():
    from anthropic import Anthropic  # deferred so /health works without a key
    return Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])


def load_prompt(name: str, variables: dict | None = None) -> str:
    """Load prompts/<name>.md verbatim, injecting {{variables}}."""
    text = (PROMPTS_DIR / f"{name}.md").read_text()
    for key, value in (variables or {}).items():
        text = text.replace("{{" + key + "}}", str(value))
    return text


def _call_json(system_prompt: str, user_content: str, temperature: float) -> dict:
    client = _client()
    messages = [{"role": "user", "content": user_content}]
    for attempt in range(2):
        resp = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            temperature=temperature,
            system=system_prompt,
            messages=messages,
        )
        text = resp.content[0].text
        try:
            return json.loads(text[text.index("{"): text.rindex("}") + 1])
        except (ValueError, json.JSONDecodeError) as err:
            if attempt == 1:
                raise
            messages += [
                {"role": "assistant", "content": text},
                {"role": "user", "content": f"Your JSON was malformed ({err}). Return ONLY corrected JSON."},
            ]


def call_stage(stage: str, input_obj: dict, system_prompt: str, user_content: str,
               temperature: float = 0.3) -> dict:
    """Cache-first Claude call: replay hit → no network."""
    return cache.cached_call(
        stage, input_obj,
        lambda _: _call_json(system_prompt, user_content, temperature),
    )
