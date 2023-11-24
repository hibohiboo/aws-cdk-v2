import json

def toOutputJson(temperature, radiation, pressure, mslp, uwind, vwind, rh, analDate):
    result_list = [{'lat_lon': key, 'values': toOutput(key, temperature, radiation)} for key, value in temperature.items()]
    return json.dumps(result_list, indent=4)

def toOutput( lat_lon, temperature, radiation):
    result = [{'validDate': key, 'temperature': value, 'radiation': radiation[lat_lon].get(key, None)} for key, value in temperature[lat_lon].items()]
    return result
