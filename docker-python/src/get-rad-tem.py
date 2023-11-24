from datetime import timedelta
import pygrib
import pandas as pd
import json
import sys

# 日本時間に直す用
time_diff = timedelta(hours=9)

# ケルビンから℃変換用
F_C_DIFF=273.15

# 1kmメッシュの刻み幅
LAT_STEP=0.025
LON_STEP=0.03125

# マージ用
def merge_lists(list1, list2):
    merged_list = []
    for item1 in list1:
        for item2 in list2:
            if item1[0] == item2[0] and item1[1] == item2[1] and item1[2] == item2[2]:
                merged_list.append([item1[0], item1[1], item1[2], item1[3], item2[3]])
                break
    return merged_list

# 引数取得
json_str = sys.argv[1]
json_obj = json.loads(json_str)
lat = json_obj["lat"]
lon = json_obj["lon"]

# https://predora005.hatenablog.com/entry/2020/10/31/000000
gpv_file = pygrib.open("/grib2/Z__C_RJTD_20171205000000_MSM_GPV_Rjp_Lsurf_FH00-15_grib2.bin")
t_messages = gpv_file.select(parameterName="Downward short-wave radiation flux")

# 日射量データ取得用配列の初期化
radiation_data = []

# データの探索
for grb in t_messages:
    values, lats, lons = grb.data(lat1=lat - LAT_STEP,lat2=lat + LAT_STEP,lon1=lon - LON_STEP,lon2=lon + LON_STEP)
    jst =  grb.validDate + time_diff
    for i, lat in enumerate(lats):
        for j, x in enumerate(lat):
          radiation_data.append([jst, lats[i][j], lons[i][j], values[i][j]])
    
t_messages_temperature = gpv_file.select(name="Temperature")

# 気温データ取得用配列の初期化
temperature_data = []

# データの探索
for grb in t_messages_temperature:
    values, lats, lons = grb.data(lat1=lat - LAT_STEP,lat2=lat + LAT_STEP,lon1=lon - LON_STEP,lon2=lon + LON_STEP)
    jst =  grb.validDate + time_diff
    for i, lat in enumerate(lats):
        for j, x in enumerate(lat):
          temperature_data.append([jst, lats[i][j], lons[i][j], values[i][j] - F_C_DIFF])

# ファイルクローズ
gpv_file.close()

# DataFrameの作成
merged = merge_lists(radiation_data, temperature_data)
df = pd.DataFrame(merged, columns=['Date', 'Latitude', 'Longitude', 'Radiation', 'Temperature'])


print(df)
