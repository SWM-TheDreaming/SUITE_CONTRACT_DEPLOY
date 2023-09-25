import kafka from "../kafka/kafka.js";
import sqlCon from "../db/sqlCon.js";
import moment from "moment-timezone";
import { slackMessageSender } from "../slack/slackMessageSender.js";

moment.tz.setDefault("Asia/Seoul");

const conn = sqlCon();

const producer = kafka.producer();
const consumer = kafka.consumer({
  groupId: "userRegistrationConsumers",
});

const TOPIC = "User-Registration-UserMetaInfo";

const consumerSubscribe = {
  topic: TOPIC,
  fromBeginning: true,
};

const producerProducing = (message) => {
  return {
    topic: TOPIC,
    messages: [
      {
        value: JSON.stringify(message),
      },
    ],
  };
};

const userRegistrationConsumers = async () => {
  let tryNum = 1;
  await consumer.subscribe(consumerSubscribe);

  await producer.connect();

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const nowTime = moment().format("YYYY-M-D H:m:s");
        // 프로듀싱되는 값의 형태에 따라서 스위트룸 계약서 작성 로직을 수행합니다.
        console.log("----------------Message Consuming-------------------");
        const messageJson = JSON.parse(message.value.toString("utf-8"));
        const data = messageJson.data;
        await conn.execute("INSERT INTO USER_AUTH_INFO VALUES (?,?,?,?,?)", [
          null,
          data.memberId,
          data.accountStatus,
          nowTime,
          nowTime,
        ]);
        console.log("----------------Finish Consuming-------------------");
        console.log("----------------Consumed Data Info-------------------");
        console.log(data);
      } catch (error) {
        if (tryNum < 4) {
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
            "https://editto.postman.co/workspace/SWM~d8e7edc0-3d37-4984-a08f-148f327e452a/request/22332085-7c2d20e1-c8da-42ee-ad00-44262fb408b7"
          );
        }
      }
    },
  });
};

export default userRegistrationConsumers;
