
```
.
├─cdk
│ ├── bin
│ │   └── docker-lambda.ts
│ ├── lib
│ │   └── docker-lambda-stack.ts
│ └ package.json
├─python-lambda-project
│  └─ s3
│     ├── Dockerfile
│     ├── lambda_function.py # lambdaで実行したいコード
│     └── requirements.txt # 使用するライブラリ
│
```

## 公式
https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda.DockerImageFunction.html
https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/python-image.html#python-image-base

### python コード上のimportについて
- `import` を使用すると、モジュールまたはパッケージが見つかるまで検索パス内のディレクトリを検索する
- デフォルトでは、`{LAMBDA_TASK_ROOT}` ディレクトリを先に検索する
- 検索パスの他のステップは、使用している Python 用 Lambda ベースイメージのバージョンによって次のように異なる


version|ランタイム|pip|優先順位
--|--|--|--
3.11|`/var/lang/lib/python3.11/site-packages`|`/var/lang/lib/python3.11/site-packages`|`/var/runtime`より`/var/lang/lib`を優先
3.7-3.10|`/var/runtime`|`/var/lang/lib/python3.x/site-packages`|`/var/lang/lib`より`/var/runtime`を優先

## 凡人
https://www.softbank.jp/biz/blog/cloud-technology/articles/202304/cdk-lambda/

## s3

https://github.com/aws-samples/aws-cdk-examples/blob/master/python/lambda-s3-trigger/s3trigger/s3trigger_stack.py
https://github.com/aws-samples/aws-cdk-examples/blob/master/python/lambda-with-existing-s3-code/app.py

