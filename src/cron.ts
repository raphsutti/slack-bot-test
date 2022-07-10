import { LogLevel, WebClient } from "@slack/web-api";
import { scanDynamo, Leave } from "./dynamo";
import {
  mondayAndFriday,
  displayUserLeaveInText,
  groupLeaveByUser,
  filterLeaveByDateRange,
} from "./groupLeaveByUser";

const client = new WebClient(process.env.SLACK_BOT_TOKEN, {
  logLevel: LogLevel.DEBUG,
});
const channel = "#athena-leave-bot";

module.exports.startOfWeek = async () => {
  const { monday, friday } = mondayAndFriday();

  try {
    const { Items } = await scanDynamo();

    if (!Items) {
      return;
    }

    const displayAllLeaveText = displayUserLeaveInText(
      groupLeaveByUser(filterLeaveByDateRange(monday, friday, Items as Leave[]))
    );

    await client.chat.postMessage({
      channel,
      text: "listing this week's leave",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              "Good morning! The following people are on leave this week:\n" +
                displayAllLeaveText ||
              "Good morning! No one is on leave this week :cattype:",
          },
        },
      ],
    });
  } catch (error) {
    console.error(error, "failed to list this week's leave");
  }
};
