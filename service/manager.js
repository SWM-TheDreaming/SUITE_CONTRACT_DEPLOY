import sqlCon from "../db/sqlCon.js";
import moment from "moment-timezone";
import { makeGroupHashedID } from "../lib/funcs.js";
import dotenv from "dotenv";
import ContractManager from "../provider/ContractManager.js";

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

    await conn.execute("INSERT INTO user_auth_info VALUES (?,?,?,?,?,?)", [
      null,
      body.user_id,
      body.user_name,
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
  const nowTime = moment().format("YYYY-M-D H:m:s");
  const body = req.body;

  try {
    const hashedKey = await makeGroupHashedID(
      body.suite_room_id,
      body.title.replace(" ", "")
    );

    const [contractMetaInfoLength, contractInfoLength, isHashedKeyExist] =
      await Promise.all([
        conn.execute("SELECT id FROM CONTRACT_META_INFO"),
        conn.execute("SELECT id FROM CONTRACT_INFO"),
        conn.execute("SELECT id FROM CONTRACT_META_INFO WHERE hashed_key = ?", [
          hashedKey.crypt,
        ]),
      ]);

    if (isHashedKeyExist[0].length !== 0) {
      return res.status(403).json({
        error: "Forbidden",
        message:
          "이미 존재하는 hashedKey를 가진 suite_room_id와 title 쌍입니다.",
      });
    }

    const lbContractId =
      (contractMetaInfoLength[0].length % contractInfoLength[0].length) + 1;

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

    const contractManager = new ContractManager();
    const contract = await contractManager.getContract(hashedKey.crypt);

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
    const gasPrice = gasFee.maxFeePerGas + gasFee.maxPriorityFeePerGas;
    const gasLimit = await contractManager.provider.estimateGas({
      to: contractManager.contractAddress,
      data: txData,
      from: contractManager.wallet.address,
    });

    const tx = {
      to: contractManager.contractAddress,
      gasLimit: gasLimit * BigInt(2),
      gasPrice,
      data: txData,
    };

    const sentTx = await contractManager.wallet.sendTransaction(tx);
    const receipt = await sentTx.wait();
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

export const getGroupContract = async (req, res) => {
  try {
    const { suite_room_id, title } = req.body;
    const nowTime = moment().format("YYYY-M-D H:m:s");
    const userId = req.decoded.sub.split("@")[0];

    const hashedKey = await makeGroupHashedID(
      suite_room_id,
      title.replace(" ", "")
    );

    const [isHashedKeyExist] = await Promise.all([
      conn.execute("SELECT id FROM CONTRACT_META_INFO WHERE hashed_key = ?", [
        hashedKey.crypt,
      ]),
    ]);

    if (isHashedKeyExist.length === 0) {
      return res.status(403).json({
        error: "Forbidden",
        message: "존재하지 않는 Hashed_Key 입니다.",
      });
    }

    const contractManager = new ContractManager();
    const contract = await contractManager.getContract(hashedKey.crypt);
    const tx = await contract.getGroupContract(hashedKey.crypt);

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
    const depositKeys = [
      "user_id",
      "deposit_amount",
      "payment_timestamp",
      "signature",
      "kicked_flag",
    ];

    const groupContractInfo = transformData(
      [tx[0].slice(0, 9)],
      groupContractInfoKeys
    )[0];
    const participantDeposits = transformData(tx[1], depositKeys);
    const finalGroupDeposits = transformData(tx[2], depositKeys);
    const blockNumber = await contractManager.provider.getBlock();

    await conn.execute(
      "INSERT INTO TX_DASHBOARD VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        null,
        hashedKey.crypt,
        "READ",
        "READ CONTRACT",
        nowTime,
        "getGroupContract",
        "계약서 내용 및 스터디 참여자 장부 조회",
        userId,
        {
          groupContractInfo,
          participantDeposits,
          finalGroupDeposits,
        },
        contract.target,
        blockNumber.number,
        0,
      ]
    );
    return res.status(201).json({
      message: "계약자의 스위트룸 정보를 불러옵니다.",
      groupContractInfo,
      participantDeposits,
      finalGroupDeposits,
    });
  } catch (err) {
    console.error(err);
    return res.status(409).json({
      message: err,
    });
  }
};

export const stop = async (req, res) => {
  try {
    const body = req.body;

    const nowTime = moment().format("YYYY-M-D H:m:s");
    const userId = req.decoded.sub.split("@")[0];
    const hashedKey = await makeGroupHashedID(
      body.suite_room_id,
      body.title.replace(" ", "")
    );

    const [isHashedKeyExist] = await Promise.all([
      conn.execute("SELECT id FROM CONTRACT_META_INFO WHERE hashed_key = ?", [
        hashedKey.crypt,
      ]),
    ]);

    if (isHashedKeyExist.length === 0) {
      return res.status(403).json({
        error: "Forbidden",
        message: "존재하지 않는 Hashed_Key 입니다.",
      });
    }

    const contractManager = new ContractManager();
    const contract = await contractManager.getContract(hashedKey.crypt);

    const txData = contract.interface.encodeFunctionData("stopSuiteRoom", [
      hashedKey.crypt,
      body.participant_ids,
      body.participant_mission,
      body.participant_attendance,
    ]);

    const gasFee = await contractManager.provider.getFeeData();
    const gasPrice = gasFee.maxFeePerGas + gasFee.maxPriorityFeePerGas;
    const gasLimit = await contractManager.provider.estimateGas({
      to: contractManager.contractAddress,
      data: txData,
      from: contractManager.wallet.address,
    });

    const tx = {
      to: contractManager.contractAddress,
      gasLimit: gasLimit * BigInt(2),
      gasPrice,
      data: txData,
    };

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

export const getTransactionRead = async (req, res) => {
  try {
    const body = req.body;

    const hashedKey = await makeGroupHashedID(
      body.suite_room_id,
      body.title.replace(" ", "")
    );

    const [txResults] = await conn.execute(
      "SELECT * FROM TX_DASHBOARD WHERE hashed_key = ? and tx_action = ?",
      [hashedKey.crypt, "READ"]
    );
    return res.status(201).json({
      message: "스마트 컨트랙트 내역을 정상적으로 조회했습니다.",
      txResults,
    });
  } catch (e) {
    console.error(e);
    return res.status(409).json({
      message: e.reason,
    });
  }
};

export const getTransactionTx = async (req, res) => {
  try {
    const body = req.body;

    const hashedKey = await makeGroupHashedID(
      body.suite_room_id,
      body.title.replace(" ", "")
    );

    const [txResults] = await conn.execute(
      "SELECT * FROM TX_DASHBOARD WHERE hashed_key = ? and tx_action = ?",
      [hashedKey.crypt, "TX"]
    );
    return res.status(201).json({
      message: "스마트 컨트랙트 내역을 정상적으로 조회했습니다.",
      txResults,
    });
  } catch (e) {
    console.error(e);
    return res.status(409).json({
      message: e.reason,
    });
  }
};
