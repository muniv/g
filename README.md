# YoutubeMonitoring (유튜브 모니터링) dev

---

## 개요
특정 배치 시간마다 설정한 검색어의 유튜브 영상을 수집하고, 수집된 영상의 개수와 각 자막을 이용한 분석 결과를 제공주는 API입니다.

## 이미지 빌드 및 컨테이너 생성
프로젝트 폴더 내의 'Dockerfile'을 이용해 이미지 빌드를 수행할 수 있습니다.<br/>
Dockerfile 내에 api 실행 명령어까지 작성해 두었습니다.

(1) 이미지 빌드 
build 명령어 실행
```sh
docker build --tag <image_name> .
```

(2) 컨테이너 생성 및 api 실행
컨테이너 생성과 api 실행이 동시에 수행됩니다.
```sh
docker run --shm-size="128G" --memory="256G" --cpus=16 -p <port>:80  --name <container_name> -it <image_name>
```

## API 명세서
실행되는 API의 request와 response입니다.

**endpoint 리스트**
- http://`<host>`:`<port>`/youtube_monitoring/search
  > 검색 엔드포인트  
  > 특정 배치 시간에 호출되는 엔드포인트로 설정한 검색어를 기준으로 유튜브 영상을 수집해 반환합니다.
  > 기존에 검색된 유튜브 영상 아이디를 입력 받아 중복을 제거해 반환합니다.
- http://`<host>`:`<port>`/youtube_monitoring/script_video
  > 스크립트 추출 엔드포인트  
  > 유튜브 영상에 대한 스크립트를 추출해 반환합니다.
- http://`<host>`:`<port>`/youtube_monitoring/analysis_video
  > 영상 분석 엔드포인트
  > 유튜브 영상 스크립트를 분석해 반환합니다.

**검색 엔드포인트 Request**
```sh
curl -X 'POST' \
  'http://<host>:<port>/youtube_monitoring/search' \
  -H 'Content-Type: application/json' \
  -d '{
    "query_list": ["롯데", "미래"],
    "batch_start_time": "2025-09-04 13:15:00",
    "stored_video_dict": {"롯데": [{"video_id": "id-1"}, {"video_id": "id-2"}]}    
  }'
```
- Parameters description
    - `query_list (list[str])`: 검색어 리스트 
    - `batch_start_time (str)`: 배치 시작 시간 ex) "yyyy-mm-dd hh:mm:ss"
    - `stored_video_dict (dict[str, list])`: 검색된 유튜브 영상 중에 기존에 검색된 영상들을 필터링하기 위한 정보로 검검항목 DB에서 조회된 점검항목 데이터 중 'video_id' 컬럼 값

**검색 엔드포인트 Response**
```json
{
  "status": "succeess",
  "msg": "success",
  "data": {"롯데": [{"video_id": "id-1", "title": "롯데의 사업 무엇이 있을까?", "link": "www.youtube.com", "channel_title": "롯데 팬", "published_at": "2025-06-03 13:00:00", "view": 100, "description": "롯데의 사업은 완벽하다"}]},
  "meta_data": "",
  "elapsed_time": 432.2
}
```
- Parameters description
    - `query_list (list[str])`: 검색어 리스트 
    - `batch_start_time (str)`: 배치 시작 시간 ex) "yyyy-mm-dd hh:mm:ss"
    - `stored_video_dict (dict[str, list])`: 검색된 유튜브 영상 중에 기존에 검색된 영상들을 필터링하기 위한 정보로 검검항목 DB에서 조회된 점검항목 데이터 중 'video_id' 컬럼 값



**(2) 스크립트 추출 엔드포인트**
```sh
curl -X 'POST' \
  'http://<host>:<port>/youtube_monitoring/script_video' \
  -H 'Content-Type: application/json' \
  -d '{
    "video_id": "id-1",
  }'
```
- Parameters description
    - `video_id (str)`: 스크립트를 추출할 비디오 ID

**(3) 영상 분석 엔드포인트**
```sh
curl -X 'POST' \
  'http://<host>:<port>/youtube_monitoring/analysis_video' \
  -H 'Content-Type: application/json' \
  -d '{
    "transcript_content": {"timestemp_transcript": [{"text":"오늘은 어떤 슬라임을 만들어 볼까요?", "clip":{"start":0.16,"end":2.04},"duration":1.88}. {"text":"초코 슬라임이요", "clip":{"start":2.09,"end":2.12},"duration":3.21}],
    "transcript": "오늘은 어떤 슬라임을 만들어 볼까요? 초코 슬라임이요"}
  }'
```
- Parameters description
    - `transcript_content (dict[str, Union[list, str]]))`: timestemp 정보(timestemp_transcript)와 영상 전체 스크립트(transcript)



###########

