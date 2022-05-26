
# 对模型作简单的分析
import json
import os
import pickle
from matplotlib import pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_selection import mutual_info_classif 
from sklearn.model_selection  import validation_curve,train_test_split
from sklearn.tree import DecisionTreeClassifier
from common.common import train_prop_list,_train_prop_list
from dataset import get_data_sources
from gensim.models import LdaModel
from sklearn.metrics import roc_curve,roc_auc_score
from gensim import corpora
import wordcloud
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression

if not os.path.exists('models/analysis'):
    os.mkdir('models/analysis')



# 指定prop为_train_prop_list可以获取原始17个维度的数据
data_sources = get_data_sources()

data = list(map(lambda issue_model: issue_model[0:-1], data_sources))
targets = list(map(lambda issue_model: issue_model[-1], data_sources))
x_train, x_test, y_train, y_test = train_test_split(data, targets, test_size=0.3, random_state=10)

def get_model(file_path):
    clf = pickle.load(open(file_path,'rb'))
    return [clf,clf.best_estimator_]

def print_clf_info(clf,type = ''):
    print('{} best params:'.format(type),clf.best_params_)
    print('{} best train_score:'.format(type),clf.best_score_)
    print('{} best test score:'.format(type),clf.score(x_test,y_test))

# 重要特征可视化
def draw_importances(model,type=''):
    importances = model.feature_importances_
    for idx,prop in enumerate(train_prop_list[0:-1]):
        print('prop: {} score: {}'.format(prop,importances[idx]))
    model_importances = pd.Series(importances, index=train_prop_list[0:-1])
    fig, ax = plt.subplots()
    model_importances.plot.bar(ax=ax)
    ax.set_title("Feature importances in {}".format(type))
    ax.set_ylabel("Mean decrease in impurity")
    fig.tight_layout()
    plt.savefig('models/analysis/{}_importances'.format(type))
    plt.show()


# 训练过程可视化
def draw_train_process(clf,type):
    _grid_results = clf.cv_results_
    _grid_mean_train_score = _grid_results['mean_train_score']
    _grid_std_train_score = _grid_results['std_train_score']
    _grid_mean_test_score = _grid_results['mean_test_score']
    _grid_std_test_score = _grid_results['std_test_score']
    fig = plt.figure()
    ax = fig.add_subplot(111)
    fill_x = [*range(_grid_mean_test_score.size)]
    ax.fill_between(fill_x, _grid_mean_train_score + _grid_std_train_score,
                    _grid_mean_train_score - _grid_std_train_score, color='b')
    ax.fill_between(fill_x, _grid_mean_test_score + _grid_std_test_score,
                    _grid_mean_test_score - _grid_std_test_score, color='r')
    ax.plot(fill_x, _grid_mean_train_score, 'ko-')
    ax.plot(fill_x, _grid_mean_test_score, 'g*-')
    plt.legend()
    plt.title('GridSearchCV Trainning Process')
    plt.savefig('models/analysis/{}_train_process.png'.format(type))
    plt.show()


def analysis_dt(name):
    clf,dt = get_model('models/{}.pkl'.format(name))
    print_clf_info(clf=clf,type='DT')
    draw_importances(model=dt,type='DT')
    draw_train_process(clf=clf,type='DT')

def analysis_rf(name):
    clf,rf = get_model('models/{}.pkl'.format(name))
    print_clf_info(clf=clf,type='RF')
    draw_importances(model=rf,type='RF')
    draw_train_process(clf=clf,type='RF')


# analysis_dt('decision_tree')
# analysis_rf('random_forest')

# 特征选择
def feature_select():
    # sel = SelectKBest(f_classif, k=13)
    # sel.fit_transform(data,targets)
    # scores = sel.scores_
    # print(scores)
    # model_scores = pd.Series(scores, index=_train_prop_list[0:-1])
    scores = mutual_info_classif(data,targets,discrete_features='auto',n_neighbors=3,copy=False,random_state=3)
    for idx,prop in enumerate(_train_prop_list[0:-1]):
        print('prop: {} score: {}'.format(prop,scores[idx]))
    model_scores = pd.Series(scores, index=_train_prop_list[0:-1])
    fig, ax = plt.subplots()
    model_scores.plot.bar(ax=ax)
    ax.set_title("Feature scores")
    ax.set_ylabel("score")
    fig.tight_layout()
    plt.savefig('models/analysis/feature_score.png')
    plt.show()
    

# feature_select()
'''
result

titleReadability
titleTopicProbability
titleTopic
assigneesNum
'''




