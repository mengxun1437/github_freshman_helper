# 原始数据处理


import json
import os
import pickle

from sklearn.model_selection import GridSearchCV
from common.utils import dict_list_2_list,logger
from common.common import train_prop_list
from common.get_remote import get_issue_models_list
import joblib 
import textstat
from sklearn.decomposition import LatentDirichletAllocation
from sklearn.feature_extraction.text import CountVectorizer
import nltk
nltk.download('punkt')
nltk.download('stopwords')
import string
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer

# global
tf_title = None
tf_body = None
lda_title = None
lda_body = None
data_sources = list()

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
        'filtered':" ".join(filtered)  
    }


# 词汇统计
def count_vectorizer(issue_titles = [],issue_bodies = []):
    global tf_title,tf_body
    tf_title_path = 'datasets/tf_title_count_vectorizer.pkl'
    tf_body_path = 'datasets/tf_body_count_vectorizer.pkl'
    if os.path.exists(tf_title_path):
        logger('getted tf_title count_vectorizer from file')
        tf_title = joblib.load(tf_title_path)
        
    if os.path.exists(tf_body_path):
        logger('getted tf_body count_vectorizer from file')
        tf_body = joblib.load(tf_body_path)
        

    tf_title_model = tf_body_model = CountVectorizer(max_df=0.95, min_df=2,
                            stop_words='english')

    if tf_title == None:
        tf_title_model.fit_transform(issue_titles)
        tf_title = tf_title_model
        logger('write tf_title count_vectorizer to file')
        joblib.dump(tf_title,tf_title_path)
        
    if tf_body == None:
        tf_body_model.fit_transform(issue_bodies)
        tf_body = tf_body_model
        logger('write tf_body count_vectorizer to file')
        joblib.dump(tf_body,tf_body_path)

# LDA主题分析
def lda_model():
    global lda_title,lda_body
    lda_title_path = 'datasets/lda_title_model.pkl'
    lda_body_path = 'datasets/lda_body_model.pkl'
    if os.path.exists(lda_title_path):
        logger('getted lda_title_model from file')
        lda_title = joblib.load(lda_title_path)
        
    if os.path.exists(lda_body_path):
        logger('getted lda_body_model from file')
        lda_body = joblib.load(lda_body_path)
    
    # 基于skitlearn LDA训练分别训练title/body topic
    parameters = {
              'n_components':range(20, 100, 10),
              'max_iter':[10,100,1000]
              }
  
    lda_title_model = lda_body_model = GridSearchCV(estimator=LatentDirichletAllocation(),
                        param_grid=parameters,
                        refit=True,
                        n_jobs=-1,
                        verbose=2) 

    if lda_title == None:
        lda_title_model.fit(tf_title)
        lda_title = lda_title_model
        logger('write lda_title_model to file')
        joblib.dump(lda_title,lda_title_path)
        
    if lda_body == None:
        lda_body_model.fit(tf_body)
        lda_body = lda_body_model
        logger('write lda_body_model to file')
        joblib.dump(lda_body,lda_body_path)

def get_data_sources():
    if not os.path.exists('datasets'):
        os.mkdir('datasets')

    if os.path.exists('datasets/data.json'):
        data_f = open('datasets/data.json')
        _data_sources = json.load(data_f)
        logger('getted {} data from file data.json'.format(len(_data_sources)))
        data_sources = dict_list_2_list(train_prop_list,_data_sources)       
    else:
        dict_list = get_issue_models_list()

        # 处理title 和 issueBody =>  文本可读性 + 主题数
        # textstat.flesch_reading_ease
        issue_titles = []
        issue_bodies = []

        for idx,d in enumerate(dict_list):
            # 数据预处理
            precessd_title = text_precessing(d['issueTitle'])
            precessd_body = text_precessing(d['issueBody'])
            issue_titles.append(precessd_title['filtered'])
            issue_bodies.append(precessd_body['filtered'])
            # dict_list[idx]['issueTitle'] = precessd_title['basic']
            # dict_list[idx]['issueBody'] = precessd_body['basic']
            dict_list[idx]['titleReadability'] = textstat.flesch_reading_ease(precessd_title['basic'])
            dict_list[idx]['bodyReadability'] = textstat.flesch_reading_ease(precessd_body['basic'])
            dict_list[idx]['titleTopic'] = ''
            dict_list[idx]['bodyTopic'] = ''
        
        # 统计词汇
        count_vectorizer(issue_titles,issue_bodies)
        # 训练lda模型
        lda_model()

        data_sources = dict_list_2_list(train_prop_list,dict_list)

        # 将数据存储到文件，如果有文件，下次从文件读取，减少网络消耗和重复计算 
        if not os.path.exists('datasets/data.json'):
            with open('datasets/data.json','w') as data_f:
                data_f.write(json.dumps(dict_list))
                data_f.close()
                logger('write {} data from file data.json'.format(len(data_sources)))

    return data_sources

# get_data_sources()

def test_lda():
    count_vectorizer()
    lda_model()
    def print_top_words(model, feature_names, n_top_words):
        #打印每个主题下权重较高的term
            for topic_idx, topic in enumerate(model.components_):
                print("Topic #%d:" % topic_idx)
                print(" ".join([feature_names[i] for i in topic.argsort()[:-n_top_words - 1:-1]]))

    n_top_words=20
    tf_title_fnames = tf_title.get_feature_names_out()
    tf_body_fnames = tf_body.get_feature_names_out()
    lda_body.best_estimator_.print_topic(1,10)

test_lda()

    