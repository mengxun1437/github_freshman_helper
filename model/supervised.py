# -*- coding: UTF-8 -*-
# 监督式学习
from getopt import getopt
# from matplotlib import pyplot as plt
# import numpy as np
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from common.utils import logger, set_interval
from common.common import qiniu_bucket_url,train_prop_list
from common.qiniu_sdk import upload_data_to_bucket, upload_file_to_bucket
from common.api import update_model_config
from sklearn import tree
from sklearn.model_selection import train_test_split, GridSearchCV
import json, pickle, graphviz, pydot, os, time, sys, atexit
from dataset import get_data_sources

# 特征提取
# 可读性分析
# 主题相似度计算

'''
-m model_id
-f framework
-p program
'''

model_id = None
model_framework = None
model_program = None
is_prod_env = True
try:
    opts, args = getopt(sys.argv[1:], ':-m:-f:-p:-l', [])
    for opt_name, opt_value in opts:
        if opt_name == '-m':
            model_id = opt_value
        if opt_name == '-f':
            model_framework = opt_value
        if opt_name == '-p':
            model_program = opt_value
        if opt_name == '-l':
            is_prod_env = False
    update_model_config({
        "modelId": model_id,
        "modelFramework": model_framework,
        "modelProgram": model_program
    }, local=not is_prod_env)

except Exception as e:
    logger('get model id error: {}'.format(str(e)))

# 将控制台输出打到文件中
log_file = "{}/{}.log".format('.log', model_id)
if not os.path.exists('.log'):
    os.mkdir('.log')
# log_f = open(log_file, "w+")
# sys.stdout = log_f

# 打印出命令行参数
logger(
    'get python args: [model_id: {},framework: {},program: {},env: {}]'.format(model_id, model_framework, model_program,
                                                                               'prod' if is_prod_env else 'local'))

# 构造定时器,每 5 秒上传日志
timer = set_interval(func=upload_file_to_bucket, args={
    "key": 'log/{}.log'.format(model_id),
    "local_file_path": log_file
}, sec=5)


@atexit.register
def _update_model_config():
    global model_id, is_prod_env, log_f, log_file, timer
    try:
        update_model_config({
            "modelId": model_id,
            "modelTrainingLogUrl": '{}/{}'.format(qiniu_bucket_url, 'log/{}.log'.format(model_id)),
            "modelTraining": False
        }, local=not is_prod_env)
        upload_file_to_bucket(key='log/{}.log'.format(model_id),
                              local_file_path=log_file)
        time.sleep(3)
        if log_f:
            log_f.close()
        if os.path.exists(log_file):
            os.remove(log_file)
        if timer:
            timer.cancel()
    except:
        pass


# global
data_sources = get_data_sources()
data = list(map(lambda issue_model: issue_model[0:-1], data_sources))
targets = list(map(lambda issue_model: issue_model[-1], data_sources))
x_train, x_test, y_train, y_test = train_test_split(data, targets, test_size=0.3, random_state=10)


