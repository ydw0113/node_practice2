var express = require("express");
var router = express.Router();
var moment = require("moment");

const crypto = require("crypto-promise");
const csv2json = require("csvtojson");
const json2csv = require("json2csv");
const fs = require("fs");

const utils = require("../../module/utils/utils");
const statusCode = require("../../module/utils/statusCode");
const resMessage = require("../../module/utils/responseMessage");

router.get("/:id", function(req, res) {
  try {
    csv2json()
      .fromFile("board.csv")
      .then(data => {
        data.forEach(board => {
          console.log(board.id);
          if (board.id == req.params.id) {
            const boardInfo = {
              id: board.id,
              content: board.content
            };
            boardtData(boardInfo);
          }
          boardtData(boardInfo);
        });
      });

    async function boardtData(data) {
      try {
        return await new Promise((resolve, reject) => {
          if (data) {
            resolve(
              res
                .status(200)
                .send(
                  utils.successTrue(
                    statusCode.OK,
                    resMessage.BOARD_SELECT_SUCCESS,
                    data
                  )
                )
            );
          } else {
            reject(
              res
                .status(200)
                .send(
                  utils.successFalse(
                    statusCode.BAD_REQUEST,
                    resMessage.BOARD_SELECT_FAIL
                  )
                )
            );
          }
        });
      } catch {}
    }
  } catch {
    res
      .status(200)
      .send(
        utils.successFalse(
          statusCode.INTERNAL_SERVER_ERROR,
          resMessage.SAVE_FAIL
        )
      );
  }
});

router.post("/", async (req, res) => {
  console.log(req.body);
  try {
    const salt = await crypto.randomBytes(32);
    const pw = await crypto.pbkdf2(
      req.body.pw,
      salt.toString("base64"),
      1000,
      32,
      "SHA512"
    );

    const boardInfo = {
      id: req.body.id,
      header: req.body.header,
      content: req.body.content,
      creatAt: moment().format("YYYY-MM-DD hh:mm:ss"),
      pw: pw.toString("base64"),
      salt: salt.toString("base64")
    };

    console.log(boardInfo);
    console.log(boardInfo.creatAt);
    const boardInfoCsv = json2csv.parse({
      id: boardInfo.id,
      header: boardInfo.header,
      content: boardInfo.content,
      creatAt: boardInfo.creatAt,
      pw: boardInfo.pw,
      salt: boardInfo.salt
    });

    var save = true;
    csv2json()
      .fromFile("board.csv")
      .then(data => {
        data.forEach(board => {
          if (board.header == req.body.header) {
            save = false;
          }
        });

        if (save) {
          fs.appendFileSync("board.csv", boardInfoCsv, err => {
            if (err) {
              res
                .status(200)
                .send(
                  utils.successFalse(
                    statusCode.BAD_REQUEST,
                    resMessage.SAVE_FAIL
                  )
                );
            } else {
              res
                .status(200)
                .send(
                  utils.successTrue(
                    statusCode.OK,
                    resMessage.SAVE_SUCCESS,
                    data
                  )
                );
            }
          });
        } else {
          res
            .status(200)
            .send(
              utils.successFalse(
                statusCode.BAD_REQUEST,
                resMessage.BOARD_EXISTS
              )
            );
        }
      });
  } catch {
    res
      .status(200)
      .send(
        utils.successFalse(
          statusCode.INTERNAL_SERVER_ERROR,
          resMessage.SAVE_FAIL
        )
      );
  }
});

router.put("/", async (req, res) => {
  var miss_id = true;
  var miss_pw = true;
  console.log(req.body);
  try {
    csv2json()
      .fromFile("board.csv")
      .then(data => {
        data.forEach(async board => {
          console.log(board.pw);
          console.log(miss_pw);
          if (board.id == req.body.id) {
            miss_id = false;
            const salt = board.salt;
            const pw = await crypto.pbkdf2(
              req.body.pw,
              salt.toString("base64"),
              1000,
              32,
              "SHA512"
            );
            console.log(pw.toString("base64"));
            if (board.pw == pw.toString("base64")) {
              miss_pw = false;
              const boardInfo = {
                id: req.body.id,
                header: req.body.header,
                content: req.body.content,
                creatAt: moment().format("YYYY-MM-DD hh:mm:ss"),
                pw: board.pw,
                salt: board.salt
              };
              const boardInfoCsv = json2csv.parse({
                id: boardInfo.id,
                header: boardInfo.header,
                content: boardInfo.content,
                creatAt: boardInfo.creatAt,
                pw: boardInfo.pw,
                salt: boardInfo.salt
              });
              fs.writeFileSync("board.csv", boardInfoCsv);
              res
                .status(200)
                .send(
                  utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS)
                );
            } else if (miss_pw) {
              res
                .status(200)
                .send(
                  utils.successFalse(
                    statusCode.BAD_REQUEST,
                    resMessage.MISS_MATCH_PW
                  )
                );
            }
          }
        });
        if (miss_id) {
          res
            .status(200)
            .send(
              utils.successFalse(
                statusCode.BAD_REQUEST,
                resMessage.BOARD_NOTEXIST
              )
            );
        }
      });
  } catch {
    res
      .status(200)
      .send(
        utils.successFalse(
          statusCode.INTERNAL_SERVER_ERROR,
          resMessage.SAVE_FAIL
        )
      );
  }
});

router.delete("/", async (req, res) => {
  var miss_id = true;
  var miss_pw = true;
  // console.log(req.body);
  try {
    csv2json()
      .fromFile("board.csv")
      .then(data => {
        data.forEach(async board => {
          if (board.id !== req.body.id) {
            console.log(board.id);
            console.log(req.body.id);
            const boardInfo = {
              id: board.id,
              header: board.header,
              content: board.content,
              creatAt: moment().format("YYYY-MM-DD hh:mm:ss"),
              pw: board.pw,
              salt: board.salt
            };
            const boardInfoCsv = json2csv.parse({
              id: boardInfo.id,
              header: boardInfo.header,
              content: boardInfo.content,
              creatAt: boardInfo.creatAt,
              pw: boardInfo.pw,
              salt: boardInfo.salt
            });
            fs.writeFileSync("board.csv", boardInfoCsv);
            res
              .status(200)
              .send(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
          }
          if (board.id == req.body.id) {
            miss_id = false;
            const salt = board.salt;
            const pw = await crypto.pbkdf2(
              req.body.pw,
              salt.toString("base64"),
              1000,
              32,
              "SHA512"
            );
            if (board.pw == pw.toString("base64")) {
              miss_pw = false;
              //console.log(board);
              delete board;
            } else if (miss_pw) {
              res
                .status(200)
                .send(
                  utils.successFalse(
                    statusCode.BAD_REQUEST,
                    resMessage.MISS_MATCH_PW
                  )
                );
            }
          }
          // console.log(board);
        });
        if (miss_id) {
          res
            .status(200)
            .send(
              utils.successFalse(
                statusCode.BAD_REQUEST,
                resMessage.BOARD_NOTEXIST
              )
            );
        }
      });
  } catch {
    res
      .status(200)
      .send(
        utils.successFalse(
          statusCode.INTERNAL_SERVER_ERROR,
          resMessage.SAVE_FAIL
        )
      );
  }
});

module.exports = router;
