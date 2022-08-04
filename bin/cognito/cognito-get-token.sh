#!/bin/bash

# https://dev.classmethod.jp/articles/obtain-access-tokens-for-cognito-users-using-aws-cli/

COGNITO_USER_POOL_ID=ap-northeast-1_xxxxx
COGNITO_CLIENT_ID=aaaaaaaaaa
AWS_USER_NAME=hoge
AWS_USER_PASSWORD=pass

aws cognito-idp admin-initiate-auth \
  --user-pool-id ${COGNITO_USER_POOL_ID} \
  --client-id ${COGNITO_CLIENT_ID} \
  --auth-flow "ADMIN_USER_PASSWORD_AUTH" \
  --auth-parameters USERNAME=${AWS_USER_NAME},PASSWORD=${AWS_USER_PASSWORD}