# 决策树
def sklearn_decision_tree():
    logger("start building model : decision tree ")
    decision_tree_id = model_id

    _max_depth = [8,10,None]
    _min_samples_split = [4,12]
    _min_samples_leaf = [2,9]
    _random_state = [2,10]
    _max_features = [9,13]

    time_start = None
    time_end = None

    def get_grid_search(x_train,y_train):
        try:
            nonlocal time_start, time_end, _max_depth, _min_samples_split, _min_samples_leaf, _random_state, _max_features
            logger('trying to get the grid search...')
            # 指定样本权重
            t_grid_search = GridSearchCV(estimator=DecisionTreeClassifier(criterion='gini',class_weight='balanced'), param_grid={
                'max_depth': _max_depth,
                'min_samples_split': _min_samples_split,
                'min_samples_leaf': _min_samples_leaf,
                'random_state': _random_state,
                'max_features': _max_features
            }, scoring='roc_auc', verbose=2, return_train_score=True,n_jobs=-1)
            time_start = time.time()
            t_grid_search.fit(x_train, y_train)
            time_end = time.time()

            # TODO: 训练过程进度展示

            return t_grid_search

        except Exception as e:
            logger('some error happened when get the grid search,error: {}'.format(str(e)))
            exit()

    def upload_best_model(_grid_search):
        try:
            logger('trying to upload the decision model to cloud')
            score_model = 'model/{}.pkl'.format(decision_tree_id)
            model = pickle.dumps(_grid_search)
            pickle.dump(_grid_search,open('models/{}.pkl'.format(decision_tree_id),'wb'))
            (ret, info) = upload_data_to_bucket(score_model, model)
            if info.status_code == 200:
                logger('upload the decision model to cloud successfully!')
                update_model_config({
                    "modelId": model_id,
                    "modelPklUrl": '{}/{}'.format(qiniu_bucket_url, score_model)
                }, local=not is_prod_env)
            else:
                logger('fail to upload the decision model to cloud,ret: {}, info: {}'.format(
                    ret, info))
        except Exception as e:
            logger('some error happened when score model to the cloud,error: {}'.format(str(e)))

    def upload_score_config(_grid_search):
        global x_test, y_test
        nonlocal time_start, time_end
        _grid_results = _grid_search.cv_results_
        _best_train_score = _grid_search.best_score_
        _best_test_score = _grid_search.score(x_test, y_test)
        _best_params = _grid_search.best_params_
        try:
            train_const_time = format(time_end - time_start, '.2f')
            logger('get best score successfully,time cost: {} s'.format(train_const_time))
            logger('best score in train: {} '
                   'best score in test: {}  '
                   'config: {}'.format(_best_train_score, _best_test_score, _best_params))
            logger('trying to upload the decision score config to cloud')
            score_log = 'score/{}.config'.format(decision_tree_id)
            (ret, info) = upload_data_to_bucket(score_log, json.dumps({
                "best_test_score": _best_test_score,
                "best_train_score": _best_train_score,
                "best_params": _best_params,
                "train_cost_time": train_const_time + 's',
                "train_config_num": _grid_results['mean_train_score'].size
            }))
            if info.status_code == 200:
                logger('upload the score config to cloud successfully!')
                update_model_config({
                    "modelId": model_id,
                    "modelConfigUrl": '{}/{}'.format(qiniu_bucket_url, score_log)
                }, local=not is_prod_env)
            else:
                logger('fail to upload the score config to cloud,ret: {}, info: {}'.format(
                    ret, info))
        except Exception as e:
            logger('some error happened when upload score config to the cloud,error: {}'.format(str(e)))

    def upload_best_decision_tree_graph(_grid_search):
        try:
            logger('trying to upload the decision tree graph to cloud')
            dot_data = tree.export_graphviz(_grid_search.best_estimator_
                                            , feature_names=train_prop_list[0:-1]
                                            , filled=True
                                            , rounded=True
                                            , out_file=None
                                            )
            file_dot = 'graph/{}.dot'.format(decision_tree_id)
            file_png = 'graph/{}.png'.format(decision_tree_id)
            graphviz.Source(dot_data).save(file_dot)
            (graph,) = pydot.graph_from_dot_file(file_dot)
            graph.write_png(file_png)
            with open(file_png, 'rb') as gf:
                upload_data = gf.read()
                (ret, info) = upload_data_to_bucket(file_png, upload_data)
                if info.status_code == 200:
                    logger('upload the decision tree graph to cloud successfully')
                    update_model_config({
                        "modelId": model_id,
                        "modelPngUrl": '{}/{}'.format(qiniu_bucket_url, file_png)
                    }, local=not is_prod_env)
                else:
                    logger('fail to upload the decision tree graph to cloud,ret: {}, info: {}'.format(
                        ret, info))
                gf.close()
        except Exception as e:
            logger('some error happened when building...,error: {}'.format(str(e)))
        finally:
            try:
                if gf:
                    gf.close()
                if os.path.exists(file_dot):
                    os.remove(file_dot)
                if os.path.exists(file_png):
                    os.remove(file_png)
            except:
                pass

    grid_search = get_grid_search(x_train,y_train)
    upload_best_model(grid_search)
    # upload_train_process_graph(grid_search)
    upload_score_config(grid_search)
    upload_best_decision_tree_graph(grid_search)


