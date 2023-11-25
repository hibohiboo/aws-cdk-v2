
import pygrib
import pandas as pd
import json
import sys

from lib import util
from lib import grib
from lib import output

# メッシュの刻み幅
LAT_STEP=0.1 / 2
LON_STEP=0.125 / 2

# 引数取得
json_str = sys.argv[1]
json_obj = json.loads(json_str)
lat = json_obj["lat"]
lon = json_obj["lon"]
# FILE_NAME = "Z__C_RJTD_20231124000000_GSM_GPV_Rjp_Gll0p1deg_Lsurf_FD0000-0100_grib2"
# FILE_NAME = "Z__C_RJTD_20231124000000_GSM_GPV_Rjp_Gll0p1deg_Lsurf_FD0101-0200_grib2"
# FILE_NAME = "Z__C_RJTD_20231124000000_GSM_GPV_Rjp_Gll0p1deg_Lsurf_FD0201-0300_grib2"
FILE_NAME = "Z__C_RJTD_20231124000000_GSM_GPV_Rjp_Gll0p1deg_Lsurf_FD0401-0500_grib2"
# FILE_NAME = "Z__C_RJTD_20231124000000_GSM_GPV_Rjp_Gll0p1deg_Lsurf_FD0501-0512_grib2"
# http://database.rish.kyoto-u.ac.jp/arch/jmadata/data/gpv/original/2023/11/24/ より
gpv_file = pygrib.open("/grib2/" + FILE_NAME + ".bin")

analDate = grib.getBaseData(gpv_file, lat, lon,  LAT_STEP, LON_STEP)

temperature = grib.getParamData(gpv_file, "Temperature", lat, lon, LAT_STEP, LON_STEP)
radiation = grib.getParamDataMaybeFirstNone(gpv_file, "Downward short-wave radiation flux", lat, lon, LAT_STEP, LON_STEP)
pressure = grib.getParamData(gpv_file, "Pressure", lat, lon, LAT_STEP, LON_STEP)
mslp = grib.getParamData(gpv_file, "Pressure reduced to MSL", lat, lon, LAT_STEP, LON_STEP)
uwind = grib.getParamData(gpv_file, "u-component of wind", lat, lon, LAT_STEP, LON_STEP)
vwind = grib.getParamData(gpv_file, "v-component of wind", lat, lon, LAT_STEP, LON_STEP)
rh = grib.getParamData(gpv_file, "Relative humidity", lat, lon, LAT_STEP, LON_STEP)
rain = grib.getParamDataMaybeFirstNone(gpv_file, "Total precipitation", lat, lon, LAT_STEP, LON_STEP)
lcloud = grib.getParamData(gpv_file, "Low cloud cover", lat, lon, LAT_STEP, LON_STEP)
mcloud = grib.getParamData(gpv_file, "Medium cloud cover", lat, lon, LAT_STEP, LON_STEP)
hcloud = grib.getParamData(gpv_file, "High cloud cover", lat, lon, LAT_STEP, LON_STEP)
tcloud = grib.getParamData(gpv_file, "Total cloud cover", lat, lon, LAT_STEP, LON_STEP)

# print(radiation_data)

result_json = output.toOutputJson(temperature, radiation, pressure, mslp, uwind, vwind, rh,rain,lcloud,mcloud,hcloud,tcloud, analDate)
result_csv = output.toOutputCSV(temperature, radiation, pressure, mslp, uwind, vwind, rh,rain,lcloud,mcloud,hcloud,tcloud, analDate)
df = pd.DataFrame(* result_csv, columns=['validDate','Latitude', 'Longitude', 'analDate', 'temperature', 'Radiation', 'pressure', 'mslp', 'uwind', 'vwind', 'rh', 'rain', 'lcloud', 'mcloud', 'hcloud', 'tcloud'])
print(df)

with open("/dist/" + FILE_NAME + ".json", 'w') as file:
    # ファイルに書き込む
    file.write(result_json)
