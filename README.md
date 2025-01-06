# TTOCR_AUTO

本项目是一个套套/人人打码平台(分支rr为[人人打码平台](http://www.rrocr.com)(已跑路))自动提交查询返回结果的nodejs简易后端，为了使套套/人人打码平台兼容[mystool机器人插件](https://github.com/Ljzd-PRO/nonebot-plugin-mystool)而诞生。

使用前请修改config.js中的appkey: 'XXXXXXXXXXXXXXXXX', \
appkey获取：[套套打码平台](https://www.ttocr.com)/[人人打码平台](http://www.rrocr.com)

## 使用方法

1.安装nodejs\
2.下载源代码解压到一个目录，记得修改一下config.js里的appkey\
3.使用命令行工具切换到当前目录，运行npm i 安装好依赖后，使用npm start 运行服务\
4.mystool插件配置修改，把geetest_url指向后端服务：将图中的192.168.10.107修改成自己服务器的ip，若nodejs服务和机器人同机则可填http://127.0.0.1:3000/ttocr (人人打码则为rrocr) \
![image](https://github.com/Ljzd-PRO/nonebot-plugin-mystool/assets/67581432/096c06e7-6dfc-4880-94c0-2184df888b3c)\
图中params参数可以填空对象，因为后端已经有appkey了只需要传gt和challenge就可以