- request example
: ./nlp_checkmate 위치에서 아래 curl 실행
```sh
curl -X 'POST' \
  'http://<host>:<port>/checkmate/checkmate_model' \
  -H 'Authorization: Bearer <auth_token>' \
  -H 'Content-Type: application/json' \
  -d @test_script/test_body.json
```

- 🚨 request parameter 2.0 -> 3.0 변경 사항 (250619)
  - 'set_id' -> 'criteria' 인자명 및 값 변경
    > 기존에는 모델 API에서 'set_id' request 인자를 전달 받아 해당 id 값을 직접 점검항목 상세 조회 api(개발계: `https://aidev.lotte.net/api/v1/checklist?checkListId=<checklist_id>` / 운영계: `https://ai.lotte.net/api/v1/checklist?checkListId=<checklist_id>`)에 사용하여 criteria 데이터를 조회해 사용했습니다. 이번 업데이트에 모델 API에서 호출이 아니라 백엔드에서 데이터를 조회해 request parameter로 전달할 수 있도록 수정하였습니다. 위 api의 reponse 값을 그대로 criteria 인자 값으로 전달 주시면 됩니다.
    > - 변경 전: 'set_id' 인자명과 값 전달 받음
    > - 변경 후: 'criteria' 인자명 및 값 수정

- 🚨 request parameter 2.0 -> 3.0 변경 사항 (250624)
  - 'criteria' 값 변경
    > 250619 버전에는 점검항목 상세 조회 api의 response 값 그대로 전달했습니다. 이번 업데이트에는 reponse 값 중 'data' 필드의 값을 그대로 criteria 인자 값으로 전달 주시면 됩니다.
    > - 변경 전: 점검항목 상세 조회 api의 response 값 그대로 전달
    > - 변경 후: reponse 값 중 'data' 필드의 값을 그대로 criteria 인자 값으로 전달

- 🚨 request parameter 2.0 -> 3.0 변경 사항 (250708)
  - 'criteria' 값 변경
    > 250624 버전에는 점검항목 상세 조회 api의 response 값 중 'data' 필드의 값을 그대로 criteria 인자 값으로 전달헀습니다. 이번 업데이트에는 'data' 필드 값에서 'checkListId'와 'checkLists' 값만 전달 주시면 됩니다.
    > - 변경 전: 점검항목 상세 조회 api의 response 값 중 'data' 필드의 값을 그대로 전달
    > - 변경 후: 'data' 필드의 값에서 'checkListId'와 'checkLists' 값만 전달
  - 'service_id' 값 추가
    > 'serviece_id' 값 추가 
    > - 변경 전: 'service_id' 인자 전달하지 않음
    > - 변경 후: 'service_id' 인자 추가 전달

- Parameters
    - `document_content [list[dict]]`: 파싱 API 결과  
        - `document_id [str]`: 문서 id (파싱 API Response 값)  
        - `text [str]`: 파싱 결과 (파싱 API Response 값)  
        - `type [str]`: 문서 확장자 (파싱 API Response 값)  
        - `path [str]`: 문서 path (파싱 API Response 값)  
    - `document_type [str]`: 입력 받은 파일의 확장자 (파싱 API Response 값 사용 가능)  
    - `criteria [dict]`: 검검항목 DB에서 조회된 점검항목 데이터 중 'data' 필드 값
    - `check_type [bool]`: 포함되어야 하는지 / 포함되면 안되는 지에 대한 값
    - `num_return [int]`: 반환할 chunk의 개수 (현재 버전은 사용하기 않음)
    - `service_id [str]`: azure 모델 전달을 위한 service_id


