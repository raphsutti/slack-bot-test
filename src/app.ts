import {
  App,
  AwsLambdaReceiver,
  MessageEvent,
  GenericMessageEvent,
  BlockAction,
  BasicElementAction,
} from "@slack/bolt";
import { AwsEvent } from "@slack/bolt/dist/receivers/AwsLambdaReceiver";

if (!process.env.SLACK_SIGNING_SECRET) {
  throw Error("no SLACK_SIGNING_SECRET");
}
// Initialize your custom receiver
const awsLambdaReceiver = new AwsLambdaReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Initializes your app with your bot token and app token
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: awsLambdaReceiver,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  // socketMode: true,
  // appToken: process.env.SLACK_APP_TOKEN,
});

const isGenericMessageEvent = (msg: MessageEvent): msg is GenericMessageEvent =>
  (msg as GenericMessageEvent).subtype === undefined;

// Listens to incoming messages that contain "hello"
app.message("hello", async ({ message, say }) => {
  if (!isGenericMessageEvent(message)) return;

  // say() sends a message to the channel where the event was triggered
  await say({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Hey there <@${message.user}>!`,
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Click Me",
          },
          action_id: "button_click",
        },
      },
    ],
    text: `Hey there <@${message.user}>!`,
  });
});

app.command("/leavebot", async ({ ack, body, client, logger }) => {
  await ack();

  const today = new Date().toISOString().slice(0, 10);

  try {
    const result = await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: "modal",
        callback_id: "viewSelectDateRange",
        title: {
          type: "plain_text",
          text: "Leave entry",
        },
        blocks: [
          {
            type: "section",
            block_id: "leaveStartDate",
            text: {
              type: "mrkdwn",
              text: "Starting date",
            },
            accessory: {
              type: "datepicker",
              action_id: "leaveStartDate",
              initial_date: today,
              placeholder: {
                type: "plain_text",
                text: "Select a date",
              },
            },
          },
          {
            type: "section",
            block_id: "leaveEndDate",
            text: {
              type: "mrkdwn",
              text: "End date",
            },
            accessory: {
              type: "datepicker",
              action_id: "leaveEndDate",
              initial_date: today,
              placeholder: {
                type: "plain_text",
                text: "Select a date",
              },
            },
          },
        ],
        submit: {
          type: "plain_text",
          text: "Submit",
        },
      },
    });
    console.log("result: ", result);
  } catch (error) {}
});

let leaveStart: string;
let leaveEnd: string;

interface DateSelectionAction extends BasicElementAction {
  selected_date: string;
}

app.action("leaveStartDate", async ({ ack, body, client, logger }) => {
  await ack();
  console.log("body: ", body);

  leaveStart = ((body as BlockAction).actions[0] as DateSelectionAction)
    .selected_date;
  console.log("leaveStart: ", leaveStart);
});

app.action("leaveEndDate", async ({ ack, body, client, logger }) => {
  await ack();
  leaveEnd = ((body as BlockAction).actions[0] as DateSelectionAction)
    .selected_date;
  console.log("leaveEnd: ", leaveEnd);
});

app.view("viewSelectDateRange", async ({ ack, body, view, client }) => {
  await ack();

  const user = body["user"]["id"];

  let msg = `<@${user}> has entered leave. Start: ${leaveStart}; End: ${leaveEnd}`;
  try {
    await client.chat.postMessage({
      channel: "#noise",
      text: msg,
    });
  } catch (error) {}
});

// TODO show current leave
// ? store as date range? What about half days?

export const handler = async (event: AwsEvent, context: any, callback: any) => {
  const receiver = await awsLambdaReceiver.start();
  return receiver(event, context, callback);
};
