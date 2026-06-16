import json
transcript_path = "/Users/parthlodaya/.gemini/antigravity/brain/f986be85-eee8-4b20-8457-24c0833634d2/.system_generated/logs/transcript_full.jsonl"
with open(transcript_path, 'r') as f:
    for line in f:
        try:
            step = json.loads(line)
            if "tool_calls" in step:
                for call in step["tool_calls"]:
                    if "write" in call.get("name", ""):
                        print(json.dumps(call)[:300])
                        break
                break
        except Exception as e:
            pass
