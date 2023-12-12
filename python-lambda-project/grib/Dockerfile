FROM public.ecr.aws/lambda/python:3.11

# https://predora005.hatenablog.com/entry/2020/10/28/190000
RUN yum install openssl openssl-devel -y
RUN yum install wget tar gzip -y
RUN wget https://github.com/Kitware/CMake/releases/download/v3.28.0/cmake-3.28.0.tar.gz
RUN tar -xvf cmake-3.28.0.tar.gz
RUN yum install gcc -y
RUN yum install gcc-c++ -y
RUN cd cmake-3.28.0/ \
 && ./configure --prefix=/usr/local/cmake/3.28.0/ \
 && make \
 && make install
# yum install できるのは cmake v2。 eccodesはv3以上が必要。
# RUN yum install cmake -y
RUN yum install gcc-gfortran -y

RUN wget https://confluence.ecmwf.int/download/attachments/45757960/eccodes-2.32.1-Source.tar.gz \
  && tar -xvf eccodes-2.32.1-Source.tar.gz \
  && rm eccodes-2.32.1-Source.tar.gz
ENV LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH
RUN yum install -y https://dl.fedoraproject.org/pub/epel/7/x86_64/Packages/l/libaec-1.0.4-1.el7.x86_64.rpm
RUN yum install -y libaec
RUN yum install -y cmake3
RUN yum install -y https://dl.fedoraproject.org/pub/epel/7/x86_64/Packages/l/libaec-devel-1.0.4-1.el7.x86_64.rpm
RUN yum install -y libaec-devel 
RUN yum install -y perl
RUN mkdir build && cd build && cmake3 ../eccodes-2.32.1-Source && make && make install

# Copy requirements.txt
COPY requirements.txt ${LAMBDA_TASK_ROOT}

# Install the specified packages
RUN pip install -r requirements.txt

# Copy function code
COPY lambda_function.py ${LAMBDA_TASK_ROOT}
COPY src ${LAMBDA_TASK_ROOT}
# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "lambda_function.handler" ]
