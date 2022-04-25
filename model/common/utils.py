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


def set_interval(func, args, sec):
    def func_wrapper():
        set_interval(func, args, sec)
        func(**args)

    t = threading.Timer(sec, func_wrapper)
    t.daemon = True
    t.start()

    return t

def list_2_dict(props,data):
    _list = list()
    for d in data:
        _dict = dict()
        for idp,prop in enumerate(props):
            _dict[prop] = d[idp]
        _list.append(_dict)
    return _list

def dict_list_2_list(props,data):
    _list = list()
    for d in data:
        _item = list()
        for prop in props:
            _item.append(d[prop])
        _list.append(_item)
    return _list
        
