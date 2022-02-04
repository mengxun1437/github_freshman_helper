import requests
from common.common import gfh_local_server_url, gfh_prod_server_url
from common.utils import logger


def update_model_config(config, local=True):
    base_url = gfh_local_server_url if local else gfh_prod_server_url
    resp = requests.post(url='{}/model/updateModelConfig'.format(base_url), data=config)
    update_success = resp.status_code == 200
    if not update_success:
        logger('upload model config to cloud error: {}'.format(resp.content))
    return update_success, resp