**(3) response**
```json
{
  "data": {"display_content_data": [{"page": "page 정보(pdf 외에는 None 값)", "chunk": "검출되지 않은 문구", "checklist_content": [], "reason": [],"detect": false, "chunk_idx": "0"},
                                    {"page": "page 정보(pdf 외에는 None 값)", "chunk": "검출된 문구", "checklist_content": ["점검항목-2", "점검항목-1", "점검항목-9"], "reason": ["이유-2", "이유-1","이유-9"], "detect": true, "chunk_idx": "1"}],
           "display_criteria_data": [("(1) 점검항목-1", null), ("(2) 점검항목-2", [{"chunk": "검출문구-1", "reason": "이유-1", "page": "page_num", "chunk_idx": "4"}])],
           "content_position": {"0": "content_chunk=0", "1": "content_chunk-1"},
           "content": "전체 문서 내용"},

  "status": "succeess",
  "msg": "success",
  "elapsed_time": 432.2
}
```
- Parameters
    - `data Optional[dict]`: 화면에 노출될 두 가지 정보(content 중심, checklist 중심), 전체 content, position이 매핑되어 있는 content
        - `display_content_data [list[dict]]`: content 중심 추론 결과 
          - `page Optional[int]`: 페이지 정보 (pdf 외에 다른 확장자는 None)
          - `chunk [str]`: 문구 텍스트
          - `checklist_content [list]`: 매핑된 점검항목 리스트
          - `reason [list]`: 점검항목이 매핑된 이유 리스트
          - `detect [bool]`: 일반 문구인지, 검출된 문구인지의 논리 값
          - `chunk_idx [str]`: content_position과 매핑된 chunk 위치 id
        - `display_criteria_data [list[tuple]]`: checklist 중심 추론 결과 
          - `점검항목`: 점검항목 내용
          - `chunk_info [Optional[list[dict]]]`: 해당 점검항목에 매핑된 chunk 정보
            - `chunk [str]`: 해당 checklist에 매핑된 chunk
            - `reason [list]`: 해당 checklist에 chunk가 매핑된 이유
            - `page [Optional[int]]`: 해당 chunk의 page 정보 (pdf 외에는 다른 확장자는 None)
            - `chunk_idx [str]`: content_position과 매핑된 chunk 위치 id
        - `content_position [dict]`: 'display_content_data'와 'display_criteria_data' 필드에서 노출되는 chunk와 매핑되는 content
          - `인덱스`: chunk_idx 
        - `content [str]`: 전체 문서 내용
    - `status [str]`: 처리 결과 코드
    - `msg [str]`: 처리 결과 메세지,
    - `elapsed_time Optional[float]`: 경과시간

- 🚨 response parameter 2.0 -> 3.0 변경 사항 (250619)
  - 'display_data' -> 'data' 인자명 변경 
    > 기존에는 'display_data' 인자명으로 추론 결과를 전달했습니다. 이번 업데이트에 'display_data' 인자명에서 'data' 인자명으로 변경하였고, 데이터 타입과 내용을 동일합니다.
    > - 변경 전: 'display_data' 인자명 사용
    > - 변경 후: 'data' 인자명 사용
  - 'status' 인자 값 변경
    > 기존에는 'status'에 200 코드 값을 전달해 모델 api의 성공 여부를 전달 했습니다. 이번 업데이트에 'success' 또는 'error' 값으로 성고 여부를 전달하고, 에러 내용은 'msg' 인자 값으로 확인할 수 있도록 수정하였습니다.
    > - 변경 전: 'status'인자에 코드 값을 사용해 api 성공 여부 전달
    > - 변경 후: 'status'인자에 'success' 또는 'error' str 값을 사용해 api 성공 여부 전달


- 🚨 response parameter 2.0 -> 3.0 변경 사항 (250624)
  - 'data' -> 'display_content_data', 'display_criteria_data', 'content_position', 'content' 키 확장
    > 기존에는 content 중심의 추론 결과를 전달했습니다. 이번 업데이트에 'display_content_data', 'display_criteria_data', 'content_position', 'content'로 전달 데이터를 확장하였습니다.
    > 'display_content_data': content 중심 추론 결과 (as-is)
    > 'display_criteria_data': checklist 중심 추론 결과
    > 'content_position': 'display_content_data'와 'display_criteria_data'의 chunk와 매핑된 위치를 알 수 있도록 만든 필드값입니다.
    > 'content': 전체 content 내용을 str 타입으로 만든 필드값입니다.
    > - 변경 전: 'data' 인자에 'display_content_data' 데이터 전달
    > - 변경 후: 'data' 인자의 값을 'display_content_data', 'display_criteria_data', 'content_position', 'content'로 확장해 추가 데이터 전달

  - 🚨 response parameter 2.0 -> 3.0 변경 사항 (250625)
    - 'data' -> 'display_content_data', 'display_criteria_data', 'content_position', 'content' 키 확장
      > 기존에는 content 중심의 추론 결과를 전달했습니다. 이번 업데이트에 'display_content_data', 'display_criteria_data', 'content_position', 'content'로 전달 데이터를 확장하였습니다.
      > 'display_content_data': 'index_info' 키를 가지는 딕셔너리들의 리스트에서 chunk 정보들의 리스트로 변경하였습니다.
      > 'display_criteria_data': '점검항목' 키를 가지는 딕셔너리들의 리스트에서 각 tuple들의 리스트로 변경하였고, 각 tuple의 0번 인덱스 값은 점검항목 내용, 1번 인덱스는 매핑된 chunk 정보입니다.
      > 'content_position': 'display_content_data'와 'display_criteria_data'의 chunk와 매핑된 위치를 알 수 있도록 만든 필드값입니다.
      > 'content': 전체 content 내용을 str 타입으로 만든 필드값입니다.
      > - 변경 전: 'display_content_data', 'display_criteria_data' 모두 이중 리스트 형태
      > - 변경 후: 'display_content_data', 'display_criteria_data' 모두 단일 리스트로 변경

