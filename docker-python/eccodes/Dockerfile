FROM python:3

WORKDIR /app
RUN wget https://confluence.ecmwf.int/download/attachments/45757960/eccodes-2.28.0-Source.tar.gz \
  && tar -xvf eccodes-2.28.0-Source.tar.gz \
  && rm eccodes-2.28.0-Source.tar.gz

RUN apt-get update

# v28からc++のコンパイルが必要なのでcmakeの最新版をインストール


# 下記手順でcmakeをコードからビルドは時間がかかりすぎたため、リポジトリ追加で対応sる。
# RUN wget https://github.com/Kitware/CMake/releases/download/v3.25.2/cmake-3.25.2.tar.gz \
#   && tar -xvf cmake-3.25.2.tar.gz \
#   && rm cmake-3.25.2.tar.gz
# RUN cd cmake-3.25.2 && ./bootstrap && make -j4 && make install
RUN wget -O - https://apt.kitware.com/keys/kitware-archive-latest.asc 2>/dev/null | gpg --dearmor - | tee /etc/apt/trusted.gpg.d/kitware.gpg >/dev/null
RUN apt install -y software-properties-common 
RUN apt-add-repository 'deb https://apt.kitware.com/ubuntu/ bionic main'
RUN apt update
RUN apt install -y cmake

RUN apt-get install -y \
  build-essential \
  gfortran \
  libaec-dev  \
  && rm -rf /var/lib/apt/lists/*

RUN mkdir build && cd build && cmake ../eccodes-2.28.0-Source && make && make install

RUN pip3 install eccodes

# lambda実行用
RUN pip3 install awslambdaric


RUN pip3 install pygrib
RUN pip3 install pandas