import os 
import sys

sys.path.append(os.path.abspath('../'))

from dotenv import load_dotenv

import time

import uvicorn

from huggingface_hub import login

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, BackgroundTasks

from starlette.middleware.cors import CORSMiddleware

from modules import config
from modules.log_util import insert_log
from modules.prompt_util import get_prompt
from modules.inference_util import InferenceModule
from modules.request_util import IntentRequest, EasyRequest, KeywordRequest, ChatRequest, SummarizationRequest
from modules.response_util import IntentResponse, EasyResponse, KeywordResponse, ChatResponse, SummarizationResponse
from modules.utils import are_lists_equal

SOCKET_CONNECTION_TIMEOUT = 5

app = FastAPI()

args = config.arg_parse()

inference_module = InferenceModule(model_name=args.model_name, max_model_len=args.generation_max_token, gpu_memory_utilization=args.gpu_memory_utilization)

@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}

@app.get("/health/intent")
async def intent_health_check():
    return IntentResponse(status="success", msg="OK", data=None, elapsed_time=None)

@app.get("/health/easy")
async def easy_health_check():
    return EasyResponse(status="success", msg="OK", data=None, elapsed_time=None)

@app.get("/health/keyword")
async def keyword_health_check():
    return KeywordResponse(status="success", msg="OK", data=None, elapsed_time=None)

@app.get("/health/chat")
async def chat_health_check():
    return ChatResponse(status="success", msg="OK", data=None, elapsed_time=None)

@app.get("/health/chat")
async def chat_health_check():
    return ChatResponse(status="success", msg="OK", data=None, elapsed_time=None)

@app.get("/health/summarization")
async def summarization_health_check():
    return SummarizationResponse(status="success", msg="OK", data=None, elapsed_time=None)

@app.post('/intent', summary="intent (general or answer)")
async def intent_inference(request: IntentRequest, background_tasks: BackgroundTasks):  
    start_time = time.time()

    status, msg = 'success', 'success'

    os.makedirs(args.log_path, exist_ok=True)

    required_keys = list(set(IntentRequest.model_fields.keys()))
    received_keys = list(set(request.model_dump(exclude_unset=True).keys()))

    if not are_lists_equal(A=required_keys, B=received_keys):
        status = 'error'
        elapsed_time = time.time() - start_time
        msg = f'Error request data keys({received_keys} | {required_keys})'
        log_format = {"status": "error", "msg": msg, "data": None, "elapsed_time": elapsed_time}
        background_tasks.add_task(insert_log, _example=log_format, log_dir=os.path.join(args.log_path, 'log.jsonl'))

        return IntentResponse(status=status, msg=msg, data=None, elapsed_time=elapsed_time)

    query = request.query
    context = request.context

    if (context is None) or context == '':
        context = '문서 없음'
        
    prompt_text = get_prompt('intent')
    message = {"role": "system", "content": "당신은 유저의 메세지가 주어진 문서와 연관되어 있으면서 이 문서를 참고해 답변할 수 있는지 판단하는 로봇입니다."}

    input_format = inference_module.get_input_format(messages=message, prompt_text=prompt_text, replace_content={'<input_text>': query, '<document_text>': context})
    
    response = await inference_module.run_inference(module_input=input_format, involve_keys=['classification'], temperature=args.temperature, top_p=args.top_p, 
                                                    generation_max_token=args.generation_max_token, stop=['<|end_of_text|>'], 
                                                    max_retries=args.max_retries)                                          
    
    if response['status'] != 'success':
        elapsed_time = time.time() - start_time
        print(f'Error Inference Module | {response["msg"]}')
        log_format = {"status": response['status'], "msg": response['msg'], "data": response['data'], "elapsed_time": elapsed_time}
        background_tasks.add_task(insert_log, _example=log_format, log_dir=os.path.join(args.log_path, 'log.jsonl'))

        return IntentResponse(status=response['status'], msg=response['msg'], data=response['data'], elapsed_time=elapsed_time)  
  
    response = response['data']  

    classification = response['classification']

    if classification is None:
        status = 'error'
        elapsed_time = time.time() - start_time
        msg = f'Error intent inference'
        print(msg)
        log_format = {"status": 'error', "msg": msg, "data": None, "elapsed_time": elapsed_time}
        background_tasks.add_task(insert_log, _example=log_format, log_dir=os.path.join(args.log_path, 'log.jsonl'))

        return IntentResponse(status=status, msg=msg, data=None, elapsed_time=elapsed_time)  

    elapsed_time = time.time() - start_time

    return IntentResponse(status=status, msg=msg, data=classification, elapsed_time=elapsed_time)

