# 原始数据处理


import json
import os
from gensim import corpora
from gensim.models import LdaModel,CoherenceModel
from common.utils import dict_list_2_list,logger
from common.common import train_prop_list,_train_prop_list
from common.get_remote import get_issue_models_list
import textstat
import nltk
nltk.download('punkt')
nltk.download('stopwords')
import string
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer
# import logging
# logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)
import pyLDAvis
import pyLDAvis.gensim_models
import matplotlib.pyplot as plt
import numpy as np

# global
lda_title = None
lda_body = None
issue_titles = []
issue_bodies = []
data_sources = list()

# prepare
if not os.path.exists('datasets'):
    os.mkdir('datasets')
if not os.path.exists('datasets/models'):
    os.mkdir('datasets/models')

# 文本预处理
def text_precessing(text):
    #小写化
    text = text.lower()
    #去除特殊标点
    for c in string.punctuation:
        text = text.replace(c, ' ')
    # 去除换行转义
    text = text.replace('\r','').replace('\n','')
    #分词
    wordLst = nltk.word_tokenize(text)
    #去除停用词
    filtered = [w for w in wordLst if w not in stopwords.words('english')]
    #词干化
    ps = PorterStemmer()
    filtered = [ps.stem(w) for w in filtered]

    return {
        # 基本处理
        'basic': " ".join(text.split()),
        # 去除停用词和词干化后的结果
        'filtered': filtered  
    }

# 调参，并将每组参数的数据记录下来, 并结合pyLDAvis绘制图形,寻找出主题离散层度较大的那一个
def lda_model_tune(corpus,id2word,texts,dictionary,type = 'title'):
    n_topics_list = [10, 20, 30, 40, 50]
    iterations_list = [500,1000,1500,2000]
    lda_list = []
    for n_topics in n_topics_list:
        for iterations in iterations_list:
            print('trainning n_topics:{} iterations:{}'.format(n_topics,iterations))
            lda = LdaModel(corpus=corpus, id2word=id2word, num_topics=n_topics, iterations=iterations)
            lda_list.append({
                'n_topics':n_topics,
                'iterations':iterations,
                'lda':lda
            })
            lda.save('datasets/models/{}_n_topics_{}_iterations_{}.model'.format(type,n_topics,iterations))
            lda_data =  pyLDAvis.gensim_models.prepare(lda,corpus,id2word,mds='mmds')
            pyLDAvis.save_html(lda_data,'datasets/models/{}_n_topics_{}_iterations_{}.html'.format(type,n_topics,iterations))
    

    # 先使用CoherenceModel初步判断主题相关性
    for idx,_lda in enumerate(lda_list):
        cm = CoherenceModel(model=_lda['lda'],texts = texts, dictionary=dictionary, corpus=corpus,coherence='u_mass')
        coherence = cm.get_coherence() 
        lda_list[idx]['coherence'] = coherence
        del lda_list[idx]['lda']

    with open('datasets/models/coherence_{}.json'.format(type),'w') as f:
        f.write(json.dumps(lda_list))
        f.close() 

    # 绘制三维视图
    x = list(map(lambda _x: _x['n_topics'],lda_list))
    y = list(map(lambda _y: _y['iterations'],lda_list))
    z = list(map(lambda _z: _z['coherence'],lda_list))
    fig = plt.figure()
    ax1 = plt.axes(projection='3d')
    ax1.plot3D(x,y,z,'gray')    #绘制空间曲线
    plt.savefig('datasets/models/coherence_{}.png'.format(type))
    # plt.show()


