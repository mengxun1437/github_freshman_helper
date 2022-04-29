
# 对模型作简单的分析
import os
import pickle
from matplotlib import pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_selection import SelectKBest,f_classif
from sklearn.model_selection  import validation_curve,train_test_split
from sklearn.tree import DecisionTreeClassifier
from common.common import train_prop_list,_train_prop_list
from dataset import get_data_sources

if not os.path.exists('models/analysis'):
    os.mkdir('models/analysis')

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
    # 从17个中选13个用于训练
    sel = SelectKBest(f_classif, k=13)
    sel.fit_transform(data,targets)
    res = sel.get_support()
    for idx,prop in enumerate(_train_prop_list[0:-1]):
        if not res[idx]:
            print(prop)

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
    params_map = {
        'max_depth' : range(5, 12),
        'min_samples_split' : range(2, len(train_prop_list)),
        'min_samples_leaf' : range(1, len(train_prop_list)),
        'random_state' : range(1, len(train_prop_list)),
        'max_features' : range(1, len(train_prop_list))
    }

    clf = None
    if type == 'DT':
        clf = DecisionTreeClassifier(criterion='gini',class_weight='balanced')
    elif type == 'RF':
        clf = RandomForestClassifier(criterion='gini',class_weight='balanced')
        params_map['n_estimators'] = range(50,1000,10)

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
