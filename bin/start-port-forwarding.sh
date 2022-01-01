#!/bin/bash
LOCAL_PORT=15432
SECRET_NAME=aurora-user-secrets
INSTANCE_ID=$( aws ec2 describe-instances --filter "Name=instance-state-name,Values=running" "Name=tag:Name,Values=BastionHost" --query "Reservations[].Instances[].InstanceId" --profile produser | jq -r '.[0]')
SECRET=$(aws secretsmanager get-secret-value --region ap-northeast-1 --secret-id $SECRET_NAME --profile produser | jq .SecretString | jq fromjson)
PASSWORD=$(echo $SECRET | jq -r .password)
USERNAME=$(echo $SECRET | jq -r .username)
PORT=$(echo $SECRET | jq -r .port)

# dbクライアントに設定する用の情報を表示
echo 'DB接続用情報(ポートフォワーディング)'
echo host= localhost
echo databasename= postgres
echo port= $LOCAL_PORT
echo username= $USERNAME
echo password= $PASSWORD

# ポートフォワーディング開始
aws ssm start-session \
    --target ${INSTANCE_ID} \
    --document-name AWS-StartPortForwardingSession \
    --parameters portNumber=$PORT,localPortNumber=$LOCAL_PORT \
    --profile produser




