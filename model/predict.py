# -*- coding: UTF-8 -*-
from common.common import qiniu_bucket_url, issue_model_column_list, gfh_prod_server_url, gfh_local_server_url
from common.utils import logger
from getopt import getopt
import pickle, requests, sys, json, base64

'''
 i -> issue 模型需要预测的数据 // windows会对json作转义，所以采用base64进行传递
 m -> mid 用来获取模型
 b -> business 业务相关操作
 l -> 模型预测的环境是否为本地
 '''
try:
    opts, args = getopt(sys.argv[1:], ':-i:-m:-b:-l', [])
    issue = dict()
    model_id = ''
    bid = None
    is_prod_env = True
    for opt_name, opt_value in opts:
        if opt_name == '-i':
            json_data = base64.b64decode(opt_value)
            issue = json.loads(json_data)
        if opt_name == '-m':
            model_id = opt_value
        if opt_name == '-b':
            bid = opt_value
        if opt_name == '-l':
            is_prod_env = False

    issue_to_list = [[]]
    for col in issue_model_column_list[0:-1]:
        issue_to_list[0].append(issue[col])

    # 从远端获取模型
    model_url = '{}/model/{}.pkl'.format(qiniu_bucket_url, model_id)

    resp = requests.get(model_url)
    if resp.status_code == 200:
        clf = pickle.loads(resp.content)
        predict_result = clf.predict(issue_to_list)[0]
        print('predict_result: {}适合新手'.format('' if predict_result else '不'))

        if bid:
            request_url = '{}/model/updateModelPredict'.format(
                gfh_prod_server_url if is_prod_env else gfh_local_server_url)
            resp = requests.post(
                request_url,
                data={
                    'bid': bid,
                    'modelId': model_id,
                    'isGoodForFreshman': predict_result
                })
            if resp.status_code != 200:
                print('report predict error: {}'.format(resp.text))


    else:
        logger('get remote model from {} failed,error: {}'.format(model_url, resp))
except Exception as e:
    print('error:', e)
