# TTORC_AUTO

本项目是一个简易的套套打码平台自动提交查询返回结果的后台

使用前请修改config.js中的appkey: 'XXXXXXXXXXXXXXXXX', // 套套打码用户appkey\
appkey获取：https://www.ttocr.com/

## 使用方法

1.安装nodejs\
2.下载源代码解压到一个目录，记得修改一下config.js里的appkey\
3.使用命令行工具切换到当前目录，运行npm i 安装好依赖后npm start 运行服务\
4.mystool插件配置修改 把geetest_url指向服务 如图 (图中的192.168.10.107修改成自己的后端服务ip 若和机器人同机则可填http://127.0.0.1:3000/ttorc) \
![image](https://github.com/Ljzd-PRO/nonebot-plugin-mystool/assets/67581432/096c06e7-6dfc-4880-94c0-2184df888b3c)\
如图params参数可以空对象 因为在后端已经有appkey了