@app.post('/easy', summary="문장 다듬기")
async def easy_inference(request: EasyRequest, background_tasks: BackgroundTasks):  
    start_time = time.time()

    status, msg = 'success', 'success'

    os.makedirs(args.log_path, exist_ok=True)

    required_keys = list(set(EasyRequest.model_fields.keys()))
    received_keys = list(set(request.model_dump(exclude_unset=True).keys()))

    if not are_lists_equal(A=required_keys, B=received_keys):
        status = 'error'
        elapsed_time = time.time() - start_time
        msg = f'Error request data keys({received_keys} | {required_keys})'
        log_format = {"status": "error", "msg": msg, "data": None, "elapsed_time": elapsed_time}
        background_tasks.add_task(insert_log, _example=log_format, log_dir=os.path.join(args.log_path, 'log.jsonl'))

        return EasyResponse(status=status, msg=msg, data=None, elapsed_time=elapsed_time)

    query = request.query

    prompt_text = get_prompt('easy')

    message = {"role": "system", "content": "당신은 유저의 메세지에 대해 의미를 헤치지 않고, 자연스러운 문장으로 변환해주는 로봇입니다."}

    input_format = inference_module.get_input_format(messages=message, prompt_text=prompt_text, replace_content={'<input_text>': query})

    response = await inference_module.run_inference(module_input=input_format, involve_keys=['sentence'], temperature=args.temperature, top_p=args.top_p, 
                                                    generation_max_token=args.generation_max_token, stop=['<|end_of_text|>'], 
                                                    max_retries=args.max_retries)                                          
    
    if response['status'] != 'success':
        elapsed_time = time.time() - start_time
        print(f'Error Inference Module | {response["msg"]}')
        log_format = {"status": response['status'], "msg": response['msg'], "data": response['data'], "elapsed_time": elapsed_time}
        background_tasks.add_task(insert_log, _example=log_format, log_dir=os.path.join(args.log_path, 'log.jsonl'))

        return EasyResponse(status=response['status'], msg=response['msg'], data=response['data'], elapsed_time=elapsed_time)  
  
    response = response['data']  

    sentence = response['sentence']

    if sentence is None:
        status = 'error'
        elapsed_time = time.time() - start_time
        msg = f'Error easy inference'
        print(msg)
        log_format = {"status": 'error', "msg": msg, "data": None, "elapsed_time": elapsed_time}
        background_tasks.add_task(insert_log, _example=log_format, log_dir=os.path.join(args.log_path, 'log.jsonl'))

        return EasyResponse(status=status, msg=msg, data=None, elapsed_time=elapsed_time)  

    elapsed_time = time.time() - start_time

    return EasyResponse(status=status, msg=msg, data=sentence, elapsed_time=elapsed_time)

