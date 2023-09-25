import kafka from "../kafka/kafka.js";
import { slackMessageSender } from "../slack/slackMessageSender.js";
import { userRregistrationService } from "../service/producer/userRegistrationService.js";

const producer = kafka.producer();
const consumer = kafka.consumer({
  groupId: "userRegistrationConsumers",
});

const TOPIC = "User-Registration-UserMetaInfo";

const consumerSubscribe = {
  topic: TOPIC,
  fromBeginning: true,
};

const userRegistrationConsumers = async () => {
  let tryNum = 1;
  await consumer.subscribe(consumerSubscribe);

  await producer.connect();

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        console.log("----------------Message Consuming-------------------");
        const messageJson = JSON.parse(message.value.toString("utf-8"));
        const data = messageJson.data;
        const result = await userRregistrationService(data);
        console.log(result);
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
