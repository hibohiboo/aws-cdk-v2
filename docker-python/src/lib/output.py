import json

def toOutputJson(temperature):
    result_list = [{'lat_lon': key, 'values': toOutput(temperature, key)} for key, value in temperature.items()]
    return json.dumps(result_list, indent=4)

def toOutput(temperature, lat_lon):
    result = [{'validDate': key, 'temperature': value} for key, value in temperature[lat_lon].items()]
    return result
