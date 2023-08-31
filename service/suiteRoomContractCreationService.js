import sqlCon from "../db/sqlCon.js";
import moment from "moment-timezone";
import { makeGroupHashedID } from "../lib/funcs.js";
import dotenv from "dotenv";
import ContractManager from "../provider/ContractManager.js";

dotenv.config();
moment.tz.setDefault("Asia/Seoul");

const conn = sqlCon();

export const suiteRoomContractCreationService = async (data) => {
  const nowTime = moment().format("YYYY-M-D H:m:s");

  try {
    const hashedKey = await makeGroupHashedID(
      data.suite_room_id,
      data.title.replace(" ", "")
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
      return {
        type: "Error",
        error: "Forbidden",
        message:
          "이미 존재하는 hashedKey를 가진 suite_room_id와 title 쌍입니다.",
      };
    }
    console.log("key 유일성 검증 완료------------------------------");
    const lbContractId =
      (contractMetaInfoLength[0].length % contractInfoLength[0].length) + 1;

    await conn.execute(
      "INSERT INTO CONTRACT_META_INFO VALUES (?,?,?,?,?,?,?)",
      [
        null,
        data.suite_room_id,
        data.title.replace(" ", ""),
        hashedKey.crypt,
        lbContractId,
        nowTime,
        nowTime,
      ]
    );

    console.log("계약서 메타 정보 저장 완료------------------------------");
    const contractManager = new ContractManager();
    const contract = await contractManager.getContract(hashedKey.crypt);
    console.log("계약서 컨트랙트 이서 시작------------------------------");
    const txData = contract.interface.encodeFunctionData("startSuiteRoom", [
      hashedKey.crypt,
      data.leader_id,
      data.title.replace(" ", ""),
      data.participant_ids,
      data.signatures,
      data.group_capacity,
      data.group_deposit_per_person,
      data.group_period,
      data.recruitment_period,
      data.minimum_attendance,
      data.minimum_mission_completion,
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
        data,
        receipt.to,
        receipt.blockNumber,
        txFee,
      ]
    );
    console.log("계약서 이력 작성 완료------------------------------");
    return {
      type: "Success",
      message: "스위트룸을 성공적으로 시작했습니다.",
      receipt,
      txFee,
      blockHash: receipt.blockHash,
      txHash: sentTx.hash,
      contractAddress: receipt.to,
    };
  } catch (err) {
    console.error(err);
    return {
      type: "Error",
      message: err.reason,
    };
  }
};
