import sqlCon from "../configs/sqlCon.js";
import moment from "moment-timezone";
import { makeGroupHashedID } from "../lib/funcs.js";
import dotenv from "dotenv";
import ContractManager from "../provider/ContractManager.js";

dotenv.config();
moment.tz.setDefault("Asia/Seoul");

const conn = sqlCon();

export const getGroupContract = async (req, res) => {
  try {
    const { suite_room_id, title } = req.body;
    const nowTime = moment().format("YYYY-M-D H:m:s");
    const userId = req.decoded.sub.split("@")[0];

    const hashedKey = await makeGroupHashedID(
      suite_room_id,
      title.replace(" ", "")
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
    console.log(hashedKey.crypt);
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
    return res.status(200).json({
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
    return res.status(200).json({
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

export const getContractPdf = async (req, res) => {
  try {
    const body = req.body;
    const userId = req.decoded.sub;
    if (body.tx_code.length != 12) {
      return res.status(409).json({
        message: "tx_code의 길이가 올바르지 않습니다. 길이를 12로 맞춰주세요.",
      });
    }
    if (body.tx_code.slice(0, 2) != "0x") {
      return res.status(409).json({
        message: "tx_code는 0x로 시작해야합니다. 올바른 형식을 맞춰주세요.",
      });
    }
    console.log(body);
    const [findPdfResult] = await conn.execute(
      "SELECT * FROM PDF_INFO WHERE tx_code = ? and user_id = ?",
      [body.tx_code, userId]
    );
    console.log(body.tx_code, userId);
    console.log(findPdfResult);
    return res.status(200).json({
      message: "사용자의 TX_CODE에 따른 계약서 원본입니다.",
      pdf_link: findPdfResult[0].s3_url,
      pdf_type: findPdfResult[0].pdf_type,
    });
  } catch (e) {
    console.error(e);
    return res.status(400).json({
      message: e.reason,
    });
  }
};
