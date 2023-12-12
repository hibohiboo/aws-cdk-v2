import sys
import os
import json
import io
import boto3
import pygrib
import pandas as pd
from datetime import timedelta, datetime
import math
import tempfile


def handler(event, context):
    lat = 35.6745
    lon = 139.7169
    region = os.environ.get("AWS_REGION")
    bucket_name = os.environ.get("S3_BUCKET_NAME")
    s3_client = boto3.client('s3')
    filepath = tempfile.NamedTemporaryFile().name
    s3_client.download_file(bucket_name, 'Z__C_RJTD_20221013000000_GSM_GPV_Rjp_Gll0p1deg_Lsurf_FD0000-0100_grib2.bin', filepath)
    data = execute(filepath, lat, lon)
    s3_client.put_object(Bucket=bucket_name, Key='test2.json', Body=json.dumps(data))
    os.remove(filepath)
    return 'Success'

# メッシュの刻み幅
LAT_STEP=0.1 / 2 # 緯度
LON_STEP=0.125 / 2 # 経度
def execute(filepath, lat, lon):
    gpv_file = pygrib.open(filepath)
    analDate = getBaseData(gpv_file, lat, lon,  LAT_STEP, LON_STEP)
    temperature = getParamData(gpv_file, "Temperature", lat, lon, LAT_STEP, LON_STEP)
    return toOutputJsonSingle(temperature, analDate)
    # radiation = getParamData(gpv_file, "Downward short-wave radiation flux", lat, lon, LAT_STEP, LON_STEP)
    # pressure = getParamData(gpv_file, "Pressure", lat, lon, LAT_STEP, LON_STEP)
    # mslp = getParamData(gpv_file, "Pressure reduced to MSL", lat, lon, LAT_STEP, LON_STEP)
    # uwind = getParamData(gpv_file, "u-component of wind", lat, lon, LAT_STEP, LON_STEP)
    # vwind = getParamData(gpv_file, "v-component of wind", lat, lon, LAT_STEP, LON_STEP)
    # rh = getParamData(gpv_file, "Relative humidity", lat, lon, LAT_STEP, LON_STEP)
    # rain = getParamData(gpv_file, "Total precipitation", lat, lon, LAT_STEP, LON_STEP)
    # lcloud = getParamData(gpv_file, "Low cloud cover", lat, lon, LAT_STEP, LON_STEP)
    # mcloud = getParamData(gpv_file, "Medium cloud cover", lat, lon, LAT_STEP, LON_STEP)
    # hcloud = getParamData(gpv_file, "High cloud cover", lat, lon, LAT_STEP, LON_STEP)
    # tcloud = getParamData(gpv_file, "Total cloud cover", lat, lon, LAT_STEP, LON_STEP)
    # result_json = toOutputJson(temperature, radiation, pressure, mslp, uwind, vwind, rh,rain,lcloud,mcloud,hcloud,tcloud, analDate)
    # result_csv = toOutputCSV(temperature, radiation, pressure, mslp, uwind, vwind, rh,rain,lcloud,mcloud,hcloud,tcloud, analDate)
    # df = pd.DataFrame(* result_csv, columns=['validDate','Latitude', 'Longitude', 'analDate', 'temperature', 'Radiation', 'pressure', 'mslp', 'uwind', 'vwind', 'rh', 'rain', 'lcloud', 'mcloud', 'hcloud', 'tcloud'])
    # return df.to_csv(index=False)


# 日本時間に直す用
time_diff = timedelta(hours=9)

def getParamData(gpv_file, parameterName, lat, lon, LAT_STEP, LON_STEP):
  la1 = lat - LAT_STEP
  la2 = lat + LAT_STEP
  lo1 = lon - LON_STEP
  lo2 = lon + LON_STEP

  t_messages = gpv_file.select(parameterName=parameterName)

  dataMap = {}
  # データの探索
  for grb in t_messages:
      values, lats, lons = grb.data(lat1=la1,lat2=la2,lon1=lo1,lon2=lo2)
      # 予報時刻(UTC)を日本時間に直す
      # jst =  grb.validDate + time_diff
      # validDateは「Total precipitation」と「Downward short-wave radiation flux」では不適切なので、validtyDateとvalidityTimeを使う
      jst =  datetime.strptime(str(grb.validityDate) + str(grb.validityTime).zfill(4), "%Y%m%d%H%M") + time_diff
      for i, lat in enumerate(lats):
          for j, x in enumerate(lat):
            la = round_up_to_5_digits(lats[i][j])
            lo = round_up_to_5_digits(lons[i][j])
            key = str(la) + "_" + str(lo)
            if key not in dataMap:
              dataMap[key] = {}
            dataMap[key][t2s(jst)] = round_up_to_5_digits(values[i][j])

  return dataMap

# 代表として気温のデータから、解析基準時刻を取得する
def getBaseData(gpv_file, lat, lon, LAT_STEP, LON_STEP):
  t_messages = gpv_file.select(parameterName="Temperature")
  la1 = lat - LAT_STEP
  la2 = lat + LAT_STEP
  lo1 = lon - LON_STEP
  lo2 = lon + LON_STEP
    # データの探索
  for grb in t_messages:
      values, lats, lons = grb.data(lat1=la1,lat2=la2,lon1=lo1,lon2=lo2)
      analDate = t2s(grb.analDate + time_diff)
      return analDate


DATE_FORMAT="%Y-%m-%d %H:%M:%S"
# datetime型をstringに変換
def t2s(time):
    return time.strftime(DATE_FORMAT)
