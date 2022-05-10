import {
  App,
  AwsLambdaReceiver,
  MessageEvent,
  GenericMessageEvent,
  BlockAction,
  BasicElementAction,
} from "@slack/bolt";
import { AwsEvent } from "@slack/bolt/dist/receivers/AwsLambdaReceiver";
import { putDynamoItem, scanDynamo } from "./dynamo";
import { formatLeaveList } from "./formatLeaveList";

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
app.command("/leavebot", async ({ ack, say }) => {
  await ack();
  await say({
    blocks: [
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "🏝 Input new leave",
              emoji: true,
            },
            value: "input-leave",
            action_id: "inputLeave",
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "👀 Show me everyone's leave",
              emoji: true,
            },
            value: "list-leave",
            action_id: "listLeave",
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "🙅 Delete leave entry",
              emoji: true,
            },
            value: "delete-leave",
            action_id: "deleteLeave",
          },
        ],
      },
    ],
  });
});

let leaveStart: string;
let leaveEnd: string;

// Input leave
app.action("inputLeave", async ({ ack, body, client }) => {
  await ack();

  const today = new Date().toISOString().slice(0, 10);

  try {
    const result = await client.views.open({
      trigger_id: (body as BlockAction).trigger_id,
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

// List leave
app.action("listLeave", async ({ ack, say }) => {
  await ack();

  try {
    const { Items } = await scanDynamo();

    if (!Items) {
      return;
    }

    const leaveList = formatLeaveList(Items);

    let displayAllLeaveText = "";

    leaveList.forEach((user) => {
      displayAllLeaveText += user.name + " 🏝\n";
      user.leavePeriod.forEach(({ leave }) => {
        displayAllLeaveText += leave + "\n";
      });

      displayAllLeaveText += "\n";
    });

    say({
      text: "listing all the leave",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: displayAllLeaveText,
          },
        },
      ],
    });
  } catch (error) {}
});

// TODO delete leave
app.action("deleteLeave", async ({ ack, say }) => {
  await ack();

  const { Items } = await scanDynamo();

  if (!Items) {
    return;
  }

  const leaveList = formatLeaveList(Items);

  let blocks: any[] = [];

  leaveList.forEach((user) => {
    blocks.push({
      type: "section",
      text: {
        type: "plain_text",
        text: user.name,
        emoji: true,
      },
    });

    const leaveBlocks = user.leavePeriod.map(({ id, leave }) => {
      return {
        type: "section",
        text: {
          type: "mrkdwn",
          text: leave,
        },
        // TODO make button red
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Delete",
            emoji: true,
          },
          value: `delete-${id}`,
          action_id: id,
        },
      };
    });

    blocks.push(...leaveBlocks);
  });

  say({
    blocks,
  });

  try {
  } catch (err) {}
});

// TODO delete action Dynamo

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

app.view("viewSelectDateRange", async ({ ack, body, client, view, logger }) => {
  await ack();

  try {
    const leaveStart =
      view.state.values.leaveStartDate.leaveStartDate.selected_date;
    const leaveEnd = view.state.values.leaveEndDate.leaveEndDate.selected_date;

    if (!leaveStart || !leaveEnd) {
      logger.error("Missing leave start or leave end date");
      return;
    }

    await client.chat.postMessage({
      channel: "#noise",
      // TODO format leave date range
      text: `<@${body.user.id}> has entered leave 🏝\nStart: ${leaveStart}\nEnd: ${leaveEnd}`,
    });

    const { id, name } = body.user;
    putDynamoItem({
      userId: id,
      userName: name,
      leaveStart,
      leaveEnd,
    });
  } catch (error) {}
});

// TODO show who is on leave today cron job @ 8am

// TODO remove old leave from db cron job every week

export const handler = async (event: AwsEvent, context: any, callback: any) => {
  const receiver = await awsLambdaReceiver.start();
  return receiver(event, context, callback);
};
