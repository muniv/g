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
from modules.request_util import AnswerRequest
from modules.response_util import AnswerResponse
from modules.utils import are_lists_equal, get_original_chunk

SOCKET_CONNECTION_TIMEOUT = 5

load_dotenv()

api_key = os.getenv('HF_KEY')
login(api_key)

app = FastAPI()

args = config.arg_parse()
inference_module = InferenceModule(inference_model=args.inference_model, model_name=args.model_name, 
                                   max_model_len=args.decoder_max_token,
                                   gpu_memory_utilization=args.gpu_memory_utilization)

@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}

@app.get("/health/faq_answer_model")
async def filtering_health_check():
    return AnswerResponse(status="success", msg="OK", data=None, elapsed_time=None)

@app.post('/faq_answer_model', summary="FAQ 답변 모델")
async def faq_answer_inference(request: AnswerRequest, background_tasks: BackgroundTasks):  
    start_time = time.time()

    os.makedirs(args.log_path, exist_ok=True)

    required_keys = list(set(AnswerRequest.model_fields.keys()))
    received_keys = list(set(request.model_dump(exclude_unset=True).keys()))

    if not are_lists_equal(A=required_keys, B=received_keys):
        elapsed_time = time.time() - start_time
        msg = f'Error request data keys({received_keys} | {required_keys})'
        log_format = {"status": "error", "msg": msg, "data": None, "elapsed_time": elapsed_time}
        background_tasks.add_task(insert_log, _example=log_format, log_dir=os.path.join(args.log_path, 'log.jsonl'))

        return AnswerResponse(status="error", msg=msg, data=None, elapsed_time=elapsed_time)

    question = request.question
    context = request.context

    prompt_text = get_prompt('midm')

    input_format = inference_module.get_input_format(prompt_text=prompt_text, replace_content={'<document_text>': context, '<input_text>': question})
    response = await inference_module.run_inference(module_input=input_format, involve_keys=['answer', 'source'], temperature=args.temperature, top_p=args.top_p, 
                                                    generation_max_token=args.generation_max_token, stop=['<|end_of_text|>'], 
                                                    max_retries=args.max_retries)
    
    if response['status'] != 'success':
        elapsed_time = time.time() - start_time
        print(f'Error Inference Module | {response["msg"]}')
        log_format = {"status": response['status'], "msg": response['msg'], "data": response['data'], "elapsed_time": elapsed_time}
        background_tasks.add_task(insert_log, _example=log_format, log_dir=os.path.join(args.log_path, 'log.jsonl'))

        return AnswerResponse(status=response['status'], msg=response['msg'], data=response['data'], elapsed_time=elapsed_time)  
  
    response = response['data']  

    answer = response['answer']
    source = response['source']

    answer = f'{answer}\n\n답변 근거는 아래와 같습니다.\n{source}'

    elapsed_time = time.time() - start_time

    return AnswerResponse(status='success', msg='success', data=answer, elapsed_time=elapsed_time)

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
