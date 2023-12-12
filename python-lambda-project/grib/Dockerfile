FROM public.ecr.aws/lambda/python:3.11

# https://predora005.hatenablog.com/entry/2020/10/28/190000
RUN yum install openssl openssl-devel wget tar gzip cmake3 gcc-gfortran gcc-c++ perl -y
RUN yum install -y https://dl.fedoraproject.org/pub/epel/7/x86_64/Packages/l/libaec-1.0.4-1.el7.x86_64.rpm
RUN yum install -y https://dl.fedoraproject.org/pub/epel/7/x86_64/Packages/l/libaec-devel-1.0.4-1.el7.x86_64.rpm
RUN yum install -y libaec libaec-devel 

RUN wget https://confluence.ecmwf.int/download/attachments/45757960/eccodes-2.32.1-Source.tar.gz \
  && tar -xvf eccodes-2.32.1-Source.tar.gz \
  && rm eccodes-2.32.1-Source.tar.gz
RUN mkdir build && cd build && cmake3 ../eccodes-2.32.1-Source && make && make install
# RUN yum remove openssl openssl-devel wget tar gzip cmake3 gcc-gfortran perl  gcc-c++ libaec libaec-devel -y

# Copy requirements.txt
COPY requirements.txt ${LAMBDA_TASK_ROOT}

# Install the specified packages
RUN pip install -r requirements.txt

# Copy function code
COPY lambda_function.py ${LAMBDA_TASK_ROOT}

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "lambda_function.handler" ]
