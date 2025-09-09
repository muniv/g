FROM pytorch/pytorch:2.1.0-cuda12.1-cudnn8-devel

ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Seoul \
    LANG=C.UTF-8
    
RUN apt-get update && apt-get install -y  curl build-essential git wget python3-pip default-jdk jq
RUN apt-get install -y python3.10
RUN apt-get install -y python3-pip
RUN ln -fs /usr/bin/python3.10 /usr/bin/python3
RUN apt-get install -y libgdal-dev

COPY ./requirements.txt /requirements.txt

RUN pip3 install --upgrade pip && \
    pip3 install --no-cache-dir -r /requirements.txt && \
    rm /requirements.txt

ENV PYTHONPATH=/app/k-intelligence-base-model
ENV TZ=Asia/Seoul
ENV HUGGINGFACE_HUB_CACHE=/app/k-intelligence-base-model/model_cache
ENV HF_HUB_ENABLE_HF_TRANSFER=1
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY . /app/k-intelligence-base-model

WORKDIR /app/k-intelligence-base-model

RUN apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

EXPOSE 80

