from datetime import datetime
import math

DATE_FORMAT="%Y-%m-%d %H:%M:%S"
# datetime型をstringに変換
def t2s(time):
    return time.strftime(DATE_FORMAT)
def s2t(time_str):
    return datetime.strptime(time_str, DATE_FORMAT)
def round_up_to_5_digits(number):
    return round(number, 4)
