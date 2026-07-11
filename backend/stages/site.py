"""Stage stub: site. JSON in -> JSON out, schema-validated (pydantic) once real.

Standalone run: python -m backend.stages.site <input_file>
"""
import json
import sys


def run(payload: dict) -> dict:
    raise NotImplementedError("stage 'site' not implemented yet")


if __name__ == "__main__":
    raw = open(sys.argv[1], encoding="utf-8").read() if len(sys.argv) > 1 else "{}"
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        payload = {"text": raw}
    print(json.dumps(run(payload), indent=2, ensure_ascii=False))
