import {
  App,
  AwsLambdaReceiver,
  MessageEvent,
  GenericMessageEvent,
  ReactionAddedEvent,
  ReactionMessageItem,
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

// const isMessageItem = (
//   item: ReactionAddedEvent["item"]
// ): item is ReactionMessageItem =>
//   (item as ReactionMessageItem).type === "message";

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

// Listens for an action from a button click
app.action("button_click", async ({ body, ack, say }) => {
  await ack();

  await say(`<@${body.user.id}> clicked the button`);
});

// Listens to incoming messages that contain "goodbye"
app.message("goodbye", async ({ message, say }) => {
  if (!isGenericMessageEvent(message)) return;
  // say() sends a message to the channel where the event was triggered
  await say(`See ya later, <@${message.user}> :wave:`);
});

// Handle the Lambda function event
export const handler = async (event: AwsEvent, context: any, callback: any) => {
  const receiver = await awsLambdaReceiver.start();
  return receiver(event, context, callback);
};