def sklearn_random_forest():

    logger("start building model : random forest ")
    random_forest_id = model_id
    # _validation_curve
    _max_depth = [None,8,5]
    _min_samples_split = [2,6]
    _min_samples_leaf = [2,10]
    _random_state = [4,10]
    _max_features = ['auto','sqrt','log2',5,7]
    _n_estimators = [200,550]

    time_start = None
    time_end = None

    def get_grid_search(x_train,y_train):
        try:
            nonlocal time_start, time_end,_max_depth, _min_samples_split, _min_samples_leaf, _random_state, _max_features
            logger('trying to get the grid search...')
            # 指定样本权重
            t_grid_search = GridSearchCV(estimator=RandomForestClassifier(criterion='gini',class_weight='balanced'), param_grid={
                'max_depth': _max_depth,
                'min_samples_split': _min_samples_split,
                'min_samples_leaf': _min_samples_leaf,
                'random_state': _random_state,
                'max_features': _max_features,
                'n_estimators':_n_estimators
            }, scoring='roc_auc', verbose=2, return_train_score=True,cv=10,n_jobs=-1)
            time_start = time.time()
            t_grid_search.fit(x_train, y_train)
            time_end = time.time()

            # TODO: 训练过程进度展示

            return t_grid_search

        except Exception as e:
            logger('some error happened when get the grid search,error: {}'.format(str(e)))
            exit()

    def upload_best_model(_grid_search):
        try:
            logger('trying to upload the random forest model to cloud')
            score_model = 'model/{}.pkl'.format(random_forest_id)
            model = pickle.dumps(_grid_search)
            pickle.dump(_grid_search,open('models/{}.pkl'.format(random_forest_id),'wb'))
            (ret, info) = upload_data_to_bucket(score_model, model)
            if info.status_code == 200:
                logger('upload the random forest model to cloud successfully!')
                update_model_config({
                    "modelId": model_id,
                    "modelPklUrl": '{}/{}'.format(qiniu_bucket_url, score_model)
                }, local=not is_prod_env)
            else:
                logger('fail to upload the random forest to cloud,ret: {}, info: {}'.format(
                    ret, info))
        except Exception as e:
            logger('some error happened when score model to the cloud,error: {}'.format(str(e)))

    def upload_score_config(_grid_search):
        global x_test, y_test
        nonlocal time_start, time_end
        _grid_results = _grid_search.cv_results_
        _best_train_score = _grid_search.best_score_
        _best_test_score = _grid_search.score(x_test, y_test)
        _best_params = _grid_search.best_params_
        try:
            train_const_time = format(time_end - time_start, '.2f')
            logger('get best score successfully,time cost: {} s'.format(train_const_time))
            logger('best score in train: {} '
                   'best score in test: {}  '
                   'config: {}'.format(_best_train_score, _best_test_score, _best_params))
            logger('trying to upload the random forest score config to cloud')
            score_log = 'score/{}.config'.format(random_forest_id)
            (ret, info) = upload_data_to_bucket(score_log, json.dumps({
                "best_test_score": _best_test_score,
                "best_train_score": _best_train_score,
                "best_params": _best_params,
                "train_cost_time": train_const_time + 's',
                "train_config_num": _grid_results['mean_train_score'].size
            }))
            if info.status_code == 200:
                logger('upload the score config to cloud successfully!')
                update_model_config({
                    "modelId": model_id,
                    "modelConfigUrl": '{}/{}'.format(qiniu_bucket_url, score_log)
                }, local=not is_prod_env)
            else:
                logger('fail to upload the score config to cloud,ret: {}, info: {}'.format(
                    ret, info))
        except Exception as e:
            logger('some error happened when upload score config to the cloud,error: {}'.format(str(e)))

    grid_search = get_grid_search(x_train,y_train)
    upload_best_model(grid_search)
    upload_score_config(grid_search)


logger('======== model engine : supervised ========')
if model_id is not None and model_framework == 'sklearn' and model_program == 'decision_tree':
    sklearn_decision_tree()
    update_model_config({
        "modelId": model_id,
        "modelTraining": False
    }, local=not is_prod_env)
elif model_id is not None and model_framework == 'sklearn' and model_program == 'random_forest':
    sklearn_random_forest()
    update_model_config({
        "modelId": model_id,
        "modelTraining": False
    }, local=not is_prod_env)
else:
    logger('have not get correct config, program exit')

timer.cancel()
