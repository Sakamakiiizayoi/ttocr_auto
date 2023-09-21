const express = require('express');
const http = require('http');
const axios = require('axios');
const config = require('./config');

let app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let flag = true; // 全局查询开关 防止短时间内重复查询导致banip

const flagOff = () => { // 开关冷却
    flag = false;
    setTimeout(() => {
        flag = true;
    }, 2e3);
};

const sleep = (sec) => {
    return new Promise((res, rej) => {
        setTimeout(() => {
            res(1);
        }, sec * 1000);
    });
};

/**
 * 路由
 */
let router = express.Router();
router.post('/ttorc', async function (req, res) {
    let { gt, challenge } = req.body;
    if (!gt || !challenge) {
        res.status(400).json({
            msg: '请求必须包含gt，challenge',
            data: { result: 'fail', validate: '', seccode: '' }
        });
        return;
    }
    //提交查询
    let params = { // 查询参数
        appkey: config.appkey,
        gt,
        challenge,
        itemid: 388,
        referer: 'https://webstatic.mihoyo.com'
    };
    console.log('提交查询，查询参数：', params);
    let { data } = await axios.post('http://api.ttocr.com/api/recognize', params).catch((reason) => {
        return { data: { status: 0, msg: 'axios请求查询结果出错' } };
    });
    let recognizeResult = data;
    if (recognizeResult.status === 1) {
        console.log(`提交查询成功，查询凭证为：${recognizeResult.resultid}，等待查询结果...`);
    } else {
        console.log(`提交查询失败！`, recognizeResult);
        res.status(500).json({
            msg: '提交查询出错',
            data: { result: 'fail', validate: '', seccode: '' }
        });
        return;
    }
    //获取查询结果
    let ts = new Date().getTime(); // 查询开始时间
    await sleep(6); // 等待6s后获取查询结果
    while (true) { // 循环获取
        if (flag) { // 全局查询冷却
            flagOff();
        } else {
            console.log('获取查询结果冷却...');
            await sleep(1);
            continue;
        }
        console.log(`获取查询结果...`);
        let { data } = await axios.post('http://api.ttocr.com/api/results', {
            appkey: config.appkey,
            resultid: recognizeResult.resultid
        }).catch((reason) => {
            return { data: { status: 0, msg: 'axios请求查询结果出错' } };
        });
        let results = data;
        if (results.status === 1) {
            console.log('获取查询结果成功：', results);
            res.json({
                msg: '识别成功',
                data: { result: 'success', ...results.data }
            });
            return;
        } else if (results.status === 4016) { // 查询结果不存在
            console.log(`查询结果不存在，退出。`, results);
            break;
        } else {
            console.log(`获取查询结果失败或识别中，稍后重试...`, results);
        }
        if (new Date().getTime() > ts + 50e3) { // 50秒内重试,50秒后退出循环
            console.log('获取查询结果超时50s，退出。');
            break;
        }
    }
    console.log(`获取查询结果失败或超时`);
    res.status(500).json({
        msg: '获取查询结果失败或超时',
        data: { result: 'fail', validate: '', seccode: '' }
    });
});

app.use('/', router);

/**
 * 创建 http 服务.
 */
let server = http.createServer(app);

/**
 * 监听端口
 */
server.listen(config.port);
console.log(`服务在${config.port}端口上启动成功`);