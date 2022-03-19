#!/bin/bash

# 環境変数読込
# . ./.env

# このシェルスクリプトのディレクトリの絶対パスを取得。
bin_dir=$(cd $(dirname $0) && pwd)

# 変数
start_time=2022-03-12T04:00:00Z
end_time=2022-03-12T10:00:00Z 

# 結果ファイル作成
file_name=$(echo $(date -u +"%Y%m%d_%H%M%S"))
file_path=$bin_dir/result/$file_name.csv
mkdir -p $bin_dir/result
touch $file_path

# lambda関数一覧の取得
tmp_functions=$(aws lambda list-functions --query 'Functions[*].FunctionName' --no-paginate | jq -r '.[]')

jq_query='.MetricDataResults[0] | {"id": .Id, "times": .Timestamps, "values": .Values } as $tmp | range(0;($tmp.times|length))|{"id":$tmp.id,"time":$tmp.times[.], "value": $tmp.values[.]} | [.id, .time,.value] | @csv'

# lambdaごとにメトリクスを取得
for v in ${tmp_functions}
do 
  # 改行文字・空白の削除
  trimed_v=$(echo $v)
  # -はidに使用できないので変換
  tmp_id=$(echo $trimed_v | sed 's/-/_/g')
  echo "get metrics $trimed_v"
  query=$(cat $bin_dir/query.json | jq -c | sed "s/{{FunctionName}}/$trimed_v/" | sed "s/{{FunctionId}}/$tmp_id/")
  # メトリクスの取得
  tmp_result=`aws cloudwatch get-metric-data \
  --metric-data-queries $query \
  --start-time $start_time \
  --end-time $end_time 
  `
  # 結果の書込み
  echo $tmp_result | jq  -r "$jq_query"  >> $file_path
done


