import os
import sys
sys.path.append(os.path.abspath('../'))

import json

def insert_log(_example, log_dir):
    with open(log_dir, 'a', encoding='utf-8') as f:
        json.dump(_example, f, ensure_ascii=False, indent=2)
        f.write('\n')  
