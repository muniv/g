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
parser.add_argument("--port", type=int, default=8000, help="서버 포트 번호")
parser.add_argument("--vlm_model_repo", type=str, default="NCSOFT/VARCO-VISION-2.0-1.7B", help="VLM 모델의경로")
parser.add_argument("--cache_dir", type=str, default="./model_cache", help="모델 파일을 저장할 로컬 디렉토리")
parser.add_argument("--gpu_idx", type=str, default="0", help="사용할 GPU 인덱스")
parser.add_argument("--upload_dir", type=str, default="./uploads", help="업로드된 파일을 저장할 디렉토리")
args = parser.parse_args()

# --- 2. 설정 및 전역 변수 (기존과 동일) ---
os.environ["CUDA_VISIBLE_DEVICES"] = args.gpu_idx
SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.bmp', '.gif']
SUPPORTED_DOC_EXTENSIONS = ['.pdf', '.docx', '.hwp']
model_cache = {}

# --- 3. FastAPI 생명 주기(Lifecycle) 설정 (기존과 동일) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- VLM 모델 로딩 ---
    logger.info("서버 시작. VLM 모델을 로딩합니다...")
    try:
        model_path_vlm = args.vlm_model_repo
        logger.info(f"VLM 모델 경로: {model_path_vlm}")
        vlm_model = LlavaOnevisionForConditionalGeneration.from_pretrained(
            model_path_vlm, 
            torch_dtype=torch.float16, 
            attn_implementation="sdpa", 
            device_map="auto"
        )
        vlm_processor = AutoProcessor.from_pretrained(model_path_vlm)
        model_cache["vlm_model"] = vlm_model
        model_cache["vlm_processor"] = vlm_processor
        logger.info("VLM 모델 로딩 완료.")
    except Exception as e:
        logger.critical(f"치명적 오류: VLM 모델 로딩에 실패했습니다. {e}", exc_info=True)
        
    yield
    
    logger.info("서버 종료. 모델 캐시를 비웁니다.")
    model_cache.clear()

app = FastAPI(lifespan=lifespan)

# --- API 요청 본문을 위한 Pydantic 모델 정의 ---
class QuestionRequest(BaseModel):
    document_id: str
    chunk_id: str
    source: str

# [신규] URL 입력을 위한 Pydantic 모델
class URLRequest(BaseModel):
    url: str

# --- 4. 핵심 기능 함수 ---

