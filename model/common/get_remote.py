from common.utils import logger
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


def get_issue_models_list():
    issue_models_tuple = get_remote_source()
    issue_models_list = []
    for issue_model in issue_models_tuple:
        issue_models_list.append(list(issue_model))
    return issue_models_list
