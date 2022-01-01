#!/bin/bash
INSTANCE_ID=i-fuga

aws ssm start-session \
    --target ${INSTANCE_ID} \
    --document-name AWS-StartPortForwardingSession \
    --parameters portNumber=5432,localPortNumber=15432 \
    --profile produser