def process_image_file(image_path: str, model, processor) -> str:
    """이미지 파일 경로를 받아 VLM으로 텍스트를 생성합니다."""
    try:
        image = Image.open(image_path).convert("RGB")
        w, h = image.size
        target_size = 2304
        if max(w, h) < target_size:
            scaling_factor = target_size / max(w, h)
            new_w, new_h = int(w * scaling_factor), int(h * scaling_factor)
            image = image.resize((new_w, new_h))

        conversation = [
            {
                "role": "user", "content": 
                    [{"type": "image", "image": image}, 
                     {"type": "text", "text": "이미지의 모든 텍스트를 줄글로 출력해줘."}
                    ]
                    }
            ]
        inputs = processor.apply_chat_template(conversation, add_generation_prompt=True, tokenize=True, return_dict=True, return_tensors="pt").to(model.device, torch.bfloat16)
        generate_ids = model.generate(**inputs, max_new_tokens=1024)
        generate_ids_trimmed = [out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generate_ids)]
        output = processor.decode(generate_ids_trimmed[0], skip_special_tokens=False)
        return output.replace(".<|im_end|>", "").strip()
    except Exception as e:
        logger.error(f"이미지 처리 중 오류 발생: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"이미지 처리 중 오류 발생: {e}")


def chunk_and_format_text(full_text: str, filename: str) -> dict:
    """
    텍스트를 청크로 나누고 병합하여 API 표준 응답 형식으로 만듭니다.
    청크는 최소 150자, 최대 500자 길이의 제약을 가집니다.
    """
    # 1. '\n\n' 기준으로 초기 청크 분리
    initial_chunks = full_text.split('\n\n')
    
    MIN_CHUNK_LENGTH = 150
    MAX_CHUNK_LENGTH = 500
    
    # --- 1단계: 짧은 청크들을 병합하여 최소 길이를 만족시키도록 시도 ---
    temp_merged_chunks = []
    current_chunk_buffer = ""
    for chunk in initial_chunks:
        stripped_chunk = chunk.strip()
        if not stripped_chunk:
            continue

        # 버퍼에 청크 추가
        if current_chunk_buffer:
            current_chunk_buffer += "\n\n" + stripped_chunk
        else:
            current_chunk_buffer = stripped_chunk
        
        # 버퍼가 최소 길이를 넘으면 저장하고 비움
        if len(current_chunk_buffer) >= MIN_CHUNK_LENGTH:
            temp_merged_chunks.append(current_chunk_buffer)
            current_chunk_buffer = ""
    
    # 루프 후 남은 버퍼가 있으면 추가 (최소 길이에 미달할 수 있음)
    if current_chunk_buffer:
        temp_merged_chunks.append(current_chunk_buffer)

    # --- 2단계: 병합된 청크 중 최대 길이를 초과하는 것들을 분할 ---
    final_chunks = []
    for chunk in temp_merged_chunks:
        while len(chunk) > MAX_CHUNK_LENGTH:
            # 최대 길이 근처에서 가장 마지막 줄바꿈('\n\n')을 찾아 분할 지점으로 설정
            split_pos = chunk.rfind('\n\n', 0, MAX_CHUNK_LENGTH)
            
            # 만약 적절한 줄바꿈이 없다면, 문장 끝('. ')을 찾아 분할
            if split_pos == -1:
                split_pos = chunk.rfind('. ', 0, MAX_CHUNK_LENGTH)
                # 문장 끝을 찾았다면, 마침표를 포함하도록 분할 지점 조정
                if split_pos != -1:
                    split_pos += 1
            
            # 그래도 분할 지점을 못찾았다면, 최대 길이에서 강제로 분할
            if split_pos == -1:
                split_pos = MAX_CHUNK_LENGTH

            # 분할된 앞부분을 최종 리스트에 추가
            final_chunks.append(chunk[:split_pos].strip())
            # 뒷부분은 다음 루프에서 처리할 수 있도록 chunk 변수 업데이트
            chunk = chunk[split_pos:].strip()
        
        # 루프를 마친 후 남은 (또는 원래부터 짧았던) 청크를 최종 리스트에 추가
        if chunk:
            final_chunks.append(chunk)
            
    # --- 3. 최종 결과 JSON 형식으로 생성 (기존과 동일) ---
    document_id = f"{filename}"
    response_chunks = []

    # 문서 전체 텍스트를 chunk_id '0'으로 먼저 추가
    response_chunks.append({
        "document_id": f"{filename}_전체",
        "chunk_id": "0",
        "source": full_text 
    })
    
    # 병합 및 분할된 최종 청크들은 chunk_id '1'부터 시작
    for i, chunk_text in enumerate(final_chunks, start=0):
        response_chunks.append({
            "document_id": f"{filename}_청크",
            "chunk_id": str(i),
            "source": chunk_text
        })
    
    return {
        "document_id": document_id,
        "chunks": response_chunks
    }

# --- 5. API 엔드포인트 정의 ---

@app.post("/parse-document/")
async def parse_document_endpoint(file: UploadFile = File(...)):
    """문서 파일을 업로드받아 파싱하고 전체/청크로 나누어 반환합니다."""
    filename, file_ext = os.path.splitext(file.filename)
    file_ext = file_ext.lower()

    if file_ext not in SUPPORTED_DOC_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 문서 형식입니다: {file_ext}")

    save_path = os.path.join(args.upload_dir, file.filename)
    try:
        with open(save_path, "wb") as buffer:
            buffer.write(await file.read())
        logger.info(f"파일 저장 완료: {save_path}")
    except Exception as e:
        logger.error(f"파일 저장 중 오류 발생: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"파일 저장 중 오류 발생: {e}")

    try:
        converter = DocumentConverter()
        result = converter.convert(save_path)
        markdown_string = result.document.export_to_markdown().replace("<!-- image -->", "").strip()
        
        # 공통 함수를 사용하여 청킹 및 형식화
        response_data = chunk_and_format_text(markdown_string, filename)
        
        return JSONResponse(content=response_data)

    except Exception as e:
        logger.error(f"문서 파싱 중 오류 발생: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"문서 파싱 중 오류 발생: {e}")

# [신규] URL로부터 문서를 파싱하는 엔드포인트
@app.post("/parse-document-hwp/")
async def parse_document_endpoint(file: UploadFile = File(...)):
    """
    hwp을 입력받아 파싱하고 전체/청크로 나누어 반환합니다.
    """
    """문서 파일을 업로드받아 파싱하고 전체/청크로 나누어 반환합니다."""
    filename, file_ext = os.path.splitext(file.filename)
    file_ext = file_ext.lower()

    if file_ext not in SUPPORTED_DOC_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 문서 형식입니다: {file_ext}")

    save_path = os.path.join(args.upload_dir, file.filename)
    try:
        with open(save_path, "wb") as buffer:
            buffer.write(await file.read())
        logger.info(f"파일 저장 완료: {save_path}")
    except Exception as e:
        logger.error(f"파일 저장 중 오류 발생: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"파일 저장 중 오류 발생: {e}")

    try:
        # HWP Loader 객체 생성
        loader = HWPLoader(save_path)
        # 문서 로드
        docs = loader.load()
        markdown_string = docs[0].page_content.replace("<!-- image -->", "").strip()
        
        # 공통 함수를 사용하여 청킹 및 형식화
        response_data = chunk_and_format_text(markdown_string, filename)
        
        return JSONResponse(content=response_data)

    except Exception as e:
        logger.error(f"URL 문서 파싱 중 오류 발생: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"URL 문서 파싱 중 오류 발생: {e}")


# hwp 로부터 문서를 파싱하는 엔드포인트
@app.post("/parse-document-from-url/")
async def parse_document_from_url_endpoint(request: URLRequest):
    """
    [신규] 문서 URL을 입력받아 파싱하고 전체/청크로 나누어 반환합니다.
    """
    url = request.url
    try:
        # URL에서 파일 이름 추출 (간단한 방식)
        filename = url.split("/")[-1].split("?")[0]
        filename, _ = os.path.splitext(filename)

        logger.info(f"URL로부터 문서 파싱 시작: {url}")
        
        converter = DocumentConverter()
        # converter.convert는 URL도 직접 처리 가능
        result = converter.convert(url) 
        markdown_string = result.document.export_to_markdown().replace("<!-- image -->", "").strip()
        
        # 공통 함수를 사용하여 청킹 및 형식화
        response_data = chunk_and_format_text(markdown_string, filename)
        
        return JSONResponse(content=response_data)

    except Exception as e:
        logger.error(f"URL 문서 파싱 중 오류 발생: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"URL 문서 파싱 중 오류 발생: {e}")



@app.post("/process-image/")
async def process_image_endpoint(file: UploadFile = File(...)):
    """
    이미지 파일을 업로드받아 텍스트로 변환하고,
    문서와 동일하게 전체/청크로 나누어 반환합니다.
    """
    filename, file_ext = os.path.splitext(file.filename)
    file_ext = file_ext.lower()

    if file_ext not in SUPPORTED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 이미지 형식입니다: {file_ext}")

    if "vlm_model" not in model_cache:
        raise HTTPException(status_code=503, detail="VLM 모델이 준비되지 않았습니다.")

    save_path = os.path.join(args.upload_dir, file.filename)
    try:
        with open(save_path, "wb") as buffer:
            buffer.write(await file.read())
        logger.info(f"파일 저장 완료: {save_path}")
    except Exception as e:
        logger.error(f"파일 저장 중 오류 발생: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"파일 저장 중 오류 발생: {e}")
        
    # 1. VLM을 통해 이미지에서 전체 텍스트 추출
    full_text_content = process_image_file(save_path, model_cache["vlm_model"], model_cache["vlm_processor"])
    
    # 2. 공통 함수를 사용하여 텍스트를 청킹하고 JSON 형식으로 만듦
    response_data = chunk_and_format_text(full_text_content, filename)
    
    return JSONResponse(content=response_data)


@app.get("/")
def read_root():
    return {"message": "안녕하세요! 파일 처리 API입니다. /docs 로 접속하여 API 문서를 확인하세요."}

# --- 6. 서버 실행 (기존과 동일) ---
if __name__ == "__main__":
    Path(args.upload_dir).mkdir(parents=True, exist_ok=True)
    logger.info(f"서버를 {args.host}:{args.port} 에서 시작합니다.")
    uvicorn.run("main:app", host=args.host, port=args.port, reload=False)


    