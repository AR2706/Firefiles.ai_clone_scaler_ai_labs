import requests

url = "https://firefiles-ai-clone-scaler-ai-labs.onrender.com/api/meetings/upload"
files = {'file': ('test.txt', b'Alice: Hello\nBob: Hi')}
data = {'title': 'Test', 'participants': 'Alice, Bob', 'tags': 'test'}

r = requests.post(url, files=files, data=data)
print(r.status_code, r.text)
