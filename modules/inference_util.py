import os
import sys
sys.path.append(os.path.abspath('../'))

import json

from vllm import LLM, SamplingParams 

import torch

import asyncio

from transformers import AutoTokenizer

from modules.utils import get_cleaned_json, post_processing

class InferenceModule(object):
    def __init__(self, inference_model, model_name, max_model_len, gpu_memory_utilization=0.9):
        self.inference_module = LLM(model=inference_model, tokenizer=model_name, tokenizer_mode='auto',
                                    max_model_len=max_model_len, gpu_memory_utilization=gpu_memory_utilization, dtype=torch.float16)
        
        self.semaphore = asyncio.Semaphore(2)
        
        print(f'Inference Module Initialized')

    def get_input_format(self, prompt_text, replace_content: dict):
        for _key, _content in replace_content.items():
            prompt_text = prompt_text.replace(_key, _content)

        return prompt_text
    
    async def async_generate(self, module_input, sampling_params):
        async with self.semaphore:
            return await asyncio.to_thread(
                self.inference_module.generate, module_input, sampling_params=sampling_params)
        
    async def run_inference(self, module_input, involve_keys, temperature, top_p, generation_max_token, stop, max_retries=3):
        print(f'Inference Start!')

        status, msg, hypothesis = 'success', 'success', None

        for attempt in range(max_retries):
            sampling_params = SamplingParams(temperature=temperature, top_p=top_p-(attempt * 0.1), max_tokens=generation_max_token, stop=stop)

            try:
                print(f'Model Inference | attempt: {attempt + 1} | Async')
                hypothesis = await self.async_generate(module_input=module_input, sampling_params=sampling_params)
                hypothesis = hypothesis[0].outputs[0].text.strip()

            except Exception as e:
                msg = f'Model Inference Error ({e}) | retries: {attempt + 1}'
                status = 'error'
                hypothesis = None
                print(msg)
                continue

            if not isinstance(hypothesis, str):
                msg = f'Model Inference Type Error | type: {type(hypothesis)} | retries: {attempt + 1}'
                status = 'error'
                hypothesis = None
                print(msg)
                continue

            hypothesis = post_processing(raw_example=hypothesis, clean_pattern=['</think>', '### 답변:', '# 답변:', '답변'])    
            hypothesis = get_cleaned_json(raw_json_output=hypothesis)

            try:
                hypothesis = json.loads(hypothesis)
            except Exception as e:
                msg = f'Model Inference Error ({e}) | retries: {attempt + 1}'
                status = 'error'
                hypothesis = None
                print(msg)
                continue

            if set(hypothesis.keys()) != set(involve_keys):
                msg = f'Model response missed keys ({set(hypothesis.keys())}) | ({set(involve_keys)})'
                status = 'error'
                hypothesis = None
                print(msg)
                continue
                
            return {"status": status, "msg": msg, "data": hypothesis}
        
        print(f'Model Inference Max Retries Exceeded | retries: {max_retries}')

        return {"status": status, "msg": f"Max retries exceeded ({msg})", "data": hypothesis}
  