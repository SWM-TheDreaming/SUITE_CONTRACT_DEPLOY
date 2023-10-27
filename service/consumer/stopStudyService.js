import path, { dirname } from "path";
import { fileURLToPath } from "url";

import dotenv from "dotenv";
import moment from "moment-timezone";

import sqlCon from "../../configs/sqlCon.js";

import {
  makeGroupHashedID,
  certificatedPdfController,
} from "../../lib/funcs.js";

import ContractManager from "../../provider/ContractManager.js";
import { certificatedHtmlProvider } from "../../provider/certificatedHtmlProvider.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
moment.tz.setDefault("Asia/Seoul");

const conn = sqlCon();
export const stopStudyService = async (data) => {
  try {
    const nowTime = moment().format("YYYY-M-D H:m:s");

    const hashedKey = await makeGroupHashedID(
      data.suite_room_id,
      data.title.replace(" ", "")
    );

    const [[contractMetaInfo], [txDataInfo]] = await Promise.all([
      conn.execute("SELECT * FROM CONTRACT_META_INFO WHERE hashed_key = ?", [
        hashedKey.crypt,
      ]),
      conn.execute(
        "SELECT * FROM TX_DASHBOARD WHERE hashed_key = ? and tx_func_name = ?",
        [hashedKey.crypt, "startSuiteRoom"]
      ),
    ]);

    if (contractMetaInfo.length === 0) {
      return {
        type: "Error",
        error: "Forbidden",
        message: "존재하지 않는 Hashed_Key 입니다.",
      };
    }
    console.log("key 유일성 검증 완료------------------------------");

    const contractManager = new ContractManager(
      process.env.POLYGON_MAIN_NET_WALLET_PRIVATE_KEY
    );

    const contract = await contractManager.getContract(hashedKey.crypt);
    console.log("시작 계약서 TX 코드 요청------------------------------");
    const readTx = await contract.getGroupContract(hashedKey.crypt);

    const transformData = (data, keys) => {
      return data.map((entry) =>
        entry.reduce((obj, value, idx) => {
          obj[keys[idx]] = typeof value === "bigint" ? value.toString() : value;
          return obj;
        }, {})
      );
    };

    const groupContractInfoKeys = [
      "user_id",
      "title",
      "group_capacity",
      "group_deposit_per_person",
      "group_period",
      "recruitment_period",
      "minimum_attendance",
      "minimum_mission_completion",
      "isRunning",
    ];

    const groupContractInfo = transformData(
      [readTx[0].slice(0, 9)],
      groupContractInfoKeys
    )[0];
    console.log("시작 계약서 TX 코드 확인 완료------------------------------");
    const txData = contract.interface.encodeFunctionData("stopSuiteRoom", [
      hashedKey.crypt,
      data.participant_ids,
      data.participant_mission,
      data.participant_attendance,
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
    console.log("계약서 종료 및 정산 요청 전송------------------------------");
    const sentTx = await contractManager.wallet.sendTransaction(tx);
    const receipt = await sentTx.wait();
    console.log(
      "계약서 종료 및 정산 요청 전송 완료------------------------------"
    );
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
        data,
        receipt.to,
        receipt.blockNumber,
        txFee,
      ]
    );
    const memberNameList = data.participant_names;
    const memberIdList = data.participant_ids;
    const missionRate = data.participant_mission;
    const attendanceRate = data.participant_attendance;
    console.log(
      "수료증 PDF 생성 및 이메일 전송 배치 작업 시작------------------------------"
    );
    for await (const [idx, memberName] of memberNameList.entries()) {
      if (
        missionRate[idx] < groupContractInfo["minimum_mission_completion"] ||
        attendanceRate[idx] < groupContractInfo["minimum_attendance"]
      ) {
        continue;
      }

      console.log(
        `${memberName}의 수료증 제작 시작------------------------------`
      );
      const certificatedHtml = certificatedHtmlProvider(
        data.suite_room_id,
        data.title,
        txDataInfo[0].tx_hash,
        sentTx.hash,
        groupContractInfo["minimum_mission_completion"],
        groupContractInfo["minimum_attendance"],
        missionRate[idx],
        attendanceRate[idx],
        memberNameList[idx]
      );
      const fileName = `certificated/${data.suite_room_id}-${memberName}.pdf`;
      await certificatedPdfController(
        certificatedHtml,
        fileName,
        memberIdList[idx]
      )
        .then(async (s3Url) => {
          await conn.execute(
            "INSERT INTO PDF_INFO VALUES (?,?,?,?,?,?,?,?,?)",
            [
              null,
              data.suite_room_id,
              memberIdList[idx],
              memberName,
              sentTx.hash.slice(0, 12),
              s3Url,
              "CERTIFICATED",
              nowTime,
              nowTime,
            ]
          );
          console.log("수료증 작성, S3버킷 저장, 이메일 전송 완료");
        })
        .catch((error) => {
          return {
            type: "API-Error",
            message: error,
          };
        });
    }
    console.log(
      "수료증 PDF 생성 및 이메일 전송 배치 작업 완료------------------------------"
    );

    return {
      message: "스위트룸을 정상적으로 종료했습니다.",
    };
  } catch (err) {
    console.error(err);
    return {
      type: "API-Error",
      message: err.reason,
    };
  }
};
