import {
  App,
  AwsLambdaReceiver,
  MessageEvent,
  GenericMessageEvent,
  BlockAction,
  BasicElementAction,
} from "@slack/bolt";
import { AwsEvent } from "@slack/bolt/dist/receivers/AwsLambdaReceiver";

interface DateSelectionAction extends BasicElementAction {
  selected_date: string;
}

if (!process.env.SLACK_SIGNING_SECRET) {
  throw Error("no SLACK_SIGNING_SECRET");
}

const awsLambdaReceiver = new AwsLambdaReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: awsLambdaReceiver,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  // socketMode: true,
  // appToken: process.env.SLACK_APP_TOKEN,
});

// Listens to incoming messages that contain "hello"
app.message("hello", async ({ message, say }) => {
  const isGenericMessageEvent = (
    msg: MessageEvent
  ): msg is GenericMessageEvent =>
    (msg as GenericMessageEvent).subtype === undefined;

  if (!isGenericMessageEvent(message)) return;

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

// Leave bot
app.command("/leavebot", async ({ ack, body, client }) => {
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
  } catch (error) {}
});

let leaveStart: string;
let leaveEnd: string;

app.action("leaveStartDate", async ({ ack, body }) => {
  await ack();

  leaveStart = ((body as BlockAction).actions[0] as DateSelectionAction)
    .selected_date;
  console.log("leaveStart: ", leaveStart);
});

app.action("leaveEndDate", async ({ ack, body }) => {
  await ack();
  leaveEnd = ((body as BlockAction).actions[0] as DateSelectionAction)
    .selected_date;
  console.log("leaveEnd: ", leaveEnd);
});

app.view("viewSelectDateRange", async ({ ack, body, client, view }) => {
  await ack();

  try {
    await client.chat.postMessage({
      channel: "#noise",
      text: `<@${body.user.id}> has entered leave. \nStart: ${view.state.values.leaveStartDate.leaveStartDate.selected_date}\nEnd: ${view.state.values.leaveEndDate.leaveEndDate.selected_date}`,
    });
  } catch (error) {}
});

// TODO show current leave
// ? store as date range? What about half days?

export const handler = async (event: AwsEvent, context: any, callback: any) => {
  const receiver = await awsLambdaReceiver.start();
  return receiver(event, context, callback);
};
