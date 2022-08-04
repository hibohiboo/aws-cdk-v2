#!/bin/bash

# シークレットハッシュの生成を試す。
#https://aws.amazon.com/jp/premiumsupport/knowledge-center/cognito-unable-to-verify-secret-hash/
# https://docs.aws.amazon.com/ja_jp/cognito/latest/developerguide/user-pool-settings-client-apps.html

# https://aws.amazon.com/jp/premiumsupport/knowledge-center/cognito-unable-to-verify-secret-hash/
# SECRET=$(python secret_hash.py '<username>' '<app_client_id>' '<app_client_secret>')
# echo $SECRET

# python secret_hash.py '<username>' '<app_client_id>' '<app_client_secret>'
# node secret_hash.js '<username>' '<app_client_id>' '<app_client_secret>'

SECRET=$(node secret_hash.js '<username>' '<app_client_id>' '<app_client_secret>')

# COGNITO_USER_SECRET_HASH=$(node secret_hash.js $COGNITO_USER_SECRET_HASH $COGNITO_CLIENT_ID '<app_client_secret>')