FROM nvidia/cuda:12.0.0-devel-ubuntu22.04

# Python 패키지 설치
RUN apt-get update && \
    apt-get -y install --no-install-recommends python3.10 python3-pip openmpi-bin libopenmpi-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir \
    numpy>=1.24.4 \
    torch==2.6.0 \
    uvicorn==0.28.0 \
    boto3==1.34.66 \
    httpx==0.26.0 \
    Autologging==1.3.2 \
    ruamel_yaml==0.17.17 \
    seqeval==1.2.2 \
    stringcase==1.2.0 \
    pygtrie==2.4.2 \
    PyYAML==6.0.1 \
    python-multipart==0.0.20 \
    mpmath==1.3.0 \
    pydantic==2.10.6 \
    fastapi==0.110.0 \
    pillow==11.2.1 \
    docling==2.34.0 \
    transformers==4.55.0 \
    peft==0.17.0 \
    pynvml==11.5.0 \
    langchain-teddynote==0.4.4

# 프로젝트 코드 복사
COPY ./ /k-intelligence

# 작업 디렉토리 설정
WORKDIR /k-intelligence

# 환경 변수 설정
ENV PYTHONPATH=/k-intelligence:/k-intelligence/nlp_privacy_check

# 포트 노출
EXPOSE 80
ENTRYPOINT ["python3", "main.py"]