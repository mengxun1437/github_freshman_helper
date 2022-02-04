# -*- coding: UTF-8 -*-
# 监督式学习
import json

from common.utils import logger, chunks_to_n
from common.get_remote import get_issue_models_list
from common.common import issue_model_column_list, qiniu_bucket_url
from common.qiniu_sdk import get_upload_token, upload_data_to_bucket
from sklearn import tree
from sklearn.model_selection import train_test_split
import threading

import graphviz
import uuid
import pydot
import os.path
import time

data_sources = get_issue_models_list()
data = list(map(lambda issue_model: issue_model[0:-1], data_sources))
targets = list(map(lambda issue_model: issue_model[-1], data_sources))
x_train, x_test, y_train, y_test = train_test_split(data, targets, test_size=0.2)


# clf = tree.DecisionTreeClassifier(criterion="entropy",
#                                   **{'max_depth': None, 'min_samples_split': 0.2, 'min_samples_leaf': 0.3,
#                                      'random_state': None, 'min_weight_fraction_leaf': 0.0, 'min_impurity_decrease': 9})
# clf = clf.fit(x_train, y_train)
# score1 = clf.score(x_test, y_test)
# clf = tree.DecisionTreeClassifier(criterion="gini",
#                                   **{'max_depth': None, 'min_samples_split': 20, 'min_samples_leaf': 0.5,
#                                      'random_state': 2, 'min_weight_fraction_leaf': 0.0, 'min_impurity_decrease': 9})
# clf = clf.fit(x_train, y_train)
# score2 = clf.score(x_test, y_test)
# print(score1, score2)