# LDA主题分析
def lda_model():
    global lda_title,lda_body,issue_titles,issue_bodies,corpus_title,corpus_body
    lda_title_path = 'datasets/lda_title.model'
    lda_body_path = 'datasets/lda_body.model'
    if os.path.exists(lda_title_path):
        logger('getted lda_title_model from file')
        lda_title = LdaModel.load(lda_title_path)
        
    if os.path.exists(lda_body_path):
        logger('getted lda_body_model from file')
        lda_body = LdaModel.load(lda_body_path)    

    if lda_title == None:
        dictionary_title = corpora.Dictionary(issue_titles)
        dictionary_title.save('datasets/dictionary_title.dict')
        corpus_title = [dictionary_title.doc2bow(text) for text in issue_titles]
        corpora.MmCorpus.serialize('datasets/corpus_title.mm', corpus_title)
        # lda_model_tune(corpus=corpus_title,id2word=dictionary_title,texts=issue_titles,dictionary=dictionary_title,type = 'title')
        # 10 1500
        lda_title = LdaModel(corpus=corpus_title, id2word=dictionary_title, num_topics=10,iterations=1500)
        logger('write lda_title_model to file')
        lda_title.save(lda_title_path)
        
    if lda_body == None:
        dictionary_body = corpora.Dictionary(issue_bodies)
        dictionary_body.save('datasets/dictionary_body.dict')
        corpus_body= [dictionary_body.doc2bow(text) for text in issue_bodies]
        corpora.MmCorpus.serialize('datasets/corpus_body.mm', corpus_body)
        # lda_model_tune(corpus=corpus_body,id2word=dictionary_body,texts=issue_bodies,dictionary=dictionary_body,type = 'body')
        # 10 1500
        lda_body = LdaModel(corpus=corpus_body, id2word=dictionary_body, num_topics=10,iterations=1500)
        logger('write lda_body_model to file')
        lda_body.save(lda_body_path)

def get_data_sources(props = train_prop_list):
    global issue_titles,issue_bodies
    datasets_path = 'datasets/data.json'

    if os.path.exists(datasets_path):
        data_f = open(datasets_path)
        _data_sources = json.load(data_f)
        logger('getted {} data from file data.json'.format(len(_data_sources)))
        data_sources = dict_list_2_list(props,_data_sources)       
    else:
        dict_list = get_issue_models_list()

        # 处理title 和 issueBody =>  文本可读性 + 主题
        # textstat.flesch_reading_ease
        issue_titles = []
        issue_bodies = []

        for idx,d in enumerate(dict_list):
            # 数据预处理
            precessd_title = text_precessing(d['issueTitle'])
            precessd_body = text_precessing(d['issueBody'])
            issue_titles.append(precessd_title['filtered'])
            issue_bodies.append(precessd_body['filtered'])
            dict_list[idx]['issueTitle'] = precessd_title['basic']
            dict_list[idx]['issueBody'] = precessd_body['basic']
            # 可读性分析
            dict_list[idx]['titleReadability'] = textstat.flesch_reading_ease(precessd_title['basic'])
            dict_list[idx]['bodyReadability'] = textstat.flesch_reading_ease(precessd_body['basic'])

        # 训练lda模型
        lda_model()

        # 主题数目统计 
        for idx,d in enumerate(dict_list):
            issue_title = issue_titles[idx]
            issue_body = issue_bodies[idx]
            bow_title = lda_title.id2word.doc2bow(issue_title)
            bow_body = lda_body.id2word.doc2bow(issue_body)
            topic_title,title_topic_probability = lda_title.get_document_topics(bow_title, per_word_topics=False)[0]
            body_title,body_topic_probability = lda_body.get_document_topics(bow_body, per_word_topics=False)[0]
            # 主题 -> 最大可能性的主题
            dict_list[idx]['titleTopic'] = topic_title
            dict_list[idx]['bodyTopic'] = body_title
            # 主题相关性 -> 最大可能性的主题的可能性
            dict_list[idx]['titleTopicProbability'] = np.float64(title_topic_probability)
            dict_list[idx]['bodyTopicProbability'] = np.float64(body_topic_probability)
        

        data_sources = dict_list_2_list(_train_prop_list,dict_list)

        # 将数据存储到文件，如果有文件，下次从文件读取，减少网络消耗和重复计算 
        if not os.path.exists('datasets/data.json'):
            with open('datasets/data.json','w') as data_f:
                data_f.write(json.dumps(dict_list))
                data_f.close()
                logger('write {} data from file data.json'.format(len(data_sources)))

    return data_sources

# get_data_sources()
# def test_lda():
#     lda_model()
#     dictionary_title = corpora.Dictionary(issue_titles)
#     for idx,issue_title in enumerate(issue_titles):
#         bow_title = lda_title.id2word.doc2bow(issue_title)
#         a,b = lda_title.get_document_topics(bow_title, per_word_topics=False)[0]
#         print(a,b)
# test_lda()

    