# 문서 및 이미지 파싱 API 서버

다양한 형식의 문서(PDF, DOCX, HWP)와 이미지 파일을 입력받아 텍스트를 추출하고, 이를 의미 있는 단위의 청크(Chunk)로 분할하여 JSON 형식으로 반환하는 FastAPI 기반의 API 서버입니다. URL을 통해 원격 문서를 직접 파싱하는 기능도 지원합니다.

## ✨ 주요 기능

* **다양한 문서 형식 지원**: `.pdf`, `.docx`, `.hwp` 파일을 파싱하여 텍스트를 추출합니다.
* **이미지 텍스트 추출 (OCR)**: `.jpg`, `.jpeg`, `.png` 등 이미지 파일 속 텍스트를 NCSOFT의 `VARCO-VISION-2.0-1.7B` 모델을 사용하여 인식하고 추출합니다.
* **URL 직접 파싱**: 웹에 게시된 문서의 URL을 직접 입력하여 파싱할 수 있습니다.
* **지능적인 텍스트 청킹**: 추출된 전체 텍스트를 최소/최대 길이를 고려하여 의미적으로 연관된 문단 단위로 분할합니다.
* **표준화된 응답 형식**: 파싱된 결과를 `전체` 텍스트와 분할된 `청크` 텍스트로 구분하여 일관된 JSON 형식으로 제공합니다.
* **Docker 기반 배포**: Docker를 통해 간편하게 서버를 빌드하고 실행할 수 있습니다.

## 🚀 시작하기

### 필요 사양

* Python 3.10 이상
* NVIDIA GPU 및 CUDA 12.0 이상 드라이버
* Docker

### 1. Docker를 이용한 실행 (권장)

프로젝트 루트 디렉토리에서 아래 명령어를 실행하여 Docker 이미지를 빌드하고 컨테이너를 실행합니다.

```bash
# 1. Docker 이미지 빌드
docker build -t doc-parser-api .

# 2. Docker 컨테이너 실행
# -p 8000:80 : 호스트의 8000번 포트를 컨테이너의 80번 포트와 연결합니다.
# --gpus all : 컨테이너가 호스트의 모든 GPU를 사용하도록 설정합니다.
docker run -p 8000:80 --gpus all doc-parser-api
```

서버가 정상적으로 실행되면 `http://localhost:8000` 주소로 접속할 수 있습니다.

### 2. 로컬 환경에서 직접 실행

```bash
# 1. 필요 패키지 설치
pip install -r requirements.txt

# 2. 서버 실행
# --vlm_model_repo : 사용할 Vision Language 모델 지정
# --gpu_idx : 사용할 GPU 인덱스 지정
python3 main.py --vlm_model_repo "NCSOFT/VARCO-VISION-2.0-1.7B" --gpu_idx "0"
```

## ⚙️ 설정 (Configuration)

`main.py` 실행 시 아래와 같은 인자(Argument)를 사용하여 서버 설정을 변경할 수 있습니다.

* `--host`: 서버 호스트 주소 (기본값: "0.0.0.0")
* `--port`: 서버 포트 번호 (기본값: 8000)
* `--vlm_model_repo`: Vision Language 모델의 Hugging Face 저장소 경로 (기본값: "NCSOFT/VARCO-VISION-2.0-1.7B")
* `--cache_dir`: 모델 파일을 저장할 로컬 캐시 디렉토리 (기본값: "./model_cache")
* `--gpu_idx`: 사용할 GPU 인덱스 (기본값: "0")
* `--upload_dir`: 업로드된 파일을 임시 저장할 디렉토리 (기본값: "./uploads")

## 📖 API 엔드포인트

API에 대한 상세한 명세는 서버 실행 후 `http://localhost:8000/docs` 에서 확인할 수 있습니다.

### 1. 문서 파일 파싱

* **Endpoint**: `/parse-document/`
* **Method**: `POST`
* **Body**: `multipart/form-data` 형식의 파일 (`.pdf`, `.docx`)
* **설명**: PDF 또는 DOCX 파일을 업로드하여 텍스트를 추출하고 청크로 분할합니다.

### 2. HWP 파일 파싱

* **Endpoint**: `/parse-document-hwp/`
* **Method**: `POST`
* **Body**: `multipart/form-data` 형식의 파일 (`.hwp`)
* **설명**: HWP 파일을 업로드하여 텍스트를 추출하고 청크로 분할합니다.

### 3. URL로부터 문서 파싱

* **Endpoint**: `/parse-document-from-url/`
* **Method**: `POST`
* **Body**: `application/json`
    ```json
    {
      "url": "[https://example.com/document.pdf](https://example.com/document.pdf)"
    }
    ```
* **설명**: 원격 문서 URL을 받아 해당 문서를 다운로드하고 파싱합니다.

### 4. 이미지 파일 처리

* **Endpoint**: `/process-image/`
* **Method**: `POST`
* **Body**: `multipart/form-data` 형식의 파일 (`.jpg`, `.png` 등)
* **설명**: 이미지 파일에서 텍스트를 추출(OCR)하고 청크로 분할합니다.

---

### ✅ 성공 응답 예시

모든 엔드포인트는 성공 시 아래와 같은 형식의 JSON을 반환합니다.

* `document_id`: 원본 파일의 이름
* `chunks`: 파싱 결과를 담은 리스트
    * `document_id`: `[파일명]_전체` 또는 `[파일명]_청크`
    * `chunk_id`: '0' (전체 텍스트), '1', '2', ... (분할된 청크)
    * `source`: 추출된 텍스트 내용

```json
{
  "document_id": "sample-document",
  "chunks": [
    {
      "document_id": "sample-document_전체",
      "chunk_id": "0",
      "source": "여기는 문서의 전체 텍스트가 들어갑니다. 모든 내용이 하나의 문자열로 포함됩니다."
    },
    {
      "document_id": "sample-document_청크",
      "chunk_id": "0",
      "source": "여기는 첫 번째 청크입니다. 텍스트가 지능적인 청킹 로직에 의해 분할되었습니다."
    },
    {
      "document_id": "sample-document_청크",
      "chunk_id": "1",
      "source": "여기는 두 번째 청크입니다. 보통 하나의 문단이나 여러 문장이 묶여 하나의 청크를 구성합니다."
    }
  ]
}
```

## 📦 주요 의존성

* **FastAPI**: API 서버 구축
* **Uvicorn**: ASGI 서버
* **Docling**: PDF, DOCX 등 문서 파싱
* **langchain-teddynote**: HWP 문서 파싱
* **Transformers**: Vision Language Model 로딩 및 추론
* **PyTorch**: 딥러닝 모델 실행
* **Pillow**: 이미지 처리