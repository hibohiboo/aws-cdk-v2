FROM python:3

WORKDIR /var/task

# https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/images-create.html
COPY app.py /var/task

# lambda実行用
RUN pip install awslambdaric

ENTRYPOINT [ "/usr/local/bin/python", "-m", "awslambdaric" ]

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "app.handler" ]