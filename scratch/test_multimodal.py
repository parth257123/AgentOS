from core.agentos.agent import Agent
import os
import base64

os.environ["LITELLM_LOG"] = "INFO"

def run_test():
    print("Initializing Multi-Modal VisionBot...")
    
    agent = Agent(
        name="VisionBot",
        role="Image Analyst",
        goal="Parse images and answer questions about them.",
        backstory="You have the ability to see images passed into your prompt.",
        model="ollama/glm-5.2"
    )
    
    # Generate a dummy 1x1 png image
    dummy_png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    image_path = "/Users/parthlodaya/Downloads/AgentOs/test_image.png"
    with open(image_path, "wb") as f:
        f.write(base64.b64decode(dummy_png_base64))
        
    print(f"\nSaved test image to {image_path}")
    
    prompt = "Can you describe what is in this image?"
    print(f"User: {prompt}\n")
    
    # Pass the image path directly to execute
    final_result = agent.execute(prompt, image_path=image_path)
    
    print("\n================ FINAL AGENT RESULT ================")
    print(final_result)
    print("====================================================")
    
    # Cleanup
    if os.path.exists(image_path):
        os.remove(image_path)

if __name__ == "__main__":
    run_test()
