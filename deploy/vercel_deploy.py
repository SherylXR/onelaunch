"""
Vercel static deploy for OneLaunch generated sites.

Setup (do this FIRST tonight — before writing any pipeline code):
  1. vercel.com → Account Settings → Tokens → create token
  2. export VERCEL_TOKEN=xxx
  3. python deploy/vercel_deploy.py --test   # deploys a hello-world, prints URL

Usage from pipeline:
  from deploy.vercel_deploy import deploy_site
  url = deploy_site(html_string, project_slug="sarahs-business")
"""
import os, json, re, hashlib, argparse
import urllib.request

VERCEL_API = "https://api.vercel.com"

def _req(path: str, payload: dict) -> dict:
    token = os.environ["VERCEL_TOKEN"]
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{VERCEL_API}{path}", data=data, method="POST",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

def slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9-]", "-", name.lower()).strip("-")
    return re.sub(r"-{2,}", "-", s)[:52] or "onelaunch-site"

def deploy_site(html: str, project_slug: str) -> str:
    """Deploy a single-file static site. Returns the live https URL."""
    slug = slugify(project_slug)
    # Inline file upload (files under ~10MB can be sent inline as data)
    payload = {
        "name": slug,
        "files": [{"file": "index.html", "data": html}],
        "projectSettings": {"framework": None},
        "target": "production",
    }
    out = _req("/v13/deployments", payload)
    if "url" not in out:
        raise RuntimeError(f"Vercel deploy failed: {out}")
    return f"https://{out['url']}"

def fill_template(template_path: str, tokens: dict) -> str:
    html = open(template_path, encoding="utf-8").read()
    for k, v in tokens.items():
        html = html.replace("{{" + k + "}}", str(v))
    leftover = re.findall(r"\{\{[A-Z0-9_]+\}\}", html)
    if leftover:
        raise ValueError(f"Unfilled tokens: {leftover}")  # fail loud, not on stage
    return html

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--test", action="store_true")
    a = ap.parse_args()
    if a.test:
        url = deploy_site("<h1>OneLaunch deploy OK</h1>", "onelaunch-smoketest")
        print("LIVE:", url)
