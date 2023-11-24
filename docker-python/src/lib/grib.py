from datetime import timedelta
from lib import util

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
      jst =  grb.validDate + time_diff
      for i, lat in enumerate(lats):
          for j, x in enumerate(lat):
            la = util.round_up_to_5_digits(lats[i][j])
            lo = util.round_up_to_5_digits(lons[i][j])
            key = str(la) + "_" + str(lo)
            if key not in dataMap:
              dataMap[key] = {}
            dataMap[key][util.t2s(jst)] = util.round_up_to_5_digits(values[i][j])

  return dataMap

# 日射量と降水量は１時間間ずれる
def getParamDataMaybeFirstNone(gpv_file, parameterName, lat, lon, LAT_STEP, LON_STEP):
  la1 = lat - LAT_STEP
  la2 = lat + LAT_STEP
  lo1 = lon - LON_STEP
  lo2 = lon + LON_STEP

  t_messages = gpv_file.select(parameterName=parameterName)

  bias = 1
  dataMap = {}
  # データの探索
  for grb in t_messages:
      values, lats, lons = grb.data(lat1=la1,lat2=la2,lon1=lo1,lon2=lo2)

      jst =  grb.validDate + time_diff + timedelta(hours=bias)
      for i, lat in enumerate(lats):
          for j, x in enumerate(lat):
            la = util.round_up_to_5_digits(lats[i][j])
            lo = util.round_up_to_5_digits(lons[i][j])
            key = str(la) + "_" + str(lo)
            if key not in dataMap:
              dataMap[key] = {}
            dataMap[key][util.t2s(jst)] = util.round_up_to_5_digits(values[i][j])

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
      analDate = util.t2s(grb.analDate + time_diff)
      return analDate

