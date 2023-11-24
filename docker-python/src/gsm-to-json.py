
import pygrib
import pandas as pd
import json
import sys

from lib import util
from lib import grib
from lib import output

# 引数取得
json_str = sys.argv[1]
json_obj = json.loads(json_str)
lat = json_obj["lat"]
lon = json_obj["lon"]
FILE_NAME = "Z__C_RJTD_20231124000000_GSM_GPV_Rjp_Gll0p1deg_Lsurf_FD0000-0100_grib2"
# FILE_NAME = "Z__C_RJTD_20231124000000_GSM_GPV_Rjp_Gll0p1deg_Lsurf_FD0101-0200_grib2"
# FILE_NAME = "Z__C_RJTD_20231124000000_GSM_GPV_Rjp_Gll0p1deg_Lsurf_FD0201-0300_grib2"
# http://database.rish.kyoto-u.ac.jp/arch/jmadata/data/gpv/original/2023/11/24/ より
gpv_file = pygrib.open("/grib2/" + FILE_NAME + ".bin")

analDate = grib.getBaseData(gpv_file, lat, lon)

temperature = grib.getParamData(gpv_file, "Temperature", lat, lon)
radiation = grib.getParamDataMaybeFirstNone(gpv_file, "Downward short-wave radiation flux", lat, lon)
pressure = grib.getParamData(gpv_file, "Pressure", lat, lon)
mslp = grib.getParamData(gpv_file, "Pressure reduced to MSL", lat, lon)
uwind = grib.getParamData(gpv_file, "u-component of wind", lat, lon)
vwind = grib.getParamData(gpv_file, "v-component of wind", lat, lon)
rh = grib.getParamData(gpv_file, "Relative humidity", lat, lon)
rain = grib.getParamDataMaybeFirstNone(gpv_file, "Total precipitation", lat, lon)
lcloud = grib.getParamData(gpv_file, "Low cloud cover", lat, lon)
mcloud = grib.getParamData(gpv_file, "Medium cloud cover", lat, lon)
hcloud = grib.getParamData(gpv_file, "High cloud cover", lat, lon)
tcloud = grib.getParamData(gpv_file, "Total cloud cover", lat, lon)

# print(radiation_data)

result_json = output.toOutputJson(temperature, radiation, pressure, mslp, uwind, vwind, rh,rain,lcloud,mcloud,hcloud,tcloud, analDate)


with open("/dist/" + FILE_NAME + ".json", 'w') as file:
    # ファイルに書き込む
    file.write(result_json)