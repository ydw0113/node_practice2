var express = require("express");
var router = express.Router();

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
      .fromFile("student.csv")
      .then(data => {
        data.forEach(student => {
          console.log(student.name);
          if (student.name == req.params.id) {
            const stuInfo = {
              name: student.name,
              colleage: student.colleage,
              major: student.major
            };
            studentData(stuInfo);
          }
          studentData(stuInfo);
        });
      });

    async function studentData(data) {
      try {
        return await new Promise((resolve, reject) => {
          if (data) {
            resolve(
              res
                .status(200)
                .send(
                  utils.successTrue(
                    statusCode.OK,
                    resMessage.STUDENT_SELECT_SUCCESS,
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
                    resMessage.STUDENT_NOTEXIST
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
    const ageHash = await crypto.pbkdf2(
      req.body.age,
      salt.toString("base64"),
      1000,
      32,
      "SHA512"
    );

    const stuInfo = {
      name: req.body.name,
      colleage: req.body.colleage,
      major: req.body.major,
      age: ageHash.toString("base64")
    };
    console.log(stuInfo);

    const stuInfoCsv = json2csv.parse({
      name: stuInfo.name,
      colleage: stuInfo.colleage,
      major: stuInfo.major,
      age: stuInfo.age
    });

    fs.appendFileSync("student.csv", stuInfoCsv, err => {
      if (err) {
        res
          .status(200)
          .send(
            utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL)
          );
      } else {
        res
          .status(200)
          .send(
            utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS, data)
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
