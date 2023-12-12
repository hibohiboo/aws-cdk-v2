import sys
import os
import json
import io
import boto3
from src.gsm-to-json import execute

def handler(event, context):
    region = os.environ.get("AWS_REGION")
    bucket_name = os.environ.get("S3_BUCKET_NAME")
    s3_client = boto3.client('s3')
    s3_object = s3_client.get_object(Bucket=bucket_name, Key='Z__C_RJTD_20221013000000_GSM_GPV_Rjp_Gll0p1deg_Lsurf_FD0000-0100_grib2.bin')
    file_data = s3_object['Body'].read()
    lat = 35.6745
    lon = 139.7169
    execute(file_data, lat, lon)
    s3_client.put_object(Bucket=bucket_name, Key='test2.json', Body=json.dumps(data))
    return 'Hello ' + data['test']

