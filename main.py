import torch
from PIL import Image
from transformers import AutoProcessor, LlavaOnevisionForConditionalGeneration, AutoModelForCausalLM, AutoTokenizer, GenerationConfig
from docling.document_converter import DocumentConverter
from langchain_teddynote.document_loaders import HWPLoader
from peft import PeftModel
import os
from contextlib import asynccontextmanager
import logging
from argparse import ArgumentParser
from pathlib import Path
import uvicorn
from pydantic import BaseModel
from typing import List

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

# --- 1. 로깅 및 인자 파싱 설정 (기존과 동일) ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

parser = ArgumentParser()
parser.add_argument("--host", type=str, default="0.0.0.0", help="서버 호스트 주소")
parser.add_argument("--port", type=int, default=8080, help="서버 포트 번호")
parser.add_argument("--qg_model_repo", type=str, default="K-intelligence/Midm-2.0-Base-Instruct", help="질문 생성 LLM의 베이스 모델 경로")
parser.add_argument("--qg_adapter_path", type=str, default="hyoungjoon/midm", help="질문 생성 LLM의 LoRA 어댑터 경로")
parser.add_argument("--cache_dir", type=str, default="./model_cache", help="모델 파일을 저장할 로컬 디렉토리")
parser.add_argument("--gpu_idx", type=str, default="0", help="사용할 GPU 인덱스")
parser.add_argument("--upload_dir", type=str, default="./uploads", help="업로드된 파일을 저장할 디렉토리")
args = parser.parse_args()

# --- 2. 설정 및 전역 변수 (기존과 동일) ---
os.environ["CUDA_VISIBLE_DEVICES"] = args.gpu_idx
model_cache = {}

# --- 3. FastAPI 생명 주기(Lifecycle) 설정 (기존과 동일) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- 질문 생성(QG) LLM 로딩 ---
    logger.info("질문 생성(QG) LLM을 로딩합니다...")
    try:
        qg_model_name = args.qg_model_repo
        qg_adapter_path = args.qg_adapter_path
        qg_model = AutoModelForCausalLM.from_pretrained(
            qg_model_name, torch_dtype=torch.bfloat16, trust_remote_code=True, device_map="auto"
        )
        qg_tokenizer = AutoTokenizer.from_pretrained(qg_model_name)
        logger.info("QG 베이스 모델 로드 완료.")
        
        if os.path.exists(qg_adapter_path):
            qg_model = PeftModel.from_pretrained(qg_model, qg_adapter_path)
            qg_model = qg_model.merge_and_unload()
            logger.info("QG LoRA 어댑터 로드 및 병합 완료.")
        
        qg_model = qg_model.eval()
        model_cache["qg_model"] = qg_model
        model_cache["qg_tokenizer"] = qg_tokenizer
        model_cache["qg_generation_config"] = GenerationConfig.from_pretrained(qg_model_name)
        logger.info("질문 생성(QG) LLM 로딩 완료.")
    except Exception as e:
        logger.critical(f"치명적 오류: 질문 생성 LLM 로딩에 실패했습니다. {e}", exc_info=True)
        
    yield
    
    logger.info("서버 종료. 모델 캐시를 비웁니다.")
    model_cache.clear()

app = FastAPI(lifespan=lifespan)

# --- API 요청 본문을 위한 Pydantic 모델 정의 ---
class QuestionRequest(BaseModel):
    document_id: str
    chunk_id: str
    source: str

def generate_questions_for_chunk(source_chunk: str, model, tokenizer, generation_config) -> list:
    """하나의 텍스트 청크를 받아 LLM을 통해 여러 질문을 생성합니다."""
    if not source_chunk:
        return []

    generated_questions = []
    
    prompts = [
        "해당 글을 민원인들이 보고, 어렵지만 궁금해할만한 질문 중 한 개만 알려줘. 질문 이외의 어떤 것도 출력하지 말아줘.",
    ]

    for custom_prompt in prompts:
        prompt = source_chunk + "\n\n" + custom_prompt
        messages = [
            {"role": "system", "content": "공공문서를 보고 궁금한 점을 질문하는 민원인이다."},
            {"role": "user", "content": prompt}
        ]
        input_ids = tokenizer.apply_chat_template(messages, tokenize=True, add_generation_prompt=True, return_tensors="pt").to(model.device)
        
        output_ids = model.generate(
            input_ids,
            generation_config=generation_config,
            eos_token_id=tokenizer.eos_token_id,
            max_new_tokens=128,
            temperature=0.9
        )
        
        prompt_length = input_ids.shape[1]
        question = tokenizer.decode(output_ids[0][prompt_length:], skip_special_tokens=True).strip()
        
        if "ass" in question:
            question = question.split("ass")[0].strip()
        
        logger.info(f"질문 생성 완료: {question}")
        generated_questions.append({"midm_questions": question})
        
    return generated_questions


@app.post("/generate-questions/")
async def generate_questions_endpoint(requests: List[QuestionRequest]):
    """(document_id, chunk_id, source) 객체 리스트를 받아 각 source에 대한 질문을 생성합니다."""
    if "qg_model" not in model_cache:
        raise HTTPException(status_code=503, detail="질문 생성 LLM이 준비되지 않았습니다.")
    
    results = []
    try:
        for request in requests:
            questions = generate_questions_for_chunk(
                source_chunk=request.source,
                model=model_cache["qg_model"],
                tokenizer=model_cache["qg_tokenizer"],
                generation_config=model_cache["qg_generation_config"]
            )
            
            results.append({
                "document_id": request.document_id,
                "chunk_id": request.chunk_id,
                "questions": questions
            })
            
        return JSONResponse(content=results)
        
    except Exception as e:
        logger.error(f"질문 일괄 생성 중 오류 발생: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"질문 일괄 생성 중 오류 발생: {e}")

@app.get("/")
def read_root():
    return {"message": "안녕하세요! FAQ-Q API입니다. /docs 로 접속하여 API 문서를 확인하세요."}

# --- 6. 서버 실행 (기존과 동일) ---
if __name__ == "__main__":
    Path(args.upload_dir).mkdir(parents=True, exist_ok=True)
    logger.info(f"서버를 {args.host}:{args.port} 에서 시작합니다.")
    uvicorn.run("main:app", host=args.host, port=args.port, reload=False)


    