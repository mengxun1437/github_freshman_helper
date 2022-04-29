# -*- coding: UTF-8 -*-
import os
import numpy as np
from common.common import train_prop_list
from common.utils import dict_list_2_list
import  json
from dataset import text_precessing,get_data_sources
from common.get_remote import get_issue_model_info_list
from analysis import print_clf_info,get_model
import textstat
from gensim.models import LdaModel


# 获取所有的issue_info
issue_info_list = get_issue_model_info_list()

# 获取model
model_path = 'models/random_forest.pkl'
gcv,clf = get_model(model_path)
print_clf_info(clf=gcv,type='RF')

# 主题分析
lda_title = lda_body = None
lda_title_path = 'datasets/lda_title.model'
lda_body_path = 'datasets/lda_body.model'
if not os.path.exists(lda_title_path) or not os.path.exists(lda_body_path):
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
    if os.path.exists('datasets/predict_list.json'):
        f = open('datasets/predict_list.json')
        data = json.load(f)
        f.close()
        print('getted {} data from file predict_list.json'.format(len(data)))
        return data
    
    _data = dict_list_2_list(train_prop_list[0:-1],list(map(lambda issue:handle_issue(issue),issue_info_list)))
    data = []
    for idx,_da in enumerate(_data):
        data.append({
            'issueId':issue_info_list[idx]['issueId'],
            'value': _da
        })
    with open('datasets/predict_list.json','w') as f:
        print('write {} data to file predict_list.json'.format(len(data)))
        f.write(json.dumps(data))
        f.close()
    return data


_list = get_predict_list()

predict_result_with_issueid = {
    'true': [],
    'error': []
}
for idx,item in enumerate(_list):
    try:
        res = clf.predict([item['value']])[0]
        if res == 1:
            predict_result_with_issueid['true'].append(item['issueId'])
    except Exception as e:
        predict_result_with_issueid['error'].append(item['issueId'])
    # 打印预测进度
    if (idx + 1) % 100 == 0 or idx + 1 == len(_list):
        print('predict process percent: {}%'.format(round((idx + 1)*100/len(_list),2)),end = '\n' if idx + 1 == len(_list) else '\r')
with open('datasets/predict_result.json','w') as f:
    print('write predict result to file predict_result.json')
    f.write(json.dumps(predict_result_with_issueid))
    f.close()

