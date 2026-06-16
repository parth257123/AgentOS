import json
import os

transcript_path = "/Users/parthlodaya/.gemini/antigravity/brain/f986be85-eee8-4b20-8457-24c0833634d2/.system_generated/logs/transcript.jsonl"
output_dir = "/Users/parthlodaya/Downloads/AgentOs"

files_recovered = set()

with open(transcript_path, 'r') as f:
    for line in f:
        try:
            step = json.loads(line)
            if "tool_calls" in step:
                for call in step["tool_calls"]:
                    if call.get("name") in ["default_api:write_to_file", "write_to_file"]:
                        args = call.get("arguments", {})
                        target_file = args.get("TargetFile", "")
                        if "/AgentOs/src/" in target_file or "/AgentOs/server/" in target_file or target_file.endswith("package.json") or target_file.endswith("vite.config.js") or target_file.endswith("index.html"):
                            rel_path = target_file.split("AgentOs/")[-1]
                            # Let's save the latest content for each file
                            abs_path = os.path.join(output_dir, rel_path)
                            os.makedirs(os.path.dirname(abs_path), exist_ok=True)
                            with open(abs_path, 'w') as out_f:
                                out_f.write(args.get("CodeContent", ""))
                            files_recovered.add(rel_path)
        except Exception as e:
            pass

print("Recovered files:")
for f in files_recovered:
    print(f)
