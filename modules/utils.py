
from collections import Counter

from fuzzywuzzy import fuzz

def are_lists_equal(A, B):
    return Counter(A) == Counter(B)

def post_processing(raw_example, clean_pattern=['</think>', '### 답변:']):
    for _clean in clean_pattern:
        if _clean in raw_example:
            raw_example = raw_example.replace(_clean, '').strip()

    return raw_example

def get_cleaned_json(raw_json_output):
    cleaned = raw_json_output.strip()

    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]  # ```json\n 제거
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]  # 마지막 ``` 제거

    return cleaned

def get_fuzz_score(str1, str2):
    score = fuzz.partial_ratio(str1, str2)

    return score 

def get_original_chunk(target_str, origin_chunk_list=[]):
    best_fuzz_score = -1
    res = None
    for origin_chunk in origin_chunk_list:
        fuzz_score = get_fuzz_score(str1=target_str, str2=origin_chunk['content'])
        if best_fuzz_score < fuzz_score:
            res = {'origin_chunk': origin_chunk, 'chunk_score': fuzz_score}
            best_fuzz_score = fuzz_score
            
    return res
            