# 使用validation curve观察每一种情况下的因素影响
# 每个特征选取几个较优的，确定调参范围
def _validation_curve(type):
    
    clf = None
    params_map = {}
    if type == 'DT':
        params_map = {
            'max_depth' : range(2, len(train_prop_list)),
            'min_samples_split' : range(2, len(train_prop_list)),
            'min_samples_leaf' : range(1, len(train_prop_list)),
            'random_state' : range(1, len(train_prop_list)),
            'max_features' : range(1, len(train_prop_list))
        }
        clf = DecisionTreeClassifier(criterion='gini',class_weight='balanced')
    elif type == 'RF':
        clf = RandomForestClassifier(criterion='gini',class_weight='balanced')
        params_map = {
            'max_depth' : range(2, len(train_prop_list)),
            'min_samples_split' : range(2, len(train_prop_list)),
            'min_samples_leaf' : range(1, len(train_prop_list)),
            'random_state' : range(1, len(train_prop_list)),
            'max_features' : range(1, len(train_prop_list)),
            'n_estimators': range(100,1100,50)
        }
    elif type == 'SVM':
        clf = SVC(class_weight='balanced')
        params_map = {
            'C':[1,2,4,8],
            'gamma':list(map(lambda x: 1/x,range(2,len(train_prop_list)))),
            'random_state':range(1,len(train_prop_list))
        }
    elif type == 'LR':
        clf = LogisticRegression(class_weight='balanced')
        params_map = {
            'C':[1,2,4,8],
            'random_state':range(1,len(train_prop_list)),
            'max_iter':range(100,1100,100)
        }

    for param in params_map:
        params = params_map[param]
        print('{} validation curve param: {}'.format(type,param))
        train_scores, test_scores = validation_curve(clf, data, targets, 
                    param_name = param, param_range = params, verbose=2,cv = 10,n_jobs= -1)
        train_mean = np.mean(train_scores, axis=1)
        train_std = np.std(train_scores, axis=1)
        test_mean = np.mean(test_scores, axis=1)
        test_std = np.std(test_scores, axis=1)
        plt.figure(figsize=(7, 5))
        plt.title('validation curve {}'.format(param))
        plt.plot(params, train_mean, 'o-', color = 'r', label = '{} Training Score'.format(param))
        plt.plot(params, test_mean, 'o-', color = 'g', label = '{} Validation Score'.format(param))
        plt.fill_between(params, train_mean - train_std, \
            train_mean + train_std, alpha = 0.15, color = 'r')
        plt.fill_between(params, test_mean - test_std, \
            test_mean + test_std, alpha = 0.15, color = 'g')
        plt.legend(loc = 'lower right')
        plt.xlabel(param)
        plt.ylabel('Score')
        plt.savefig("models/analysis/{}_validation_curve_param_{}".format(type,param))
        plt.show()


# _validation_curve('DT')
'''
result

'max_depth' : [8,10],
'min_samples_split' : [4,12],
'min_samples_leaf' : [2,9],
'random_state' : [2,10],
'max_features' : [9,13]
'''

# _validation_curve('RF')
'''
result

'max_depth' : [5,8],
'min_samples_split' : [2,14],
'min_samples_leaf' : [9,10],
'random_state' : [3,10],
'max_features' : [5,7],
'n_estimators' : [70,150]
'''

# _validation_curve('SVM')
# _validation_curve('LR')

# 分析LDA主题模型
def analysis_lda():
    lda_title_path = 'datasets/lda_title.model'
    lda_body_path = 'datasets/lda_body.model'
    if os.path.exists(lda_title_path):
        lda_title = LdaModel.load(lda_title_path)
        
    if os.path.exists(lda_body_path):
        lda_body = LdaModel.load(lda_body_path) 
    print(lda_title.print_topics())
    print(lda_body.print_topics())
# analysis_lda()

# 绘制data.json中lda相关的数据
def draw_data_json_lda():
    data = json.load(open('datasets/data.json','r'))
    # data_true = list(filter(lambda x:x['isGoodForFreshman'] == 1,data))
    # data_false = list(filter(lambda x:x['isGoodForFreshman'] == 0,data))
    titles = list(map(lambda issue:issue['titleTopic'],data))
    bodies = list(map(lambda issue:issue['bodyTopic'],data))
    def generate_sizes(input_arr):
        arr = [0]*10
        for i in input_arr:
            arr[i] += 1
        return arr
    title_sizes = generate_sizes(titles) #每块值
    body_sizes = generate_sizes(bodies)
    def draw(arr,type=''):
        labels = range(0,10) #定义标签
        
        plt.pie(arr,
                        labels=labels,
                        startangle =90,
                        pctdistance = 0.6) 
        plt.axis('equal')
        plt.savefig('models/analysis/draw_data_json_lda_{}.png'.format(type))
        plt.show()
    draw(title_sizes,type='title')
    draw(body_sizes,type='body')


# draw_data_json_lda()

# 绘制roc_auc曲线
def draw_roc_auc():
    gcv,clf = get_model('models/random_forest.pkl')
    y_pred_pro = clf.predict_proba(x_test)
    y_scores = pd.DataFrame(y_pred_pro, columns=clf.classes_.tolist())[1].values
    auc_value = roc_auc_score(y_test, y_scores)
    fpr, tpr, thresholds = roc_curve(y_test, y_scores, pos_label=1.0)
    
    plt.plot(fpr, tpr, color='darkorange', lw=2, label='ROC curve (area = %0.3f)' % auc_value)
    plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('ROC Curve')
    plt.legend(loc="lower right")
    plt.savefig('models/analysis/RF_draw_roc_auc.png')
    plt.show()
    

