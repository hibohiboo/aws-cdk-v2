from datetime import timedelta
import pygrib
import pandas as pd
import json
import sys

# 日本時間に直す用
time_diff = timedelta(hours=9)

# ケルビンから℃変換用
F_C_DIFF=273.15

# メッシュの刻み幅
LAT_STEP=0.1 / 2
LON_STEP=0.125 / 2

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
la1 = lat - LAT_STEP
la2 = lat + LAT_STEP
lo1 = lon - LON_STEP
lo2 = lon + LON_STEP

gpv_file = pygrib.open("/grib2/Z__C_RJTD_20221013000000_GSM_GPV_Rjp_Gll0p1deg_Lsurf_FD0000-0100_grib2.bin")
t_messages = gpv_file.select(parameterName="Downward short-wave radiation flux")

# 日射量データ取得用配列の初期化
radiation_data = []

# データの探索
for grb in t_messages:
    values, lats, lons = grb.data(lat1=la1,lat2=la2,lon1=lo1,lon2=lo2)
    jst =  grb.validDate + time_diff
    for i, lat in enumerate(lats):
        for j, x in enumerate(lat):
          radiation_data.append([jst, lats[i][j], lons[i][j], values[i][j]])
    
t_messages_temperature = gpv_file.select(parameterName="Temperature")

# 気温データ取得用配列の初期化
temperature_data = []

# データの探索
for grb in t_messages_temperature:
    values, lats, lons = grb.data(lat1=la1,lat2=la2,lon1=lo1,lon2=lo2)
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
