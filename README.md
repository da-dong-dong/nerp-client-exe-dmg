# 客户端
一个使用electron,启动多个客户端的承载

##### 安装方式
yarn install
##### 运行方式
yarn run electron:serve
##### 打包方式
yarn run electron:build
## 必备知识
node.js  vue.js  electron 

### master分支为window端，electron5，mac分支为ios端electron最新版

#### 新建下载器文件夹，提供开发调试
路径:\dist_electro\lyfz-erp\cloudDownload\下载打包的文件

#### 发布到生产环境，创建文件下载器文件
1，路径:\public\cloudDownload\下载打包的文件
2，package.json version的版本需要手动升级一个版本

