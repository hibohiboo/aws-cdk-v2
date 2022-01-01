#!/bin/bash
INSTANCE_ID=i-hoge

aws ssm start-session \
  --target ${INSTANCE_ID} \
  --profile produser