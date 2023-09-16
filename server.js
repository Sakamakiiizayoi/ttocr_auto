const express = require('express');
const http = require('http');
const axios = require('axios');

const CONFIG = {
    PORT: 3000,
    APPKEY: 'XXXXXXXXXXXXXXXXX', // 套套打码用户appkey
};

let app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


let flag = true; // 全局查询开关 防止短时间内重复查询导致banip

const flagOff = () => { // 开关冷却5s
    flag = false;
    setTimeout(() => {
        flag = true;
    }, 5e3);
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
            msg: '请求必须包含gt，challenge'
        });
        return;
    }
    //提交查询
    let params = { // 查询参数
        appkey: CONFIG.APPKEY,
        gt,
        challenge,
        itemid: 388,
        referer: 'https://webstatic.mihoyo.com'
    };
    console.log('查询参数：', params);
    let { data } = await axios.post('http://api.ttocr.com/api/recognize', params).catch((reason) => {
        console.log(`axios请求提交查询出错`, reason);
        return { data: { status: 0 } };
    });
    let recognizeResult = data;
    if (recognizeResult.status === 1) {
        console.log(`提交查询成功，查询凭证为：${recognizeResult.resultid}`);
    } else {
        console.log(`提交查询失败！`, recognizeResult);
        res.status(500).json({
            msg: '提交查询出错'
        });
        return;
    }
    //查询结果
    let retry = 5; // 查询重试次数
    await sleep(5); // 等待5s后查询结果
    while (retry > 0) { // 循环查询
        await sleep(1); // 等待1s
        if (flag) {
            flagOff();
        } else {
            console.log('等待查询冷却...');
            continue;
        }
        let { data } = await axios.post('http://api.ttocr.com/api/results', {
            appkey: CONFIG.APPKEY,
            resultid: recognizeResult.resultid
        }).catch((reason) => {
            console.log(`axios请求查询结果出错`, reason);
            return { data: { status: 0 } };
        });
        if (data.status === 1) {
            console.log(`识别成功`, data);
            res.json(data);
            return;
        } else {
            console.log(`查询失败或识别中...重试(${retry})`, data);
        }
        retry--;
    }
    console.log(`查询结果失败或超时`);
    res.status(500).json({ msg: '查询失败' });
});

app.use('/', router);

/**
 * 创建 http 服务.
 */
let server = http.createServer(app);

/**
 * 监听端口
 */
server.listen(CONFIG.PORT);
console.log(`服务在${CONFIG.PORT}端口上启动成功`);