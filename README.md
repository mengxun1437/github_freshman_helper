# github_freshman_helper
## 关于项目

我们利用 [github openapi](https://docs.github.com/cn/rest) 收集了含有`good first issue`的issues,从三个维度共11个静态指标，试图研究哪些issues确实适合新手解决

你可以[下载此pdf](http://cdn-gfh.zerokirin.online/github/github%E6%96%B0%E6%89%8B%E4%BB%BB%E5%8A%A1%E9%87%87%E9%9B%86%E5%88%86%E6%9E%90.pdf)查看具体细节



## 技术选型

采用的技术框架为

前端 ```react``` + ```antd design```

后端 ```nestjs```



## 项目部署

### 前置工作

- 安装`python 3.x`
- 安装`graphviz`，需要dot命令环境
- 安装`node 16.x`

### 启动项目

1. 项目根目录下运行 `npm install`

2. 项目运行需要一些配置信息，将项目根目录下的`config.template.yaml`文件补充完整，并重命名为`config.yaml`

   - project字段为项目运行的一些配置信息

     - server

       - url: server 服务启动地址

       - proxy: 项目中代理github page的代理地址

         ```nginx
         location /proxy/githubIssue/ {
             proxy_pass https://github.com/;
             proxy_hide_header X-Frame-Options; 
             proxy_hide_header Content-Security-Policy;
           }
         ```

       - admin: 项目管理员账号名称

   - mysql字段为数据库配置信息

   - github字段为github相关的配置信息

     - tokens: 项目采用github openapi,此字段填写GitHub personal access token,填写越多，爬虫速度越快

   - qiniu字段为七牛云相关配置信息，项目采用七牛云作为资源托管平台，新人注册送10G免费空间

     - ak,sk: 七牛开发者aksk
     - bucket: 七牛云空间名
     - bucket_url: 七牛云空间加速域名

3. 运行 `npm run config`

4. 准备web,server,model运行环境

   - web
     - ` cd web` 
     - `npm install`
     - `npm start`
   - server 
     - `cd server`
     - `npm install`
     - `npm run dev`
   - model
     - `cd model`
     - `python -m pip install -r requirement.txt` 



# 展望

目前模型使用决策树进行分析，感兴趣的小伙伴可以使用其他算法，其他模型进行分析，在此项目基础上作拓展



## 效果预览

### 用户展示界面

![show analysis](http://cdn-gfh.zerokirin.online/github/image-20220420154409864.png)

![show gfi for freshman](http://cdn-gfh.zerokirin.online/github/image-20220420154431068.png)

### 管理员界面

![show gfi issues](http://cdn-gfh.zerokirin.online/github/image-20220420154526337.png)

![show datasets](http://cdn-gfh.zerokirin.online/github/image-20220420154536495.png)

![show models](http://cdn-gfh.zerokirin.online/github/image-20220420154546683.png)

![show abilities](http://cdn-gfh.zerokirin.online/github/image-20220420154555072.png)
