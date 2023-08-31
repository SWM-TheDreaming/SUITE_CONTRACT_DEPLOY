import axios from "axios";
import dotenv from "dotenv";
import moment from "moment-timezone";

moment.tz.setDefault("Asia/Seoul");
dotenv.config();

export const slackMessageSender = (topic, message, error, recover_uri) => {
  const text = `*에러 발생* <@${
    process.env.HWANY_SLACK_ID
  }> *\`${topic}\`* 메시지 처리 중 예외 발생!! \n *recovery uri* \`${recover_uri}\`\n \`\`\`\n${JSON.stringify(
    JSON.parse(message.value.toString()).data,
    null,
    2
  )}\n \`\`\` \n 해당 메시지 재처리 필요합니다. \n\n *error_message* : \`\`\`${JSON.stringify(
    error,
    null,
    2
  )}\`\`\``;
  axios
    .post(process.env.SLACK_WEBHOOK_URL, {
      text,
    })
    .then((res) => {
      console.log("success");
    })
    .catch((error) => {
      console.error(error);
    });
};
