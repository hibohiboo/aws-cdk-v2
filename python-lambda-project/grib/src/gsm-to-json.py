
import pygrib
import pandas as pd
import json
import sys

from lib import util
from lib import grib
from lib import output

# メッシュの刻み幅
LAT_STEP=0.1 / 2 # 緯度
LON_STEP=0.125 / 2 # 経度
def execute(gribstr, lat, lon):
    gpv_file = pygrib.fromstring(gribstr)
    analDate = grib.getBaseData(gpv_file, lat, lon,  LAT_STEP, LON_STEP)
    temperature = grib.getParamData(gpv_file, "Temperature", lat, lon, LAT_STEP, LON_STEP)
    radiation = grib.getParamData(gpv_file, "Downward short-wave radiation flux", lat, lon, LAT_STEP, LON_STEP)
    pressure = grib.getParamData(gpv_file, "Pressure", lat, lon, LAT_STEP, LON_STEP)
    mslp = grib.getParamData(gpv_file, "Pressure reduced to MSL", lat, lon, LAT_STEP, LON_STEP)
    uwind = grib.getParamData(gpv_file, "u-component of wind", lat, lon, LAT_STEP, LON_STEP)
    vwind = grib.getParamData(gpv_file, "v-component of wind", lat, lon, LAT_STEP, LON_STEP)
    rh = grib.getParamData(gpv_file, "Relative humidity", lat, lon, LAT_STEP, LON_STEP)
    rain = grib.getParamData(gpv_file, "Total precipitation", lat, lon, LAT_STEP, LON_STEP)
    lcloud = grib.getParamData(gpv_file, "Low cloud cover", lat, lon, LAT_STEP, LON_STEP)
    mcloud = grib.getParamData(gpv_file, "Medium cloud cover", lat, lon, LAT_STEP, LON_STEP)
    hcloud = grib.getParamData(gpv_file, "High cloud cover", lat, lon, LAT_STEP, LON_STEP)
    tcloud = grib.getParamData(gpv_file, "Total cloud cover", lat, lon, LAT_STEP, LON_STEP)
    result_json = output.toOutputJson(temperature, radiation, pressure, mslp, uwind, vwind, rh,rain,lcloud,mcloud,hcloud,tcloud, analDate)
    result_csv = output.toOutputCSV(temperature, radiation, pressure, mslp, uwind, vwind, rh,rain,lcloud,mcloud,hcloud,tcloud, analDate)
    df = pd.DataFrame(* result_csv, columns=['validDate','Latitude', 'Longitude', 'analDate', 'temperature', 'Radiation', 'pressure', 'mslp', 'uwind', 'vwind', 'rh', 'rain', 'lcloud', 'mcloud', 'hcloud', 'tcloud'])
    return df.to_csv(index=False)
