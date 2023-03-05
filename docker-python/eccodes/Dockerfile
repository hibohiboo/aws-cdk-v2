FROM python:3

RUN apt-get update
RUN apt-get install -y \
  build-essential \
  cmake \
  gfortran \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN wget https://confluence.ecmwf.int/download/attachments/45757960/eccodes-2.23.0-Source.tar.gz \
  && tar -xvf eccodes-2.23.0-Source.tar.gz \
  && rm eccodes-2.23.0-Source.tar.gz

RUN mkdir build && cd build && cmake ../eccodes-2.23.0-Source && make && make install

RUN pip3 install eccodes




