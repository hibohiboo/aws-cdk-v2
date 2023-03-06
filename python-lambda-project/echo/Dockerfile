# Define function directory
ARG FUNCTION_DIR="/var/task"

FROM python:3 as build-image

ARG FUNCTION_DIR
RUN mkdir -p ${FUNCTION_DIR}
RUN pip install \
  --target ${FUNCTION_DIR} \
  awslambdaric
COPY app.py ${FUNCTION_DIR}

FROM python:3 
ARG FUNCTION_DIR
WORKDIR ${FUNCTION_DIR}

COPY --from=build-image ${FUNCTION_DIR} ${FUNCTION_DIR}

ENTRYPOINT [ "/usr/local/bin/python", "-m", "awslambdaric" ]
CMD [ "app.handler" ]