@app.post('/keyword', summary="키워드 추출")
async def keyword_inference(request: KeywordRequest, background_tasks: BackgroundTasks):  
    start_time = time.time()

    status, msg = 'success', 'success'

    os.makedirs(args.log_path, exist_ok=True)

    required_keys = list(set(KeywordRequest.model_fields.keys()))
    received_keys = list(set(request.model_dump(exclude_unset=True).keys()))

    if not are_lists_equal(A=required_keys, B=received_keys):
        status = 'error'
        elapsed_time = time.time() - start_time
        msg = f'Error request data keys({received_keys} | {required_keys})'
        log_format = {"status": "error", "msg": msg, "data": None, "elapsed_time": elapsed_time}
        background_tasks.add_task(insert_log, _example=log_format, log_dir=os.path.join(args.log_path, 'log.jsonl'))

        return KeywordResponse(status=status, msg=msg, data=None, elapsed_time=elapsed_time)

    query = request.query

    prompt_text = get_prompt('keyword')

    message = {"role": "system", "content": "당신은 유저의 메세지에 대한 핵심 키워드를 추출하는 로봇입니다."}

    input_format = inference_module.get_input_format(messages=message, prompt_text=prompt_text, replace_content={'<input_text>': query})

    response = await inference_module.run_inference(module_input=input_format, involve_keys=['keyword'], temperature=args.temperature, top_p=args.top_p, 
                                                    generation_max_token=args.generation_max_token, stop=['<|end_of_text|>'], 
                                                    max_retries=args.max_retries)                                          
    
    if response['status'] != 'success':
        elapsed_time = time.time() - start_time
        print(f'Error Inference Module | {response["msg"]}')
        log_format = {"status": response['status'], "msg": response['msg'], "data": response['data'], "elapsed_time": elapsed_time}
        background_tasks.add_task(insert_log, _example=log_format, log_dir=os.path.join(args.log_path, 'log.jsonl'))

        return KeywordResponse(status=response['status'], msg=response['msg'], data=response['data'], elapsed_time=elapsed_time)  
  
    response = response['data']  

    keyword = response['keyword']

    if keyword is None:
        status = 'error'
        elapsed_time = time.time() - start_time
        msg = f'Error keyword inference'
        print(msg)
        log_format = {"status": 'error', "msg": msg, "data": None, "elapsed_time": elapsed_time}
        background_tasks.add_task(insert_log, _example=log_format, log_dir=os.path.join(args.log_path, 'log.jsonl'))

        return KeywordResponse(status=status, msg=msg, data=None, elapsed_time=elapsed_time)  

    elapsed_time = time.time() - start_time

    return KeywordResponse(status=status, msg=msg, data=keyword, elapsed_time=elapsed_time)

@app.post('/chat', summary="채팅")
async def chat_inference(request: ChatRequest, background_tasks: BackgroundTasks):  
    start_time = time.time()

    status, msg = 'success', 'success'

    os.makedirs(args.log_path, exist_ok=True)

    required_keys = list(set(ChatRequest.model_fields.keys()))
    received_keys = list(set(request.model_dump(exclude_unset=True).keys()))

    if not are_lists_equal(A=required_keys, B=received_keys):
        status = 'error'
        elapsed_time = time.time() - start_time
        msg = f'Error request data keys({received_keys} | {required_keys})'
        log_format = {"status": "error", "msg": msg, "data": None, "elapsed_time": elapsed_time}
        background_tasks.add_task(insert_log, _example=log_format, log_dir=os.path.join(args.log_path, 'log.jsonl'))

        return ChatResponse(status=status, msg=msg, data=None, elapsed_time=elapsed_time)

    history = request.history if request.history is not None else []
    query = request.query

    if len(history) > args.max_history * 2:
        history = history[-args.max_history * 2:]

    message = [{"role": "system", "content": "당신은 유저의 질문에 대해 답변을 하는 로봇입니다."}]

    history.append({"role": "user", "content": query})

    messages = message + history
        
    message = inference_module.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)

    response = await inference_module.run_chat(module_input=message, temperature=args.temperature, top_p=args.top_p, 
                                                    generation_max_token=args.generation_max_token, stop=['<|end_of_text|>'], 
                                                    max_retries=args.max_retries)                                          
    
    if response['status'] != 'success':
        elapsed_time = time.time() - start_time
        print(f'Error Inference Module | {response["msg"]}')
        log_format = {"status": response['status'], "msg": response['msg'], "data": response['data'], "elapsed_time": elapsed_time}
        background_tasks.add_task(insert_log, _example=log_format, log_dir=os.path.join(args.log_path, 'log.jsonl'))

        return ChatResponse(status=response['status'], msg=response['msg'], data=response['data'], elapsed_time=elapsed_time)  
  
    response = response['data']  

    if response is None:
        status = 'error'
        elapsed_time = time.time() - start_time
        msg = f'Error chat inference'
        print(msg)
        log_format = {"status": 'error', "msg": msg, "data": None, "elapsed_time": elapsed_time}
        background_tasks.add_task(insert_log, _example=log_format, log_dir=os.path.join(args.log_path, 'log.jsonl'))

        return ChatResponse(status=status, msg=msg, data=None, elapsed_time=elapsed_time)  

    elapsed_time = time.time() - start_time

    return ChatResponse(status=status, msg=msg, data=response, elapsed_time=elapsed_time)

