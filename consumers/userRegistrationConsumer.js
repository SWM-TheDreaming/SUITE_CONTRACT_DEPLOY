import kafka from "../kafka/kafka.js";
import sqlCon from "../db/sqlCon.js";

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
  await consumer.subscribe(consumerSubscribe);

  await producer.connect();

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        // 프로듀싱되는 값의 형태에 따라서 회원 정보 저장 로직을 수행합니다.
        console.log("-----------------------------------");
        console.log(message.value.toString());
      } catch (e) {
        // Choreography 수행합니다.
        
        // await producer.send(producerProducing("message dto in here"));
      }
    },
  });
};

export default userRegistrationConsumers;
