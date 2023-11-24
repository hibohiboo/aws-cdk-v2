from datetime import timedelta
import pygrib
import pandas as pd
import json
import sys

from lib import util


# 日本時間に直す用
time_diff = timedelta(hours=9)

# ケルビンから℃変換用
F_C_DIFF=273.15

# メッシュの刻み幅
LAT_STEP=0.1 / 2
LON_STEP=0.125 / 2

# 引数取得
json_str = sys.argv[1]
json_obj = json.loads(json_str)
lat = json_obj["lat"]
lon = json_obj["lon"]
la1 = lat - LAT_STEP
la2 = lat + LAT_STEP
lo1 = lon - LON_STEP
lo2 = lon + LON_STEP

gpv_file = pygrib.open("/grib2/Z__C_RJTD_20221013000000_GSM_GPV_Rjp_Gll0p1deg_Lsurf_FD0000-0100_grib2.bin")
t_messages = gpv_file.select(parameterName="Downward short-wave radiation flux")

# 日射量データ取得用配列の初期化
radiation_data = []
analDate = ""
validDates = []
dataMap = {}
# データの探索
for grb in t_messages:
    values, lats, lons = grb.data(lat1=la1,lat2=la2,lon1=lo1,lon2=lo2)
    jst =  grb.validDate + time_diff
    jst2 =  grb.analDate + time_diff
    validDates.append(util.t2s(jst))
    analDate = util.t2s(jst2)
    for i, lat in enumerate(lats):
        for j, x in enumerate(lat):
          la = util.round_up_to_5_digits(lats[i][j])
          lo = util.round_up_to_5_digits(lons[i][j])
          key = str(la) + "_" + str(lo)
          if key not in dataMap:
            dataMap[key] = {}
          dataMap[key][util.t2s(jst)] = util.round_up_to_5_digits(values[i][j])

# print(radiation_data)

with open("/dist/output.json", 'w') as file:
    # ファイルに書き込む
    file.write(json.dumps(dataMap))
with open("/dist/dates.json", 'w') as file:
    # ファイルに書き込む
    file.write(json.dumps(validDates))
