#!/bin/bash
DOCUMENT_NAME='port-relay'
INSTANCE_ID=$( aws ec2 describe-instances --filter "Name=instance-state-name,Values=running" "Name=tag:Name,Values=BastionHost" --query "Reservations[].Instances[].InstanceId" --profile produser | jq -r '.[0]')
SECRET=$(aws secretsmanager get-secret-value --region ap-northeast-1 --secret-id aurora-user-secrets --profile produser | jq .SecretString | jq fromjson)
TARGET_HOST=$(echo $SECRET | jq -r .host)

aws ssm send-command \
  --instance-ids ${INSTANCE_ID} \
  --document-name ${DOCUMENT_NAME} \
  --parameters targetHost=${TARGET_HOST} \
  --profile produser

