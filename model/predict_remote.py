# -*- coding: UTF-8 -*-
from getopt import getopt
import os
import pickle
import sys
import time
import numpy as np
import requests
from common.common import train_prop_list
from common.utils import dict_list_2_list
import  json
from dataset import text_precessing,get_data_sources
from common.get_remote import get_issue_model_info_list
import textstat
from gensim.models import LdaModel
from common.common import qiniu_bucket_url, train_prop_list, gfh_prod_server_url, gfh_local_server_url


def upload(data):
    global model_id,is_prod_env
    request_url = '{}/issuePredict'.format(
            gfh_prod_server_url if is_prod_env else gfh_local_server_url)
    requests.post(request_url,data={
        'modelId':model_id,
        **data
    })


model_id = ''
is_prod_env = True
try:
    opts, args = getopt(sys.argv[1:], ':-m:-l', [])
    for opt_name, opt_value in opts:
        if opt_name == '-m':
            model_id = opt_value
        if opt_name == '-l':
            is_prod_env = False

except:
    pass

# init
upload({
    'modelId': model_id,
    'status':'init',
    'predictNum':0,
    'process':0,
    'goodNum':0,
    'badNum':0,
    'errorNum':0,
    'goodIssueIds': ''
})

# 获取所有的issue_info
issue_info_list = get_issue_model_info_list(local=False)
upload({'predictNum':len(issue_info_list),'status':'get {} remote data'.format(len(issue_info_list))})

# 获取model
 
model_url = '{}/model/{}.pkl?time={}'.format(qiniu_bucket_url, model_id,time.time())
upload({'status':'getting remote model pkl'})
resp = requests.get(model_url)
if resp.status_code == 200:
    clf = pickle.loads(resp.content)

# 主题分析
lda_title = lda_body = None
lda_title_path = 'datasets/lda_title.model'
lda_body_path = 'datasets/lda_body.model'
if not os.path.exists(lda_title_path) or not os.path.exists(lda_body_path):
    upload({'status':"building lda model"})
    get_data_sources()

if os.path.exists(lda_title_path):
    print('getted lda_title_model from file')
    lda_title = LdaModel.load(lda_title_path)
    
if os.path.exists(lda_body_path):
    print('getted lda_body_model from file')
    lda_body = LdaModel.load(lda_body_path)
    

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


def get_predict_list():
    upload({'status':"handle text before predict"})
    _data = dict_list_2_list(train_prop_list[0:-1],list(map(lambda issue:handle_issue(issue),issue_info_list)))
    data = []
    for idx,_da in enumerate(_data):
        data.append({
            'issueId':issue_info_list[idx]['issueId'],
            'value': _da
        })
    upload({'status':"handle text successfully~"})
    return data


_list = get_predict_list()

predict_result_with_issueid = {
    'good': [],
    'bad': [],
    'error': []
}
upload({'status':'predict processing'})
for idx,item in enumerate(_list):
    try:
        res = clf.predict([item['value']])[0]
        if res == 1:
            predict_result_with_issueid['good'].append(item['issueId'])
        else:
            predict_result_with_issueid['bad'].append(item['issueId'])
    except Exception as e:
        predict_result_with_issueid['error'].append(item['issueId'])
    # 打印预测进度
    if (idx + 1) % 100 == 0 or idx + 1 == len(_list):
        upload({
            'process':round((idx + 1)*100/len(_list),2),
            'goodNum':len(predict_result_with_issueid['good']),
            'badNum':len(predict_result_with_issueid['bad']),
            'errorNum':len(predict_result_with_issueid['error']),
            'goodIssueIds': ','.join(list(map(lambda x:str(x),predict_result_with_issueid['good'])))
        })
        if idx + 1 == len(_list):
            upload({'status':'predict over'})
        print('predict process percent: {}%'.format(round((idx + 1)*100/len(_list),2)),end = '\n' if idx + 1 == len(_list) else '\r')

