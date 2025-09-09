MIDM_INTENT_PROMPT_1 = """아래 질문에 대한 답을 문서를 참고해 답변할 수 있는 것인지 분류하되, 반드시 JSON 형식으로 출력하라.
# 답변 가능한 질의 출력 예시
{
  "classification": true
}

# 답변 불가능한 질의 출력 예시
{
  "classification": false
}

# 질문 
<input_text>

# 문서
<document_text>"""

MIDM_INTENT_PROMPT_2 = """아래 질문에 대한 답을 문서와 관련이 있으면서 문서를 참고해 답변할 수 있는 것인지 분류하되, 반드시 JSON 형식으로 출력하라.
# 답변 가능한 질의 출력 예시
{
  "classification": true
}

# 답변 불가능한 질의 출력 예시
{
  "classification": false
}

# 질문 
<input_text>

# 문서
<document_text>"""


MIDM_EASY_PROMPT_1 = """아래 문장에 대해 의미를 훼손하지 말고, 자연스러운 문장으로 변환하되, 반드시 JSON 형식으로 출력하라.
출력 예시:
{
  "sentence": "출력 결과"
}

문장: <input_text>"""

MIDM_KEYWORD_PROMPT_1 = """아래 문장에 핵심 키워드를 10개 이내로 추출하되, 반드시 JSON 형식으로 출력하라.
출력 예시:
{
  "keyword": ["키워드_1", "키워드_2"]
}

문장: <input_text>"""

MIDM_SUMMARIZATION_PROMPT_1 = """아래 문서를 주요한 내용이 잘 유지되도록 요약하되, 반드시 JSON 형식으로 출력하라.
출력 예시:
{
  "summary": "요약 결과"
}

문장: <input_text>"""


prompt_dict = {'intent': MIDM_INTENT_PROMPT_2,
               'easy': MIDM_EASY_PROMPT_1,
               'keyword': MIDM_KEYWORD_PROMPT_1,
               'summarization': MIDM_SUMMARIZATION_PROMPT_1}

def get_prompt(keword_prompt):
    return prompt_dict[keword_prompt]
