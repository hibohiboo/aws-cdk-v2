import json

# ケルビンから℃変換用
F_C_DIFF=273.15

def toOutputJson(temperature, radiation, pressure, mslp, uwind, vwind, rh, analDate):
    result_list = [{'lat_lon': key, 'values': toOutput(key, temperature, radiation, pressure, mslp, uwind, vwind, rh)} for key, value in temperature.items()]
    return json.dumps(result_list, indent=4)

def toOutput( lat_lon, temperature, radiation, pressure, mslp, uwind, vwind, rh):
    result = [{'validDate': key
              , 'temperature': value - F_C_DIFF
              , 'radiation': radiation[lat_lon].get(key, None)
              , 'pressure': pressure[lat_lon].get(key, None)
              , 'mslp': mslp[lat_lon].get(key, None)
              , 'uwind': uwind[lat_lon].get(key, None)
              , 'vwind': vwind[lat_lon].get(key, None)
              , 'rh': rh[lat_lon].get(key, None)
              } for key, value in temperature[lat_lon].items()]
    return result