# 决策树
def decision_tree():
    logger("start building model : decision tree ")

    def get_best_decision_tree():
        logger('trying to get the highest score...')
        get_score_start_time = int(round(time.time() * 1000))
        score_id = uuid.uuid1()
        # # 动态调参，获取最优score
        # score_config_titles = ['max_depth', 'min_samples_split', 'min_samples_leaf', "random_state",
        #                        'min_weight_fraction_leaf', 'min_impurity_decrease']

        _max_depth = [*range(1, len(issue_model_column_list) - 1), None]
        _min_samples_split = list(map(lambda x: x / 20, range(1, 21)))
        _min_samples_leaf = list(map(lambda x: x / 10, range(1, 5)))
        _random_state = [*range(0, 10), None]
        _min_weight_fraction_leaf = list(map(lambda x: x / 10, range(0, 5)))
        _min_impurity_decrease = list(map(lambda x: x / 10, range(0, 11)))

        # _max_depth = [None]
        # _min_samples_split = [0.1, 0.2]
        # _min_samples_leaf = [0.1, 0.3, 0.5]
        # _random_state = [None]
        # _min_weight_fraction_leaf = list(map(lambda x: x / 10, range(0, 5)))
        # _min_impurity_decrease = [1, 3, 5, 7, 9]

        scores = []
        all_len = len(_max_depth) * len(_min_samples_split) * len(_min_samples_leaf) * len(_random_state) * len(
            _min_weight_fraction_leaf) * len(_min_impurity_decrease)
        process_len = 0
        # 记录最大的得分配置和最大的决策树
        max_score = dict()
        max_clf = None
        configs = []

        for max_depth in _max_depth:
            for min_samples_split in _min_samples_split:
                for min_samples_leaf in _min_samples_leaf:
                    for random_state in _random_state:
                        for min_weight_fraction_leaf in _min_weight_fraction_leaf:
                            for min_impurity_decrease in _min_impurity_decrease:
                                configs.append({
                                    "max_depth": max_depth,
                                    'min_samples_split': min_samples_split,
                                    'min_samples_leaf': min_samples_leaf,
                                    'random_state': random_state,
                                    'min_weight_fraction_leaf': min_weight_fraction_leaf,
                                    'min_impurity_decrease': min_impurity_decrease,
                                })

        # 采用多线程加快速度
        def threading_config(_configs):
            nonlocal max_score, process_len, max_clf, scores, all_len
            global x_train, y_train, x_test, y_test
            for config in _configs:
                try:
                    # clf = tree.DecisionTreeClassifier(criterion="entropy", **config)
                    # print(**config)
                    clf = tree.DecisionTreeClassifier(criterion="entropy",
                                                      max_depth=config['max_depth'],
                                                      min_samples_split=config['min_samples_split'],
                                                      min_samples_leaf=config['min_samples_leaf'],
                                                      random_state=config['random_state'],
                                                      min_weight_fraction_leaf=config['min_weight_fraction_leaf'],
                                                      min_impurity_decrease=config['min_impurity_decrease']
                                                      )
                    clf = clf.fit(x_train, y_train)
                    score = clf.score(x_test, y_test)
                    score_config = {
                        **config,
                        'score': score
                    }
                    if 'store' not in max_score:
                        max_score = score_config
                        max_clf = clf
                    else:
                        if score > max_score['score']:
                            max_score = score_config
                            max_clf = clf
                    scores.append(score_config)
                except Exception as e:
                    logger('one of the model params has error: {}'.format(str(e)), not_next_line=True)
                finally:
                    process_len += 1
                    logger('process: {}%'.format(format(process_len * 100 / all_len, '.2f')),
                           not_next_line=True)

        configs_threading_num = 10
        configs_chunks = chunks_to_n(configs, configs_threading_num)
        all_threading_tasks = list(
            map(lambda configs_chunk: threading.Thread(target=threading_config, args=(configs_chunk,)), configs_chunks))
        for threading_task in all_threading_tasks:
            threading_task.start()
        for threading_task in all_threading_tasks:
            threading_task.join()
        threading_config(configs)

        get_score_end_time = int(round(time.time() * 1000))
        print('\r')
        logger('get high score successfully,time cost: {} ms'.format(get_score_end_time - get_score_start_time))
        logger('best score:{}  config: {}'.format(max_score['score'], max_score))
        try:
            logger('start uploading score process to cloud...')
            score_log = 'score/{}.log'.format(score_id)
            # score_config_info = '\t'.join([*score_config_titles, 'score']) + '\n'
            # for score_config in scores:
            #     score_config_info += '\t'.join(
            #         list(map(lambda title: str(score_config[title]), [*score_config_titles, 'score']))) + '\n'
            (ret, info) = upload_data_to_bucket(score_log, json.dumps(scores))
            if info.status_code == 200:
                logger('upload the score process to cloud successfully,you can see it from {}/{}'.format(
                    qiniu_bucket_url, score_log))
            else:
                logger('fail to upload the score process to cloud,ret: {}, info: {}'.format(
                    ret, info))
            # print(max_clf)
            return max_clf
        except Exception as e:
            logger('some error happened when score process to the cloud,error: {}'.format(str(e)))
        # logger('model best score : {},you can see the score graph from {}/score_graph/{}.png'.format(score,
        #                                                                                              qiniu_bucket_url,
        #                                                                                              score_graph_id))

    def get_best_decision_tree_graph(max_clf):
        try:
            logger('trying to upload the decision tree graph to cloud')
            graph_id = uuid.uuid1()
            dot_data = tree.export_graphviz(max_clf
                                            , feature_names=issue_model_column_list[0:-1]
                                            , filled=True
                                            , rounded=True
                                            , out_file=None
                                            )
            if not os.path.exists('graph'):
                os.mkdir('graph')
            file_dot = 'graph/{}.dot'.format(graph_id)
            file_png = 'graph/{}.png'.format(graph_id)
            graphviz.Source(dot_data).save(file_dot)
            (graph,) = pydot.graph_from_dot_file(file_dot)
            graph.write_png(file_png)
            with open(file_png, 'rb') as gf:
                upload_data = gf.read()
                (ret, info) = upload_data_to_bucket(file_png, upload_data)
                if info.status_code == 200:
                    logger('upload the decision tree graph to cloud successfully,you can see it from {}/{}'.format(
                        qiniu_bucket_url, file_png))
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

    max_clf = get_best_decision_tree()
    get_best_decision_tree_graph(max_clf)


if __name__ == '__main__':
    logger('======== model engine : supervised ========')
    decision_tree()
