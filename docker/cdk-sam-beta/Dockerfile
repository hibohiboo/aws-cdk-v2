FROM node:16

WORKDIR /work

# -L --location リダイレクトも追う
RUN curl "https://github.com/aws/aws-sam-cli/releases/download/sam-cli-beta-cdk/aws-sam-cli-linux-x86_64.zip" -o "awscliv2.zip" -L
RUN unzip awscliv2.zip
RUN /work/install
WORKDIR /app
ENTRYPOINT [ "sam-beta-cdk" ]

