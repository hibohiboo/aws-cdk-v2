#!/bin/bash

# 環境変数読込
. ./.env

# このシェルスクリプトのディレクトリの絶対パスを取得。
bin_dir=$(cd $(dirname $0) && pwd)

# 変数の設定

# メトリクスの取得
tmp_result=`aws cloudwatch get-metric-data \
--metric-data-queries $(cat $bin_dir/query.json | jq -c) \
--start-time 2022-03-12T04:00:00Z \
--end-time 2022-03-12T10:00:00Z 
`

mkdir -p $bin_dir/result

echo $tmp_result > $bin_dir/result/result.log
