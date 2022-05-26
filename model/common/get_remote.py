import json
import os
from common.utils import logger,list_2_dict
from config.config import mysql_config
from common.common import issue_model_column_list
import pymysql


def get_remote_source():
    logger('start building connection with remote...')
    try:
        conn = pymysql.connect(host=mysql_config['host'], port=mysql_config['port'], user=mysql_config['user'],
                               passwd=mysql_config['passwd'], db=mysql_config['db'])
        logger('building connection successfully!')
        logger('start fetching remote model data...')
        cursor = conn.cursor()
        print('''sql is: SELECT {} FROM issue_model'''.format(",".join(issue_model_column_list)))
        remote_source_num = cursor.execute('''SELECT {} FROM issue_model'''.format(",".join(issue_model_column_list)))
        remote_source = cursor.fetchall()
        logger('fetch remote model data successfully,fetched {} rows'.format(remote_source_num))
        logger('start closing database connection')
        cursor.close()
        conn.close()
        logger('database connect closed successfully!')
        return remote_source
    except Exception as e:
        logger('get remote source error: {}'.format(str(e)))
        exit(-1)

def get_remote_issue_info():
    logger('start building connection with remote...')
    try:
        conn = pymysql.connect(host=mysql_config['host'], port=mysql_config['port'], user=mysql_config['user'],
                               passwd=mysql_config['passwd'], db=mysql_config['db'])
        logger('building connection successfully!')
        logger('start fetching remote model data...')
        cursor = conn.cursor()
        print('''sql is: SELECT {} FROM issue_model_info where not ISNULL(titleLength) and issueTitle != '' and issueBody != '' '''.format(",".join(issue_model_column_list)))
        remote_source_num = cursor.execute('''SELECT {} FROM issue_model_info where not ISNULL(titleLength) and issueTitle != '' and issueBody != '' '''.format(",".join(issue_model_column_list)))
        remote_source = cursor.fetchall()
        logger('fetch remote model info data successfully,fetched {} rows'.format(remote_source_num))
        logger('start closing database connection')
        cursor.close()
        conn.close()
        logger('database connect closed successfully!')
        return remote_source
    except Exception as e:
        logger('get remote source error: {}'.format(str(e)))
        exit(-1)


def get_issue_models_list():
    if not os.path.exists('datasets'):
        os.mkdir('datasets')
    if os.path.exists('datasets/remote.json'):
        f = open('datasets/remote.json')
        data = json.load(f)
        f.close()
        logger('getted {} data from file remote.json'.format(len(data)))
        return data
    issue_models_tuple = get_remote_source()
    issue_models_list = []
    for issue_model in issue_models_tuple:
        issue_models_list.append(list(issue_model))
    data = list_2_dict(issue_model_column_list,issue_models_list)
    with open('datasets/remote.json','w') as f:
        logger('write {} data to file remote.json'.format(len(data)))
        f.write(json.dumps(data))
        f.close()
    return data


def get_issue_model_info_list(local = True):
    if not os.path.exists('datasets'):
        os.mkdir('datasets')
    if local and os.path.exists('datasets/remote_info.json'):
        f = open('datasets/remote_info.json')
        data = json.load(f)
        f.close()
        logger('getted {} data from file remote_info.json'.format(len(data)))
        return data
    issue_models_tuple = get_remote_issue_info()
    issue_models_list = []
    for issue_model in issue_models_tuple:
        issue_models_list.append(list(issue_model))
    data = list_2_dict(issue_model_column_list,issue_models_list)
    with open('datasets/remote_info.json','w') as f:
        logger('write {} data to file remote_info.json'.format(len(data)))
        f.write(json.dumps(data))
        f.close()
    return data

