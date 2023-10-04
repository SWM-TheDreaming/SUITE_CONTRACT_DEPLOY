import path, { dirname } from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import dotenv from "dotenv";
import moment from "moment-timezone";

import sqlCon from "../configs/sqlCon.js";

import { makeGroupHashedID, contractPdfController } from "../lib/funcs.js";

import ContractManager from "../provider/ContractManager.js";
import { contractHtmlProvider } from "../provider/contractHtmlProvider.js";
import { certificatedHtmlProvider } from "../provider/certificatedHtmlProvider.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
moment.tz.setDefault("Asia/Seoul");

const conn = sqlCon();

export const signup = async (req, res) => {
  const nowTime = moment().format("YYYY-M-D H:m:s");
  const body = req.body;
  try {
    const [userSelectResult] = await conn.execute(
      "SELECT * FROM user_auth_info WHERE user_id = ?",
      [body.user_id]
    );

    if (userSelectResult.length > 0) {
      return res.status(400).json({
        error: "Bad Request",
        message: "이미 존재하는 아이디입니다.",
      });
    }

    await conn.execute("INSERT INTO user_auth_info VALUES (?,?,?,?,?)", [
      null,
      body.user_id,
      body.account_status,
      nowTime,
      nowTime,
    ]);

    console.log("회원 정보 DB 저장 성공");
    return res.status(201).json({
      message: "유저 토큰 정보를 저장했습니다.",
    });
  } catch (err) {
    console.error(err);
    return res.status(406).json({
      error: "Not Acceptable",
      message: "올바르지 않은 회원 정보입니다.",
    });
  }
};

export const start = async (req, res) => {
  const createdDate = moment().format("YYYY년 M월 D일");
  const body = req.body;

  try {
    const hashedKey = await makeGroupHashedID(
      body.suite_room_id,
      body.title.replace(" ", "")
    );
    const [[contractMetaInfo], [contractInfo], [isHashedKeyExist]] =
      await Promise.all([
        conn.execute("SELECT id FROM CONTRACT_META_INFO"),
        conn.execute("SELECT * FROM CONTRACT_INFO"),
        conn.execute("SELECT id FROM CONTRACT_META_INFO WHERE hashed_key = ?", [
          hashedKey.crypt,
        ]),
      ]);
    if (isHashedKeyExist.length !== 0) {
      return res.status(403).json({
        error: "Forbidden",
        message:
          "이미 존재하는 hashedKey를 가진 suite_room_id와 title 쌍입니다.",
      });
    }
    console.log("key 유일성 검증 완료------------------------------");
    const lbContractId = (contractMetaInfo.length % contractInfo.length) + 1;
    await conn.execute(
      "INSERT INTO CONTRACT_META_INFO VALUES (?,?,?,?,?,?,?)",
      [
        null,
        body.suite_room_id,
        body.title.replace(" ", ""),
        hashedKey.crypt,
        lbContractId,
        nowTime,
        nowTime,
      ]
    );
    console.log("계약서 메타 정보 저장 완료------------------------------");
    const contractManager = new ContractManager(
      process.env.POLYGON_MAIN_NET_WALLET_PRIVATE_KEY
    );
    const contract = await contractManager.getContract(hashedKey.crypt);
    console.log("계약서 컨트랙트 이서 시작------------------------------");
    const txData = contract.interface.encodeFunctionData("startSuiteRoom", [
      hashedKey.crypt,
      body.leader_id,
      body.title.replace(" ", ""),
      body.participant_ids,
      body.signatures,
      body.group_capacity,
      body.group_deposit_per_person,
      body.group_period,
      body.recruitment_period,
      body.minimum_attendance,
      body.minimum_mission_completion,
    ]);
    const gasFee = await contractManager.provider.getFeeData();
    const gasPrice = gasFee.maxFeePerGas;
    const gasLimit = await contractManager.provider.estimateGas({
      to: contractManager.contractAddress,
      data: txData,
      from: contractManager.wallet.address,
    });
    const tx = {
      to: contractManager.contractAddress,
      gasLimit,
      gasPrice,
      data: txData,
    };
    console.log(tx);
    const sentTx = await contractManager.wallet.sendTransaction(tx);
    console.log("계약서 컨트랙트 이서 진행------------------------------");
    const receipt = await sentTx.wait();
    console.log("계약서 컨트랙트 이서 완료------------------------------");
    const txFee = parseInt(receipt.gasUsed) * parseInt(receipt.gasPrice);
    await conn.execute(
      "INSERT INTO TX_DASHBOARD VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        null,
        hashedKey.crypt,
        "TX",
        sentTx.hash,
        nowTime,
        "startSuiteRoom",
        "계약서 내용 스마트 컨트랙트 이서",
        "SUITE",
        body,
        receipt.to,
        receipt.blockNumber,
        txFee,
      ]
    );
    console.log("계약서 이력 작성 완료------------------------------");
    console.log("계약서 pdf 작성 시작------------------------------");
    const memberNameList = body.participant_names;
    const memberIdList = body.participant_ids;
    const finishDate = moment()
      .add(body.group_period, "days")
      .format("YYYY년 M월 D일");
    const nowTime = moment().format("YYYY-M-D H:m:s");
    memberNameList.forEach((memberName, idx) => {
      const contractHtml = contractHtmlProvider(
        body.suite_room_id,
        memberName,
        createdDate,
        memberNameList,
        body.group_deposit_per_person,
        body.group_created_at,
        finishDate,
        body.minimum_attendance,
        body.minimum_mission_completion,
        sentTx.hash
      );

      const fileName = `contract/${body.suite_room_id}-${memberName}.pdf`;
      contractPdfController(contractHtml, fileName, memberIdList[idx])
        .then(async (s3Url) => {
          await conn.execute(
            "INSERT INTO PDF_INFO VALUES (?,?,?,?,?,?,?,?,?)",
            [
              null,
              body.suite_room_id,
              memberIdList[idx],
              memberName,
              sentTx.hash.slice(0, 12),
              s3Url,
              "CONTRACT",
              nowTime,
              nowTime,
            ]
          );
          console.log("계약서 작성, S3버킷 저장, 이메일 전송 완료");
        })
        .catch((error) => {
          console.error("Error creating PDF:", error);
        });
    });

    return res.status(201).json({
      message: "스위트룸을 성공적으로 시작했습니다.",
      receipt,
      txFee,
      blockHash: receipt.blockHash,
      txHash: sentTx.hash,
      contractAddress: receipt.to,
    });
  } catch (err) {
    console.error(err);
    return res.status(409).json({
      message: err.reason,
    });
  }
};

