from datetime import timedelta
import pygrib
import pandas as pd

time_diff = timedelta(hours=9)

gpv_file = pygrib.open("/grib2/Z__C_RJTD_20221013000000_GSM_GPV_Rjp_Gll0p1deg_Lsurf_FD0000-0100_grib2.bin")
t_messages = gpv_file.select(parameterName="Temperature")

df = pd.DataFrame({
    "validDate": [msg.validDate + time_diff for msg in t_messages],
    "temperature": [
        msg.data(
            lat1=35.6745-0.025,
            lat2=35.6745+0.025,
            lon1=139.7169-0.03125,
            lon2=139.7169+0.03125,
        )[0][0][0] - 273.15 for msg in t_messages
    ]
})

print(df)
