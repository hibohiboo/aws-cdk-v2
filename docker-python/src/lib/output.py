import json
from lib import util

# ケルビンから℃変換用
F_C_DIFF=273.15

def toOutputJson(temperature, radiation, pressure, mslp, uwind, vwind, rh, rain,lcloud,mcloud,hcloud,tcloud,analDate):
    result_list = [{'lat_lon': key, 'values': toOutput(key, temperature, radiation, pressure, mslp, uwind, vwind, rh,rain,lcloud,mcloud,hcloud,tcloud,analDate)} for key, value in temperature.items()]
    return json.dumps(result_list, indent=4)

def toOutput( lat_lon, temperature, radiation, pressure, mslp, uwind, vwind, rh,rain,lcloud,mcloud,hcloud,tcloud, analDate):
    result = [{'validDate': key
              , 'analDate': analDate
              , 'temperature': util.round_up_to_5_digits(value - F_C_DIFF)
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
    result = [[ util.s2t(key) # validDate
              , lat_lon 
              , analDate
              , util.round_up_to_5_digits(value - F_C_DIFF)
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