export const stop = async (req, res) => {
  try {
    const body = req.body;

    const nowTime = moment().format("YYYY-M-D H:m:s");

    const hashedKey = await makeGroupHashedID(
      body.suite_room_id,
      body.title.replace(" ", "")
    );

    const [[contractMetaInfo]] = await Promise.all([
      conn.execute("SELECT * FROM CONTRACT_META_INFO WHERE hashed_key = ?", [
        hashedKey.crypt,
      ]),
    ]);

    if (contractMetaInfo.length === 0) {
      return res.status(403).json({
        error: "Forbidden",
        message: "존재하지 않는 Hashed_Key 입니다.",
      });
    }

    const contractManager = new ContractManager(
      process.env.POLYGON_MAIN_NET_WALLET_PRIVATE_KEY
    );
    console.log(contractManager);
    const contract = await contractManager.getContract(hashedKey.crypt);
    console.log(contract);
    const txData = contract.interface.encodeFunctionData("stopSuiteRoom", [
      hashedKey.crypt,
      body.participant_ids,
      body.participant_mission,
      body.participant_attendance,
    ]);
    console.log(txData);

    const gasFee = await contractManager.provider.getFeeData();
    const gasPrice = gasFee.maxFeePerGas;
    const gasLimit = await contractManager.provider.estimateGas({
      to: contractManager.contractAddress,
      data: txData,
      from: contractManager.wallet.address,
    });

    const tx = {
      to: contractManager.contractAddress,
      gasLimit,
      gasPrice,
      data: txData,
    };
    console.log(tx);
    const sentTx = await contractManager.wallet.sendTransaction(tx);
    const receipt = await sentTx.wait();
    const txFee = parseInt(receipt.gasUsed) * parseInt(receipt.gasPrice);
    console.log(receipt);

    await conn.execute(
      "INSERT INTO TX_DASHBOARD VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        null,
        hashedKey.crypt,
        "TX",
        sentTx.hash,
        nowTime,
        "stopSuiteRoom",
        "보증금 환급 가능액 정산",
        "SUITE",
        body,
        receipt.to,
        receipt.blockNumber,
        txFee,
      ]
    );

    return res.status(201).json({
      message: "스위트룸을 정상적으로 종료했습니다.",
    });
  } catch (err) {
    console.error(err);
    return res.status(409).json({
      message: err.reason,
    });
  }
};