# draw_roc_auc()

# 分析lda 词汇表
def analysis_lda_voc():
    dict_title = corpora.Dictionary.load('datasets/dictionary_title.dict')
    dict_body = corpora.Dictionary.load('datasets/dictionary_body.dict')
    print(len(dict_title.token2id),len(dict_body.token2id))
    title_map = {}
    body_map = {}
     # for prop in _t:
        #     if prop.isdigit():
        #         del word_count[prop]
    for key in dict_title.iterkeys():
        val = dict_title.get(key)
        if str(val).isdigit():
            continue
        title_map[val] = dict_title.dfs[key]
    for key in dict_body.iterkeys():
        val = dict_body.get(key)
        if str(val).isdigit():
            continue
        body_map[val] = dict_body.dfs[key]
    print(len(title_map),len(body_map))
    title_map_sort = sorted(title_map.items(), key=lambda item: -item[1])
    for i,k in enumerate(title_map_sort[:10]):
        print(i,k)
    print('------------------')
    body_map_sort = sorted(body_map.items(), key=lambda item: -item[1])
    for i,k in enumerate(body_map_sort[:10]):
        print(i,k)
    def wc_from_word_count(word_count, fp):
        '''根据词频字典生成词云图'''
        wc = wordcloud.WordCloud(
            max_words=10000,  
            background_color="white",
            margin=10
        )
        wc.generate_from_frequencies(word_count) 
        plt.imshow(wc) 
        plt.axis('off')
        plt.show()
        wc.to_file(fp)
    wc_from_word_count(title_map,'models/analysis/dict_title_wc.png')
    wc_from_word_count(body_map,'models/analysis/dict_body_wc.png')


# analysis_lda_voc()

# 绘制各个模型下的准确率
def draw_all_models_scores():
    labels = ['RF','DT','SVM','LR']
    train_scores = [0.7970010253462754,0.7228207642186448,0.7114846409134741,0.7114836987666384]
    test_scores = [0.7628851208523992,0.7013207747065084,0.6923649333810925,0.6923901582608958]
    plt.ylim(0,1)
    x = np.arange(4)
    total_width, n = 0.8, 3
    width = total_width / n
    x = x - (total_width - width) / 2
    plt.bar(x, train_scores,  width=width, label='train_score',tick_label=labels)
    plt.bar(x + width, test_scores, width=width, label='test_score',tick_label=labels)
    plt.legend()
    plt.savefig('models/analysis/draw_all_models_scores.png')
    plt.show()   

# draw_all_models_scores()   

# 去掉其中的一个字段，探究其对得分的影响
# def watch_each_prop_effect():
#     logger('''try to watch each prop's effect''')
#     if not os.path.exists('.log'):
#         os.mkdir('.log')
#     csv_f = open('.log/watch_each_prop_effect_{}.csv'.format(str(int(time.time()))), 'w')
#     writer = csv.writer(csv_f)
#     header = ['index', 'prop', '_best_train_score', '_best_test_score','_best_params']
#     writer.writerow(header)
#     try:
#         for idx,prop in enumerate(train_prop_list[0:-1]):
#             def remove_index(arr,index):
#                 _arr = list(arr)
#                 del _arr[index]
#                 return _arr
#             _data = list(map(lambda issue_model:remove_index(issue_model,idx)[0:-1] , data_sources))
#             _targets = list(map(lambda issue_model: issue_model[-1], data_sources))
#             _x_train, _x_test, _y_train, _y_test = train_test_split(_data, _targets, test_size=0.3, random_state=10)
#             _grid_search = get_grid_search(_x_train,_y_train)
#             _best_train_score = _grid_search.best_score_
#             _best_test_score = _grid_search.score(_x_test, _y_test)
#             _best_params = _grid_search.best_params_
#             # 数据持久化到csv
#             writer.writerow([idx,prop,_best_train_score,_best_test_score,json.dumps(_best_params)])   
#     except:
#         pass
#     finally:
#         csv_f.close()

# def draw_each_prop_effect():
#     csv_reader = csv.reader(open(".log/watch_each_prop_effect.csv"))
#     render_list = []
#     for idx,line in enumerate(csv_reader):
#         if idx == 0:
#             continue
#         render_list.append(line[1:4])
#     name_list = list(map(lambda _list: _list[0], render_list))
#     train_score_list = list(map(lambda _list: float(_list[1]), render_list))
#     test_score_list = list(map(lambda _list: float(_list[2]), render_list))
#     x = np.arange(len(name_list))
#     bar_width=0.3
#     plt.rcParams['font.sans-serif']=['SimHei']
#     plt.bar(x, train_score_list,bar_width,color='salmon', label='train_score')
#     plt.bar(x + bar_width, test_score_list,bar_width,color='orchid', label='test_score')
#     plt.legend()
#     plt.axhline(y=0.7323509232492198, color='salmon', linestyle='--')
#     plt.axhline(y=0.719573497604322, color='orchid', linestyle='--')
#     plt.xticks(x+bar_width/2,name_list)
#     plt.show()
    
    
# watch_each_prop_effect()
# draw_each_prop_effect()
