#!/bin/bash
INSTANCE_ID=$( aws ec2 describe-instances --filter "Name=instance-state-name,Values=running" "Name=tag:Name,Values=BastionHost" --query "Reservations[].Instances[].InstanceId" --profile produser | jq -r '.[0]')

aws ec2 reboot-instances --instance-ids $INSTANCE_ID --profile produser