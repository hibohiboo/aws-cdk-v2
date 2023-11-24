from datetime import timedelta
import pygrib
import pandas as pd

time_diff = timedelta(hours=9)

gpv_file = pygrib.open("/grib2/Z__C_RJTD_20171205000000_MSM_GPV_Rjp_Lsurf_FH00-15_grib2.bin")
t_messages = gpv_file.select(parameterName="Downward short-wave radiation flux")

# 日射量データ取得用配列の初期化
radiation_data = []

# データの探索
for grb in t_messages:
    values, lats, lons = grb.data()
    jst =  grb.validDate + time_diff

    for i, lat in enumerate(lats):
        for j, x in enumerate(lat):
          radiation_data.append([jst, lats[i][j], lons[i][j], values[i][j]])
    

# ファイルクローズ
gpv_file.close()

# DataFrameの作成
df = pd.DataFrame(radiation_data, columns=['Date', 'Latitude', 'Longitude', 'Radiation'])


print(df)
