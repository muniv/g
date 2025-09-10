# 🚀 공고쉽 (GongoShip): Assistant

---

## 개요
공고쉽 기능을 수행하는데 있어 보조기능 담당하는 API

## 이미지 빌드 및 컨테이너 생성
프로젝트 폴더 내의 'Dockerfile'을 이용해 이미지 빌드를 수행할 수 있습니다.<br/>
Dockerfile 내에 api 실행 명령어까지 작성해 두었습니다.

(1) 이미지 빌드  
build 명령어 실행
```sh
docker build --tag <image_name> .
```

(2) 컨테이너 생성  
컨테이너 생성
```sh
docker run --shm-size="128G" --memory="256G" --cpus=16 -p <port>:80  --name <container_name> -it <image_name>
```

(3) api 실행  
: 실행된 컨테이너에서 'python3 api.py' 명령어를 이용해 api 수행

**endpoint 리스트**
- http://`<host>`:`<port>`/intent
  > 의도 분류 엔드포인트
  > 햔재 사용자 질의가 문서를 이용해 답변할수 있는 질의인지, 아닌지에 대해 판단하는 endpoint
- http://`<host>`:`<port>`/easy
  > 번안 엔드포인트
  > 어려운 단어가 사용된 공문을 쉬운 내용의 공문으로 번안하는 endpoint
- http://`<host>`:`<port>`/chat
  > 채팅 엔드포인트
  > 선택된 문서를 이용해 답변할 수 없는 질의에 대해 대응하는 endpoint
- http://`<host>`:`<port>`/summarization
  > 요약 엔드포인트
  > 긴 문서에 대해 핵심적인 내용으로 요약하는 endpoint

**의도분류 엔드포인트 Request**
```sh
curl -X 'POST' \
  'http://<host>:<port>/intent' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "현재 질의",
    "context": "문서 내용"
  }'
```
- Parameters description
    - `query (str)`: 채팅화면에서의 현재 질의 
    - `context (str)`: 현재 선택된 문서

**의도뷴류 엔드포인트 Response**
```json
{
  "data": true,
  "status": "succeess",
  "msg": "success",
  "elapsed_time": 432.2
}
```
- Parameters description
    - `data Optional[bool]`: 문서를 참고해 답변할 수 있는 질의이기 때문에 FAQ-A 모델 api를 호출해야 하는지, 답변할 수 없어 채팅 모델 API를 호출해야하는지에 대한 판단 (True: FAQ-A 모델 API 호출 / False: 채팅 모델 API 호출)

**번안 엔드포인트 Request**
```sh
curl -X 'POST' \
  'http://<host>:<port>/easy' \
  -d '{
    "query": "변환된 문장"
  }'
``` 
- Parameters description
    - `query [str]`: 쉬운 단어로 변환되었지만 어색한 문장

**번안 엔드포인트 Response**
```json
{
  "data": "자연스러운 문장",
  "status": "succeess",
  "msg": "success",
  "elapsed_time": 432.2
}
```
- Parameters description
    - `data Optional[str]`: 자연스럽게 변환된 문장

**채팅 엔드포인트 Request**
```sh
curl -X 'POST' \
  'http://<host>:<port>/intent' \
  -d '{
    "history": [{"role": "content": "안녕"}, {"role": "assistant": "안녕하세요"}]
    "query": "문장"
  }'
```  
- Parameters description
    - `history Optional[[List[dict]]]`: 챗봇 화면에서의 히스토리
    - `query [str]`: 챗봇화면에서 현재 질의

**채팅 엔드포인트 Response**
```json
{
  "data": "채팅 답변",
  "status": "succeess",
  "msg": "success",
  "elapsed_time": 432.2
}
```
- Parameters description
    - `data Optional[str]`: 채팅 답변

**요약 엔드포인트 Request**
```sh
curl -X 'POST' \
  'http://<host>:<port>/summarization' \
  -d '{
    "context": "문서 전체 내용"
  }'
```  
- Parameters description
    - `context [str]`: 업로드된 문서의 내용

**채팅 엔드포인트 Response**
```json
{
  "data": "요약 결과",
  "status": "succeess",
  "msg": "success",
  "elapsed_time": 432.2
}
```
- Parameters description
    - `data Optional[str]`: 요약 결과



