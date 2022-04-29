# -*- coding: UTF-8 -*-
import os
import time
import numpy as np
from common.common import qiniu_bucket_url, train_prop_list, gfh_prod_server_url, gfh_local_server_url
from common.utils import logger,dict_list_2_list
from getopt import getopt
import pickle, requests, sys, json, base64
from dataset import text_precessing,get_data_sources
import textstat
from gensim.models import LdaModel
'''
 i -> issue 模型需要预测的数据 // windows会对json作转义，所以采用base64进行传递
 m -> mid 用来获取模型
 l -> 模型预测的环境是否为本地
 '''

# 主题分析
lda_title = lda_body = None
lda_title_path = 'datasets/lda_title.model'
lda_body_path = 'datasets/lda_body.model'
if not os.path.exists(lda_title_path) or not os.path.exists(lda_body_path):
    get_data_sources()

if os.path.exists(lda_title_path):
    logger('getted lda_title_model from file')
    lda_title = LdaModel.load(lda_title_path)
    
if os.path.exists(lda_body_path):
    logger('getted lda_body_model from file')
    lda_body = LdaModel.load(lda_body_path)



try:
    opts, args = getopt(sys.argv[1:], ':-i:-m:-b:-l', [])
    model_id = ''
    is_prod_env = True
    for opt_name, opt_value in opts:
        if opt_name == '-i':
            json_data = base64.b64decode(opt_value)
            issue_list = json.loads(json_data)
        if opt_name == '-m':
            model_id = opt_value
        if opt_name == '-l':
            is_prod_env = False
    

    def handle_issue(issue):
        # 添加可读性
        precessd_title = text_precessing(issue['issueTitle'])
        precessd_body = text_precessing(issue['issueBody'])
        issue['titleReadability'] = textstat.flesch_reading_ease(precessd_title['basic'])
        issue['bodyReadability'] = textstat.flesch_reading_ease(precessd_body['basic'])

        bow_title = lda_title.id2word.doc2bow(precessd_title)
        bow_body = lda_body.id2word.doc2bow(precessd_body)
        topic_title,title_topic_probability = lda_title.get_document_topics(bow_title, per_word_topics=False)[0]
        body_title,body_topic_probability = lda_body.get_document_topics(bow_body, per_word_topics=False)[0]
        # 主题 -> 最大可能性的主题
        issue['titleTopic'] = topic_title
        issue['bodyTopic'] = body_title
        # 主题相关性 -> 最大可能性的主题的可能性
        issue['titleTopicProbability'] = np.float64(title_topic_probability)
        issue['bodyTopicProbability'] = np.float64(body_topic_probability)

        return issue

    predict_list = dict_list_2_list(train_prop_list[0:-1],list(map(lambda issue:handle_issue(issue),issue_list)))
    # print(issue_list)
    # 从远端获取模型
    model_url = '{}/model/{}.pkl?time={}'.format(qiniu_bucket_url, model_id,time.time())

    resp = requests.get(model_url)
    if resp.status_code == 200:
        clf = pickle.loads(resp.content)
        predict_result = clf.predict(predict_list)
        print("predict_result", predict_result)
        request_url = '{}/model/updateModelPredict'.format(
            gfh_prod_server_url if is_prod_env else gfh_local_server_url)
        for idx,result in enumerate(predict_result):
            resp = requests.post(
                request_url,
                data={
                    'modelId': model_id,
                    'isGoodForFreshman': result,
                    'issueId': issue_list[idx]['issueId']
                })


    else:
        logger('get remote model from {} failed,error: {}'.format(model_url, resp))
except Exception as e:
    print('error:', e)
