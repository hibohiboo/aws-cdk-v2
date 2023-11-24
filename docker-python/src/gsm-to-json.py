
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

gpv_file = pygrib.open("/grib2/Z__C_RJTD_20221013000000_GSM_GPV_Rjp_Gll0p1deg_Lsurf_FD0000-0100_grib2.bin")

analDate = grib.getAnalDate(gpv_file, lat, lon)

temperature = grib.getParamData(gpv_file, "Temperature", lat, lon)
radiation = grib.getParamData(gpv_file, "Downward short-wave radiation flux", lat, lon)
pressure = grib.getParamData(gpv_file, "Pressure", lat, lon)
mslp = grib.getParamData(gpv_file, "Pressure reduced to MSL", lat, lon)
uwind = grib.getParamData(gpv_file, "u-component of wind", lat, lon)
vwind = grib.getParamData(gpv_file, "v-component of wind", lat, lon)
rh = grib.getParamData(gpv_file, "Relative humidity", lat, lon)
# rain = grib.getParamData(gpv_file, "Total Precipitation", lat, lon)
# lcloud = grib.getParamData(gpv_file, "Low Cloud Cover", lat, lon)
# mcloud = grib.getParamData(gpv_file, "Medium Cloud Cover", lat, lon)
# hcloud = grib.getParamData(gpv_file, "High Cloud Cover", lat, lon)
# tcloud = grib.getParamData(gpv_file, "Total Cloud Cover", lat, lon)


# print(radiation_data)

result_json = output.toOutputJson(temperature, radiation, pressure, mslp, uwind, vwind, rh, analDate)


with open("/dist/output.json", 'w') as file:
    # ファイルに書き込む
    file.write(result_json)
