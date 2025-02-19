const express = require("express");
const http = require("http");
const axios = require("axios");
const config = require("./config");

let app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let flag = true; // 全局查询开关 防止短时间内重复查询导致banip
const reqUrl = "https://api.2captcha.com/createTask"; // 创建任务url
const resUrl = "https://api.2captcha.com/getTaskResult"; // 获取任务状态url
const maxCheckTime = 240e3; // 查询超时时间 单位ms

const flagOff = () => {
  // 开关冷却
  flag = false;
  setTimeout(() => {
    flag = true;
  }, 4e3);
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
router.post("/ocr", async function (req, res) {
  let { gt, challenge } = req.body;
  if (!gt || !challenge) {
    res.status(400).json({
      msg: "请求必须包含gt，challenge",
      data: { result: "fail", validate: "", seccode: "" },
    });
    return;
  }
  let params = {
    // 查询参数
    clientKey: config.appKey,
    task: {
      type: "GeeTestTaskProxyless",
      websiteURL: "https://act.mihoyo.com",
      gt,
      challenge,
    },
  };
  let url = reqUrl;
  console.log(new Date().toLocaleString() + "提交查询，查询参数：", params);
  let { data } = await axios.post(url, params).catch((reason) => {
    return {
      data: { status: 1, msg: "axios提交查询出错" + String(reason) },
    };
  });
  let recognizeResult = data;
  if (recognizeResult.errorId === 0) {
    console.log(`提交查询成功，查询凭证为：${recognizeResult.taskId}`);
  } else {
    console.log(`提交查询失败！`, recognizeResult);
    res.status(500).json({
      msg: "提交查询出错",
      data: { result: "fail", validate: "", seccode: "" },
    });
    return;
  }
  //获取查询结果
  let ticket = recognizeResult.taskId; // 查询凭证
  let ts = new Date().getTime(); // 查询开始时间
  console.log(`等待20秒后查询结果`);
  await sleep(20); // 等待20s后获取查询结果
  while (true) {
    // 循环获取查询结果
    if (flag) {
      // 全局查询冷却
      flagOff();
    } else {
      console.log("全局获取查询结果冷却...一秒后重试");
      await sleep(1);
      continue;
    }
    console.log(`获取查询结果...`);
    let resParams = {
      clientKey: config.appKey,
      taskId: ticket,
    };
    let { data } = await axios.post(resUrl, resParams).catch((reason) => {
      return {
        data: { status: 0, msg: "axios请求查询结果出错" + String(reason) },
      };
    });

    let results = data;
    if (results.errorId === 0 && results.status === "ready") {
      console.log("获取查询结果成功：", results);
      res.json({
        msg: "识别成功",
        data: Object.assign({ result: "success" }, results.solution),
      });
      return;
    } else if (results.errorId !== 0) {
      // 查询结果
      console.log(`查询结果出错，退出。`, results);
      break;
    } else {
      console.log(`获取查询任务识别中，5秒后稍后重试...`, results);
    }
    if (new Date().getTime() > ts + maxCheckTime) {
      // xx秒内重试,xx秒后退出循环
      console.log(`获取查询结果超时${maxCheckTime}s，退出。`);
      break;
    }
    // 查询等待5s
    await sleep(5);
  }
  console.log(`获取查询结果失败或超时`);
  res.status(500).json({
    msg: "获取查询结果失败或超时",
    data: { result: "fail", validate: "", seccode: "" },
  });
});

app.use("/", router);

/**
 * 创建 http 服务.
 */
let server = http.createServer(app);

/**
 * 监听端口
 */
server.listen(config.port);
console.log(`服务在${config.port}端口上启动成功`);
