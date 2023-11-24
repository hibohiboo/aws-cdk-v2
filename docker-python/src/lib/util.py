from datetime import datetime
import math
# datetime型をstringに変換
def t2s(time):
    return time.strftime("%Y-%m-%d %H:%M:%S")
def round_up_to_5_digits(number):
    return round(number, 4)
