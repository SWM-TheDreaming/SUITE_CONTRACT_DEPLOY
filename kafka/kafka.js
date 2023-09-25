import { Kafka } from "kafkajs";
import dotenv from "dotenv";

dotenv.config();
const kafkaBrokers = process.env.KAFKA_BROKER_ORIGIN.split(",");
// kafka 설정 파일은 이 곳에 입력합니다.
const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID,
  brokers: kafkaBrokers,
});

export default kafka;
