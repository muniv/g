# FAQ-Q: LLM 기반 자동 질문 생성 API

## 📖 프로젝트 개요

**FAQ-Q**는 주어진 텍스트(문서 청크)를 기반으로 예상 질문을 생성하는 FastAPI 기반의 API 서버입니다. KT의 **Midm-2.0** 모델을 LoRA(Low-Rank Adaptation) 방식으로 파인튜닝하여, 특히 공공문서를 읽는 민원인의 관점에서 궁금해할 만한 질문을 생성하도록 특화되었습니다.

이 API를 통해 문서의 내용을 기반으로 한 고품질의 FAQ를 자동으로 구축하거나, 사용자의 잠재적인 질문을 예측하여 서비스 개선에 활용할 수 있습니다.

---

## ✨ 주요 기능

- **고성능 AI 모델 활용**: 파인튜닝된 `K-intelligence/Midm-2.0-Base-Instruct` 모델을 사용하여 문맥 이해도가 높은 질문을 생성합니다.
- **RESTful API**: 표준 HTTP 요청을 통해 외부 시스템과 쉽게 연동할 수 있는 `/generate-questions/` 엔드포인트를 제공합니다.
- **배치 처리**: 여러 문서 조각(Chunk)에 대한 질문 생성을 단일 요청으로 처리하여 효율성을 높였습니다.
- **컨테이너 기반 배포**: `Dockerfile`을 제공하여 의존성 문제를 해결하고, 어떤 환경에서든 쉽고 빠르게 서버를 배포할 수 있습니다.
- **최적화된 프롬프트**: '공공문서를 보는 민원인'이라는 명확한 역할을 부여하여, 목적에 맞는 질문을 생성하도록 유도합니다.

---

## 🛠️ 기술 스택

- **언어**: Python 3.10
- **프레임워크**: FastAPI, Uvicorn
- **AI/ML**: PyTorch, Transformers, PEFT (LoRA)
- **배포**: Docker, NVIDIA CUDA 12.0

---

## 🚀 시작하기

### 사전 준비 사항

- NVIDIA GPU (CUDA 12.0 이상 지원)
- Docker
- Python 3.10

### 1. 로컬 환경에서 실행하기

#### 가. 소스 코드 복제
```bash
git clone [https://your-repository-url.git](https://your-repository-url.git)
cd your-project-directory

## 🚀 시작하기

### 필요 사양

* Python 3.10 이상
* NVIDIA GPU 및 CUDA 12.0 이상 드라이버
* Docker

### 1. Docker를 이용한 실행 (권장)

프로젝트 루트 디렉토리에서 아래 명령어를 실행하여 Docker 이미지를 빌드하고 컨테이너를 실행합니다.

```bash
# 1. Docker 이미지 빌드
docker build -t doc-parser-FAQ-Q .

# 2. Docker 컨테이너 실행
# -p 8000:80 : 호스트의 8000번 포트를 컨테이너의 80번 포트와 연결합니다.
# --gpus all : 컨테이너가 호스트의 모든 GPU를 사용하도록 설정합니다.
docker run -p 8080:80 --gpus all doc-parser-api
```

서버가 정상적으로 실행되면 `http://localhost:8080` 주소로 접속할 수 있습니다.