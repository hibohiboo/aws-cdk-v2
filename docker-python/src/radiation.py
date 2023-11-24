from datetime import timedelta
import pygrib
import pandas as pd

time_diff = timedelta(hours=9)

gpv_file = pygrib.open("/grib2/Z__C_RJTD_20171205000000_MSM_GPV_Rjp_Lsurf_FH00-15_grib2.bin")
t_messages = gpv_file.select(parameterName="Downward short-wave radiation flux")

df = pd.DataFrame({
    "validDate": [msg.validDate + time_diff for msg in t_messages],
    "radiation": [
        msg.data(
            lat1=35.6745-0.025,
            lat2=35.6745+0.025,
            lon1=139.7169-0.03125,
            lon2=139.7169+0.03125,
        )[0][0][0] for msg in t_messages
    ]
})

print(df)
