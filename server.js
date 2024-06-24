const express = require("express");
const http = require("http");
const axios = require("axios");
const config = require("./config");

let app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/**
 * 路由
 */
let router = express.Router();
router.post("/rrocr", async function (req, res) {
  let { gt, challenge } = req.body;
  if (!gt || !challenge) {
    res.status(400).json({
      msg: "请求必须包含gt，challenge",
      data: { result: "fail", validate: "", seccode: "" },
    });
    return;
  }
  //提交查询
  let params = {
    // 查询参数
    appkey: config.appkey,
    gt,
    challenge,
    referer: "https://webstatic.mihoyo.com",
  };
  console.log(new Date().toLocaleString() + "提交查询，查询参数：", params);
  let { data } = await axios
    .post(`http://api.rrocr.com/api/recognize.html`, params, {
      timeout: 60e3,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
    .catch((reason) => {
      return {
        data: { status: 1, msg: "axios请求查询结果出错" + String(reason) },
      };
    });
  let results = data;
  if (results.status == 0) {
    console.log(new Date().toLocaleString() + "获取查询结果成功：", results);
    res.json({
      msg: "识别成功",
      data: { result: "success", validate: results.data.validate },
    });
  } else {
    console.log(
      new Date().toLocaleString() + `获取查询结果失败或超时`,
      results
    );
    res.status(500).json({
      msg: "获取查询结果失败或超时",
      data: { result: "fail", validate: "", seccode: "" },
    });
  }

  return;
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
