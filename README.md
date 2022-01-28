# github_freshman_helper
collect github good first issues and build analysis model to help github freshman to use github better

## 关于项目

### 任务说明

Good First Issue是github中适合新手入门的任务。本课题希望分析并展现Good First Issue。

主要满足以下要求：

#### 收集数据集

- 利用Github rest api收集所有含有’good first issue’标签的issue
- 搜集closed issue相应的pull request或者commit
- 搜集所有含有’good first issue’的项目等基本信息和log

#### 对数据进行统计分析并展示

- 共有多少个项目，多少’good first issue’
- 有多少’good first issue’ closed,有多少能找到对应的pull request或者commit
- 有多少’good first issue’是新手解决的，有多少新手之后参与项目

#### 实现一个分类模型

对’good first issue’进行分类，判断是否容易被新手解决，模型至少包括以下信息：
- 对每个good first issue，可以收集哪些属性可以用于分类

- 哪些机器学习的模型可以用于分类

- 哪些属性在预测中更重要

    

### 任务要求

1. 至少从10个维度进行探索性分析并提供可视化结果，预测模型准确率至少达到70%；
2. 在毕业设计完成后，除提交系统源代码并保证可顺利运行外，还需要提系统设计文档、数据结构设计文档、技术框架设计文档等资料； 
3. 系统应当有完整的安装部署包及相应的说明文档，联机或脱机的使用说明文档等



## 规划

主要分为以下几步

### 数据持久化

针对模型处理阶段需要的数据做搜集

- 利用github restful api定时搜集issue相关的数据
- 数据持久化到mysql数据库中

### 模型处理

### 数据可视化



## 技术选型

采用的技术框架为

前端 ```react``` + ```semi ui```

后端 ```nestjs```

