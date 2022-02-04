import math
import time
import threading


def logger(str, not_next_line=False):
    p_str = "[{}] {}".format(time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()), str)
    if not_next_line:
        print('\r{}'.format(p_str), end="")
    else:
        print(p_str)


def chunks_to_n(arr, m):
    n = int(math.ceil(len(arr) / float(m)))
    return [arr[i:i + n] for i in range(0, len(arr), n)]
