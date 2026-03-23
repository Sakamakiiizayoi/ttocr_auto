const express = require("express");
const http = require("http");
const axios = require("axios");
const config = require("./config");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let flag = true; // 防止短时间频繁查询
const maxCheckTime = 180e3;

const flagOff = () => {
    flag = false;
    setTimeout(() => {
        flag = true;
    }, 4000);
};

const sleep = (sec) => {
    return new Promise((res) => {
        setTimeout(res, sec * 1000);
    });
};

const router = express.Router();

router.post("/ocr", async function (req, res) {
    const { gt, challenge } = req.body;

    if (!gt || !challenge) {
        return res.status(400).json({
            msg: "请求必须包含gt，challenge",
            data: { result: "fail", validate: "", seccode: "" },
        });
    }

    const params = {
        key: config.appKey,
        method: "geetest",
        gt: gt,
        challenge: challenge,
        api_server: "https://api.geetest.com",
        pageurl: "https://app.mihoyo.com",
        json: 1,
        // offline: 1,
        new_captcha: 1,
        userAgent: "Mozilla/5.0 (Linux; Android 12; Mi 10) AppleWebKit/537.36 Chrome/99 Mobile"
    };

    console.log(new Date().toLocaleString(), "提交任务:", params);

    let data;

    try {
        const resp = await axios.get("https://2captcha.com/in.php", {
            params: params
        });
        data = resp.data;
    } catch (e) {
        console.log("提交任务异常:", e);
        return res.status(500).json({
            msg: "提交查询出错",
            data: { result: "fail", validate: "", seccode: "" },
        });
    }

    if (data.status !== 1) {
        console.log("提交任务失败:", data);
        return res.status(500).json({
            msg: "提交任务失败",
            data: { result: "fail", validate: "", seccode: "" },
        });
    }

    const ticket = data.request;
    console.log("提交成功 taskId:", ticket);

    const startTime = Date.now();

    console.log("等待20秒后开始查询");
    await sleep(20);

    while (true) {

        if (!flag) {
            console.log("全局查询冷却中...");
            await sleep(1);
            continue;
        }

        flagOff();

        console.log("查询结果...");

        let result;

        try {
            const resp = await axios.get("https://2captcha.com/res.php", {
                params: {
                    key: config.appKey,
                    action: "get",
                    id: ticket,
                    json: 1
                }
            });

            result = resp.data;

        } catch (e) {

            console.log("查询异常:", e);
            break;

        }

        if (result.status === 1) {

            console.log("识别成功:", result);

            return res.json({
                msg: "识别成功",
                data: {
                    result: "success",
                    challenge: result.request.geetest_challenge,
                    validate: result.request.geetest_validate,
                    seccode: result.request.geetest_seccode
                }
            });

        }

        if (result.request !== "CAPCHA_NOT_READY") {

            console.log("识别失败:", result);
            break;

        }

        console.log("识别中，5秒后重试...");

        if (Date.now() > startTime + maxCheckTime) {
            console.log("查询超时");
            break;
        }

        await sleep(5);
    }

    console.log("获取查询结果失败或超时");

    res.status(500).json({
        msg: "获取查询结果失败或超时",
        data: { result: "fail", validate: "", seccode: "" },
    });

});

app.use("/", router);

const server = http.createServer(app);

server.listen(config.port);

console.log(`服务在 ${config.port} 端口启动成功`);