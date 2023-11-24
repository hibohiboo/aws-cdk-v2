import json
from lib import util

# ケルビンから℃変換用
F_C_DIFF=273.15

def toOutputJson(temperature, radiation, pressure, mslp, uwind, vwind, rh, rain,lcloud,mcloud,hcloud,tcloud,analDate):
    result_list = [{'lat_lon': key, 'values': toOutput(key, temperature, radiation, pressure, mslp, uwind, vwind, rh,rain,lcloud,mcloud,hcloud,tcloud,)} for key, value in temperature.items()]
    return json.dumps(result_list, indent=4)

def toOutput( lat_lon, temperature, radiation, pressure, mslp, uwind, vwind, rh,rain,lcloud,mcloud,hcloud,tcloud):
    result = [{'validDate': key
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
