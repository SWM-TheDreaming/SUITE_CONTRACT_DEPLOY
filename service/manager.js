import sqlCon from "../db/sqlCon.js";
import moment from "moment-timezone";
import { makeGroupHashedID } from "../lib/funcs.js";
import dotenv from "dotenv";
import ContractManager from "../provider/ContractManager.js";
import { selectAccountKey } from "../lib/funcs.js";
import { ethers } from "ethers";
import provider from "../provider/provider.js";
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

    const lbContractId = (contractMetaInfo.length % contractInfo.length) + 1;

    const [availableAccountsResult] = await conn.execute(
      "SELECT account_key FROM ACCOUNT_INFO WHERE alive = ?",
      [1]
    );

    const accountRndId = Math.floor(
      1 + Math.random() * availableAccountsResult.length
    );

    req.on("timeout", async () => {
      await conn.execute("UPDATE ACCOUNT_INFO SET alive = ? WHERE id = ?", [
        false,
        accountRndId,
      ]);
      res.status(400).json({
        error: "요청이 시간 초과되었습니다. 계좌를 불용처리했습니다.",
      });
    });

    const accountPK = await selectAccountKey(accountRndId);

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

    const contractManager = new ContractManager(accountPK);

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
    const [availableAccountsResult] = await conn.execute(
      "SELECT account_key FROM ACCOUNT_INFO WHERE alive = ?",
      [1]
    );

    const accountRndId = Math.floor(
      1 + Math.random() * availableAccountsResult.length
    );

    const accountPK = await selectAccountKey(accountRndId);
    console.log(accountPK);
    const contractManager = new ContractManager(accountPK);
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

export const updateAccount = async (req, res) => {
  try {
    const nowTime = moment().format("YYYY-M-D H:m:s");
    const body = req.body;
    const { new_account_key, new_public_key } = body;

    const [unusableAccountResult] = conn.execute(
      "SELECT * FROM ACCOUNT_INFO WHERE alive = ? LIMIT 1",
      [false]
    );

    if (unusableAccountResult.length === 0) {
      return res.status(403).json({
        error: "Forbidden",
        message: "불가용 계정이 존재하지 않아 키를 업데이트 할 수 없습니다.",
      });
    }

    const [availableAccountsResult] = await conn.execute(
      "SELECT account_key FROM ACCOUNT_INFO WHERE alive = ?",
      [1]
    );

    const [contractInfoResults] = await conn.execute(
      "SELECT contract_address, contractABI FROM CONTRACT_INFO"
    );

    for await (const contractInfo of contractInfoResults) {
      const accountRndId = Math.floor(
        1 + Math.random() * availableAccountsResult.length
      );
      const accountPK = await selectAccountKey(accountRndId);

      const wallet = new ethers.Wallet(accountPK, provider);
      const contract = new ethers.Contract(
        contractInfo.contract_address,
        contractInfo.contractABI,
        wallet
      );
      const txData = contract.interface.encodeFunctionData("addOwners", [
        [new_public_key],
      ]);
      const gasFee = await provider.getFeeData();
      const gasPrice = gasFee.maxFeePerGas;
      const gasLimit = await provider.estimateGas({
        to: contractInfo.contract_address,
        data: txData,
        from: wallet.address,
      });

      const tx = {
        to: contractInfo.contract_address,
        gasLimit,
        gasPrice,
        data: txData,
      };
      const sentTx = await wallet.sendTransaction(tx);
      const receipt = await sentTx.wait();
      console.log({
        message: "계좌를 성공적으로 업데이트했습니다.",
        receipt,
        txFee,
        blockHash: receipt.blockHash,
        txHash: sentTx.hash,
        contractAddress: receipt.to,
      });
    }

    await conn.execute(
      "UPDATE ACCOUNT_INFO SET account_key = ? , public_key = ? WHERE id = ?",
      [new_account_key, new_public_key, unusableAccountResult[0].id]
    );

    return res.status(201).json({
      message: "계좌를 성공적으로 업데이트했습니다.",
    });
  } catch (error) {
    console.error(error);
    return res.status(409).json({
      message: error.reason,
    });
  }
};
