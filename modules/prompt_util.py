MIDM_QA_PROMPT_2 = """<|begin_of_text|>[INST]아래 문서를 참고해서 답변해주세요:\n\n<document_text>\n\n다음 질문에 답하되, 반드시 JSON 형식으로 출력하라.
출력 예시:
{
  "answer": "답변 내용",
  "source": "문서에서의 답변 근거"
}
  
질문: <input_text>[/INST]"""


prompt_dict = {'midm': MIDM_QA_PROMPT_2}

def get_prompt(keword_prompt):
    return prompt_dict[keword_prompt]
