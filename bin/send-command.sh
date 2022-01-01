#!/bin/bash
DOCUMENT_NAME='port-relay'
INSTANCE_ID=$( aws ec2 describe-instances --filter "Name=instance-state-name,Values=running" "Name=tag:Name,Values=BastionHost" --query "Reservations[].Instances[].InstanceId" --profile produser | jq -r '.[0]')

aws ssm send-command \
  --instance-ids ${INSTANCE_ID} \
  --document-name ${DOCUMENT_NAME} \
  --profile produser
