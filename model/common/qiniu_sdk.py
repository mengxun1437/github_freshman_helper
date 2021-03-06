from qiniu import put_file, put_data
from config.config import qiniu_ak, qiniu_sk, qiniu_bucket
import qiniu

q = qiniu.Auth(qiniu_ak, qiniu_sk)

bucket = qiniu.BucketManager(q)
bucket_name = qiniu_bucket


def get_upload_token(key):
    return q.upload_token(bucket_name, key, 3600)


def upload_file_to_bucket(key, local_file_path):
    try:
        token = get_upload_token(key)
        return put_file(token, key, file_path=local_file_path, version='v2')
    except:
        pass


def upload_data_to_bucket(key, data):
    token = get_upload_token(key)
    return put_data(token, key, data=data)
