import kafka from "../kafka/kafka.js";
import sqlCon from "../configs/sqlCon.js";
import dotenv from "dotenv";
import moment from "moment-timezone";
import { stopStudyService } from "../service/consumer/stopStudyService.js";
import { slackMessageSender } from "../slack/slackMessageSender.js";

moment.tz.setDefault("Asia/Seoul");
dotenv.config();
const conn = sqlCon();

const producer = kafka.producer();
const consumer = kafka.consumer({
  groupId: "stopStudyConsumers",
});

const STUDY_STOP = "Study-Stop";

const consumerSubscribe = {
  topic: STUDY_STOP,
  fromBeginning: true,
};

const stopSuiteConsumer = async () => {
  let tryNum = 1;
  let isErrorOccurInContract = false;
  await consumer.subscribe(consumerSubscribe);

  await producer.connect();

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const nowTime = moment().unix();
        // 프로듀싱되는 값의 형태에 따라서 스위트룸 계약서 작성 로직을 수행합니다.
        console.log("----------------Message Consuming-------------------");
        const messageJson = JSON.parse(message.value.toString("utf-8"));
        const data = messageJson.data;
        console.log(data);
        const txResult = await stopStudyService(data);

        if (txResult.type == "Error") {
          isErrorOccurInContract = true;
          const contractCreateError = new Error("Contract Transaction Error");
          contractCreateError.data = txResult;
          throw contractCreateError;
        } else if (txResult.type == "API-Error") {
          const accountBlockError = new Error("API ERROR OCCURED");
          contractCreateError.data = txResult;
          throw accountBlockError;
        }
        console.log("----------------Finish Consuming-------------------");
        console.log("----------------Consumed Data Info-------------------");
        console.log(txResult);
        // const producedMessage = {
        //   uuid: "ContractDeliveryNotificationProducer/" + nowTime,
        //   data: txResult.receipt,
        // };
        // console.log(producedMessage);
        // await producer.send({
        //   topic: CONTRACT_DELIVERY_NOTIFICATION,
        //   messages: [
        //     {
        //       value: JSON.stringify(producedMessage),
        //     },
        //   ],
        // });
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
          console.log("----------------Error Occurred!-------------------");
          tryNum += 1;
          console.log(error);
          console.log(message.offset);
          console.log(
            "----------------Compensating transaction-------------------"
          );
          consumer.seek({
            topic: topic,
            partition: partition,
            offset: message.offset,
          });
        } else {
          console.log(
            "----------------Three Time Over. Check Slack Error Msg-------------------"
          );
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

export default stopSuiteConsumer;
