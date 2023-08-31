import kafka from "../kafka/kafka.js";
import sqlCon from "../db/sqlCon.js";
import axios from "axios";
import dotenv from "dotenv";
import moment from "moment-timezone";
import { suiteRoomContractCreationService } from "../service/suiteRoomContractCreationService.js";
import { slackMessageSender } from "../slack/slackMessageSender.js";

moment.tz.setDefault("Asia/Seoul");
dotenv.config();
const conn = sqlCon();

const producer = kafka.producer();
const consumer = kafka.consumer({
  groupId: "suiteRoomContractCreationConsumers",
});

const SUITEROOM_CONTRACT_CREATION = "SuiteRoom-Contract-Creation";
const CONTRACT_DELIVERY_NOTIFICATION = "Contract-Delivery-Notification";

const consumerSubscribe = {
  topic: SUITEROOM_CONTRACT_CREATION,
  fromBeginning: true,
};

const suiteRoomContractCreationConsumer = async () => {
  let tryNum = 1;
  let isErrorOccurInContract = false;
  await consumer.subscribe(consumerSubscribe);

  await producer.connect();

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        throw new Error();
        const nowTime = moment().unix();
        // 프로듀싱되는 값의 형태에 따라서 스위트룸 계약서 작성 로직을 수행합니다.
        console.log("-----------------------------------");
        const messageJson = JSON.parse(message.value.toString("utf-8"));
        const data = messageJson.data;

        data.participant_ids = JSON.parse(data.participant_ids);
        data.signatures = JSON.parse(data.signatures);

        const txResult = await suiteRoomContractCreationService(data);
        if (txResult.type == "Error") {
          isErrorOccurInContract = true;
          const contractCreateError = new Error("ContractCreateError");
          contractCreateError.data = txResult;
          throw contractCreateError;
        }
        console.log(txResult);
        const producedMessage = {
          uuid: "ContractDeliveryNotificationProducer/" + nowTime,
          data: txResult.receipt,
        };
        console.log(producedMessage);
        await producer.send({
          topic: CONTRACT_DELIVERY_NOTIFICATION,
          messages: [
            {
              value: JSON.stringify(producedMessage),
            },
          ],
        });

        // Contract-Delivery-Notification 큐에 넣기
      } catch (error) {
        if (isErrorOccurInContract) {
          console.log(error.data);
          slackMessageSender(
            topic,
            message,
            error.data,
            "https://editto.postman.co/workspace/SWM~d8e7edc0-3d37-4984-a08f-148f327e452a/request/22332085-778acaa7-635e-4f54-9c5b-636bc30d5d93"
          );
        } else if (tryNum < 4) {
          tryNum += 1;
          console.log(error);

          console.log(message.offset);
          consumer.seek({
            topic: topic,
            partition: partition,
            offset: message.offset,
          });
        } else {
          slackMessageSender(
            topic,
            message,
            error.data,
            "https://editto.postman.co/workspace/SWM~d8e7edc0-3d37-4984-a08f-148f327e452a/request/22332085-778acaa7-635e-4f54-9c5b-636bc30d5d93"
          );
        }
      }
    },
  });
};

export default suiteRoomContractCreationConsumer;