@app.post('/summarization', summary="문서 요약")
async def summarization_inference(request: SummarizationRequest, background_tasks: BackgroundTasks):  
    start_time = time.time()

    status, msg = 'success', 'success'

    os.makedirs(args.log_path, exist_ok=True)

    required_keys = list(set(SummarizationRequest.model_fields.keys()))
    received_keys = list(set(request.model_dump(exclude_unset=True).keys()))

    if not are_lists_equal(A=required_keys, B=received_keys):
        status = 'error'
        elapsed_time = time.time() - start_time
        msg = f'Error request data keys({received_keys} | {required_keys})'
        log_format = {"status": "error", "msg": msg, "data": None, "elapsed_time": elapsed_time}
        background_tasks.add_task(insert_log, _example=log_format, log_dir=os.path.join(args.log_path, 'log.jsonl'))

        return SummarizationResponse(status=status, msg=msg, data=None, elapsed_time=elapsed_time)

    context = request.context
    if len(context) < args.summary_min_token:
        elapsed_time = time.time() - start_time
        return SummarizationResponse(status=status, msg=msg, data=context, elapsed_time=elapsed_time)    

    prompt_text = get_prompt('summarization')

    message = {"role": "system", "content": "당신은 유저의 메세지에 주요한 내용들을 유지하고, 자연스럽게 요약해주는 로봇입니다."}

    input_format = inference_module.get_input_format(messages=message, prompt_text=prompt_text, replace_content={'<input_text>': context})

    response = await inference_module.run_inference(module_input=input_format, involve_keys=['summary'], temperature=args.temperature, top_p=args.top_p, 
                                                    generation_max_token=args.generation_max_token, stop=['<|end_of_text|>'], 
                                                    max_retries=args.max_retries)                                          
    
    if response['status'] != 'success':
        elapsed_time = time.time() - start_time
        print(f'Error Inference Module | {response["msg"]}')
        log_format = {"status": response['status'], "msg": response['msg'], "data": response['data'], "elapsed_time": elapsed_time}
        background_tasks.add_task(insert_log, _example=log_format, log_dir=os.path.join(args.log_path, 'log.jsonl'))

        return SummarizationResponse(status=response['status'], msg=response['msg'], data=response['data'], elapsed_time=elapsed_time)  
  
    response = response['data']  

    summary = response['summary']

    if summary is None:
        status = 'error'
        elapsed_time = time.time() - start_time
        msg = f'Error summarization inference'
        print(msg)
        log_format = {"status": 'error', "msg": msg, "data": None, "elapsed_time": elapsed_time}
        background_tasks.add_task(insert_log, _example=log_format, log_dir=os.path.join(args.log_path, 'log.jsonl'))

        return SummarizationResponse(status=status, msg=msg, data=None, elapsed_time=elapsed_time)  

    elapsed_time = time.time() - start_time

    return SummarizationResponse(status=status, msg=msg, data=summary, elapsed_time=elapsed_time)    

if __name__ == "__main__":

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    uvicorn.run(
        app,
        host=args.host,
        port=args.port,
        log_level="debug",
        timeout_keep_alive=SOCKET_CONNECTION_TIMEOUT,
    )
