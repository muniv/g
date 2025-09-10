# 🚀 공고쉽 (GongoShip): Answer Model

---

## 개요
FAQ 문서를 만드는데 있어 답변을 작성하는 기능과 문서를 기반으로 답변할 수 있는 질의에 대해 대응하는 API

## 이미지 빌드 및 컨테이너 생성
프로젝트 폴더 내의 'Dockerfile'을 이용해 이미지 빌드를 수행할 수 있습니다.<br/>
Dockerfile 내에 api 실행 명령어까지 작성해 두었습니다.

(1) env 파일 작성  
허가된 huggingface 토큰 작성 필요

(2) 이미지 빌드  
build 명령어 실행
```sh
docker build --tag <image_name> .
```

(3) 컨테이너 생성  
컨테이너 생성
```sh
docker run --shm-size="128G" --memory="256G" --cpus=16 -p <port>:80  --name <container_name> -it <image_name>
```

(4) api 실행  
: 실행된 컨테이너에서 'python3 api.py' 명령어를 이용해 api 수행

**endpoint 리스트**
- http://`<host>`:`<port>`/faq_answer_model
  > FAQ 답변 엔드포인트
  > FAQ 문서의 답변과 채팅 기능 내에서 문서에 기반해 답변할 수 있는 질의에 대해 대응하는 endpoint

**FAQ 답변 엔드포인트 Request**
```sh
curl -X 'POST' \
  'http://<host>:<port>/intent' \
  -d '{
    "question": "질의",
    "context": "연관 컨텍스트"
  }'
```
- Parameters description
    - `query [str]`: FAQ-Q 모델이 생성한 질의
    - `context [str]`: FAQ-Q 모델이 질의를 생성할 때 사용한 컨텍스트 또는 전체 문서

**FAQ 답변 엔드포인트 Response**
```json
{
  "data": "답변",
  "status": "succeess",
  "msg": "success",
  "elapsed_time": 432.2
}
```
- Parameters description
    - `data [str]`: 입력된 문서에 근거한 답변 결과로 '답변 근거는 아래와 같습니다' 문장으로 답변과 근거 문단 구분
