import json, sys, os
os.environ['PYTHONIOENCODING'] = 'utf-8'
from graphify.detect import detect
from pathlib import Path
result = detect(Path('.'))
sys.stdout.buffer.write(json.dumps(result, ensure_ascii=True).encode('utf-8') + b'\n')
