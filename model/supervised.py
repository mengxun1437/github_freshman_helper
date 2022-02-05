# -*- coding: UTF-8 -*-
# 监督式学习
from getopt import getopt
from sklearn.tree import DecisionTreeClassifier
from common.utils import logger, set_interval
from common.get_remote import get_issue_models_list
from common.common import issue_model_column_list, qiniu_bucket_url
from common.qiniu_sdk import upload_data_to_bucket, upload_file_to_bucket
from common.api import update_model_config
from sklearn import tree
from sklearn.model_selection import train_test_split, GridSearchCV
import json, pickle, graphviz, pydot, os.path, time, sys, atexit

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

except Exception as e:
    logger('get model id error: {}'.format(str(e)))

# 将控制台输出打到文件中
log_file = "{}/{}.log".format('.log', model_id)
if not os.path.exists('.log'):
    os.mkdir('.log')
log_f = open(log_file, "w+")
sys.stdout = log_f

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
            "modelTraining": False
        }, local=not is_prod_env)
        upload_file_to_bucket(key='log/{}.log'.format(model_id),
                              local_file_path=log_file)
        if log_f:
            log_f.close()
        if os.path.exists(log_file):
            os.remove(log_file)
        if timer:
            timer.cancel()
    except:
        pass


# global
data_sources = get_issue_models_list()
data = list(map(lambda issue_model: issue_model[0:-1], data_sources))
targets = list(map(lambda issue_model: issue_model[-1], data_sources))
x_train, x_test, y_train, y_test = train_test_split(data, targets, test_size=0.3, random_state=10)


# 决策树
def sklearn_decision_tree():
    logger("start building model : decision tree ")
    decision_tree_id = model_id

    def get_best_decision_tree_model():
        logger('trying to get the best score...')
        get_score_start_time = int(round(time.time() * 1000))

        # _max_depth = [5, 6, 7, 8, 9, 10, None]
        # _min_samples_split = range(2, 11)
        # _min_samples_leaf = range(2, 21)
        # _random_state = [*range(1, 11), None]
        # _max_features = ['auto', 'sqrt', 'log2', *range(1, len(issue_model_column_list) - 1)]

        _max_depth = [5, 6, None]
        _min_samples_split = range(2, 11, 5)
        _min_samples_leaf = range(10, 40, 10)
        _random_state = [*range(1, 11, 5), None]
        _max_features = ['auto', 'sqrt', 'log2']

        grid_search = GridSearchCV(estimator=DecisionTreeClassifier(criterion='gini'), param_grid={
            'max_depth': _max_depth,
            'min_samples_split': _min_samples_split,
            'min_samples_leaf': _min_samples_leaf,
            'random_state': _random_state,
            'max_features': _max_features
        }, scoring='roc_auc', verbose=2, return_train_score=True)
        grid_search.fit(x_train, y_train)

        grid_search_best_params = grid_search.best_params_
        grid_search_best_score = grid_search.best_score_
        grid_search_best_model = grid_search.best_estimator_
        # TODO: 训练过程可视化
        # grid_search_scores = grid_search.cv_results_
        best_score = grid_search.score(x_test, y_test)

        get_score_end_time = int(round(time.time() * 1000))
        logger('get best score successfully,time cost: {} ms'.format(get_score_end_time - get_score_start_time))
        logger('best score in train: {} '
               'best score in test: {}  '
               'config: {}'.format(best_score, grid_search_best_score, grid_search_best_params))
        try:
            logger('trying to upload the decision model to cloud')
            score_model = 'model/{}.pkl'.format(decision_tree_id)
            model = pickle.dumps(grid_search_best_model)
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

        try:
            logger('trying to upload the decision score config to cloud')
            score_log = 'score/{}.config'.format(decision_tree_id)
            (ret, info) = upload_data_to_bucket(score_log, json.dumps({
                "best_test_score": best_score,
                "best_train_score": grid_search_best_score,
                "best_params": grid_search_best_params,
                "training_cost": get_score_end_time - get_score_start_time
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
            logger('some error happened when score process to the cloud,error: {}'.format(str(e)))

        return grid_search_best_model

    def get_best_decision_tree_graph(_max_clf):
        try:
            logger('trying to upload the decision tree graph to cloud')
            dot_data = tree.export_graphviz(_max_clf
                                            , feature_names=issue_model_column_list[0:-1]
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

    max_clf = get_best_decision_tree_model()
    get_best_decision_tree_graph(max_clf)


logger('======== model engine : supervised ========')
if model_id is not None and model_framework == 'sklearn' and model_program == 'decision_tree' or not is_prod_env:
    sklearn_decision_tree()
    update_model_config({
        "modelId": model_id,
        "modelTraining": False
    }, local=not is_prod_env)
else:
    logger('have not get correct config, program exit')

timer.cancel()
