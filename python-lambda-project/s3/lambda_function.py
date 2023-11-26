import sys
import os
import json
import io
import boto3

def handler(event, context):
    region = os.environ.get("AWS_REGION")
    bucket_name = os.environ.get("S3_BUCKET_NAME")
    s3_client = boto3.client('s3')
    s3_object = s3_client.get_object(Bucket=bucket_name, Key='test.json')
    json_data = s3_object['Body'].read()
    data = json.loads(json_data)
    data['test'] = 'world'
    s3_client.put_object(Bucket=bucket_name, Key='test2.json', Body=json.dumps(data))
    return 'Hello ' + data['test']