def s2t(time_str):
    return datetime.strptime(time_str, DATE_FORMAT)
def round_up_to_5_digits(number):
    return round(number, 4)


# ケルビンから℃変換用
F_C_DIFF=273.15

def toOutputJsonSingle(temperature, analDate):
    result_list = [{'lat_lon': key, 'values': toOutputSingle(key, temperature,analDate)} for key, value in temperature.items()]
    return result_list

def toOutputSingle( lat_lon, temperature, analDate):
    result = [{'validDate': key
              , 'analDate': analDate
              , 'temperature': round_up_to_5_digits(value - F_C_DIFF)
              } for key, value in temperature[lat_lon].items()]
    return result

def toOutputJson(temperature, radiation, pressure, mslp, uwind, vwind, rh, rain,lcloud,mcloud,hcloud,tcloud,analDate):
    result_list = [{'lat_lon': key, 'values': toOutput(key, temperature, radiation, pressure, mslp, uwind, vwind, rh,rain,lcloud,mcloud,hcloud,tcloud,analDate)} for key, value in temperature.items()]
    return json.dumps(result_list, indent=4)

def toOutput( lat_lon, temperature, radiation, pressure, mslp, uwind, vwind, rh,rain,lcloud,mcloud,hcloud,tcloud, analDate):
    result = [{'validDate': key
              , 'analDate': analDate
              , 'temperature': round_up_to_5_digits(value - F_C_DIFF)
              , 'radiation': radiation[lat_lon].get(key, None)
              , 'pressure': pressure[lat_lon].get(key, None)
              , 'mslp': mslp[lat_lon].get(key, None)
              , 'uwind': uwind[lat_lon].get(key, None)
              , 'vwind': vwind[lat_lon].get(key, None)
              , 'rh': rh[lat_lon].get(key, None)
              , 'rain': rain[lat_lon].get(key, None)
              , 'lcloud': lcloud[lat_lon].get(key, None)
              , 'mcloud': mcloud[lat_lon].get(key, None)
              , 'hcloud': hcloud[lat_lon].get(key, None)
              , 'tcloud': tcloud[lat_lon].get(key, None)
              } for key, value in temperature[lat_lon].items()]
    return result

def toOutputCSV(temperature, radiation, pressure, mslp, uwind, vwind, rh, rain,lcloud,mcloud,hcloud,tcloud,analDate):
    result_list = [[* toOutputCSVValue(key, temperature, radiation, pressure, mslp, uwind, vwind, rh,rain,lcloud,mcloud,hcloud,tcloud,analDate)] for key, value in temperature.items()]
    return result_list

def toOutputCSVValue( lat_lon, temperature, radiation, pressure, mslp, uwind, vwind, rh,rain,lcloud,mcloud,hcloud,tcloud,analDate):
    result = [[ s2t(key) # validDate
              , * [float(x) for x in lat_lon.split('_')] 
              , analDate
              , round_up_to_5_digits(value - F_C_DIFF)
              ,  radiation[lat_lon].get(key, None)
              ,  pressure[lat_lon].get(key, None)
              ,  mslp[lat_lon].get(key, None)
              ,  uwind[lat_lon].get(key, None)
              ,  vwind[lat_lon].get(key, None)
              ,  rh[lat_lon].get(key, None)
              ,  rain[lat_lon].get(key, None)
              ,  lcloud[lat_lon].get(key, None)
              ,  mcloud[lat_lon].get(key, None)
              ,  hcloud[lat_lon].get(key, None)
              ,  tcloud[lat_lon].get(key, None)
     ] for key, value in temperature[lat_lon].items()]
    return result


# 日本時間に直す用
time_diff = timedelta(hours=9)

def getParamData(gpv_file, parameterName, lat, lon, LAT_STEP, LON_STEP):
  la1 = lat - LAT_STEP
  la2 = lat + LAT_STEP
  lo1 = lon - LON_STEP
  lo2 = lon + LON_STEP

  t_messages = gpv_file.select(parameterName=parameterName)

  dataMap = {}
  # データの探索
  for grb in t_messages:
      values, lats, lons = grb.data(lat1=la1,lat2=la2,lon1=lo1,lon2=lo2)
      # 予報時刻(UTC)を日本時間に直す
      # jst =  grb.validDate + time_diff
      # validDateは「Total precipitation」と「Downward short-wave radiation flux」では不適切なので、validtyDateとvalidityTimeを使う
      jst =  datetime.strptime(str(grb.validityDate) + str(grb.validityTime).zfill(4), "%Y%m%d%H%M") + time_diff
      for i, lat in enumerate(lats):
          for j, x in enumerate(lat):
            la = round_up_to_5_digits(lats[i][j])
            lo = round_up_to_5_digits(lons[i][j])
            key = str(la) + "_" + str(lo)
            if key not in dataMap:
              dataMap[key] = {}
            dataMap[key][t2s(jst)] = round_up_to_5_digits(values[i][j])

  return dataMap

# 代表として気温のデータから、解析基準時刻を取得する
def getBaseData(gpv_file, lat, lon, LAT_STEP, LON_STEP):
  t_messages = gpv_file.select(parameterName="Temperature")
  la1 = lat - LAT_STEP
  la2 = lat + LAT_STEP
  lo1 = lon - LON_STEP
  lo2 = lon + LON_STEP
    # データの探索
  for grb in t_messages:
      values, lats, lons = grb.data(lat1=la1,lat2=la2,lon1=lo1,lon2=lo2)
      analDate = t2s(grb.analDate + time_diff)
      return analDate

