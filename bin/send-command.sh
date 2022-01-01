#!/bin/bash
INSTANCE_ID=i-hoeg
DOCUMENT_NAME=port-relay
TARGET_HOST="aurorastack-clusterforauroradbf34ede-o4ksmc7o9se4.cluster-chi1oriyu1of.ap-northeast-1.rds.amazonaws.com"
# secret=$(aws secretsmanager get-secret-value --region ap-northeast-1 --secret-id aurora-user-secrets --profile produser | jq .SecretString | jq fromjson)
#  socat tcp4-listen:5432,reuseaddr,fork TCP:aurorastack-clusterforauroradbf34ede-o4ksmc7o9se4.cluster-chi1oriyu1of.ap-northeast-1.rds.amazonaws.com:5432 

aws ssm send-command \
  --instance-ids ${INSTANCE_ID} \
  --document-name ${DOCUMENT_NAME} \
  --parameters targetHost=${TARGET_HOST} \
  --profile produser