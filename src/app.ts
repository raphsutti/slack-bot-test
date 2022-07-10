import {
  App,
  AwsLambdaReceiver,
  BlockAction,
  BasicElementAction,
  BlockRadioButtonsAction,
} from "@slack/bolt";
import { AwsEvent } from "@slack/bolt/dist/receivers/AwsLambdaReceiver";
import { deleteItemDynamo, Leave, putDynamoItem, scanDynamo } from "./dynamo";
import { formatDate } from "./formatDate";
import {
  convertLeaveByUserToBlocks,
  displayUserLeaveInText,
  filterLeaveByDateRange,
  groupLeaveByUser,
  mondayAndFriday,
  mondayAndFridayNextWeek,
  startAndEndOfMonth,
} from "./groupLeaveByUser";

interface DateSelectionAction extends BasicElementAction {
  selected_date: string;
}

if (!process.env.SLACK_SIGNING_SECRET) {
  throw Error("No SLACK_SIGNING_SECRET");
}

const awsLambdaReceiver = new AwsLambdaReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: awsLambdaReceiver,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const channel = "#athena-leave-bot";

// Leave bot
app.command("/leavebot", async ({ ack, body, client }) => {
  await ack();

  await client.chat.postEphemeral({
    channel,
    user: body.user_id,
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
            value: "delete-leave-list",
            action_id: "deleteLeaveList",
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "🔎 Show me filtered leave dates",
              emoji: true,
            },
            value: "filter-leave-display",
            action_id: "filterLeaveDisplay",
          },
        ],
      },
    ],
  });

  return;
});

// Modal for filtered leave option
app.action("filterLeaveDisplay", async ({ ack, body, client, logger }) => {
  await ack();

  // Today in yyyy-mm-dd format
  const today = new Date().toISOString().slice(0, 10);

  try {
    await client.views.open({
      trigger_id: (body as BlockAction).trigger_id,
      view: {
        type: "modal",
        callback_id: "filterLeaveList",
        title: {
          type: "plain_text",
          text: "Filter leave",
        },
        blocks: [
          {
            type: "section",
            block_id: "presetDateRadioButton",
            text: {
              type: "mrkdwn",
              text: "Select preset date range",
            },
            accessory: {
              type: "radio_buttons",
              options: [
                {
                  text: {
                    type: "plain_text",
                    text: "This week",
                    emoji: true,
                  },
                  value: "thisWeek",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "Next week",
                    emoji: true,
                  },
                  value: "nextWeek",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "This month",
                    emoji: true,
                  },
                  value: "thisMonth",
                },
              ],
              action_id: "selectPresetDateRange",
            },
          },
        ],
        submit: {
          type: "plain_text",
          text: "Submit",
        },
      },
    });
  } catch (error) {
    logger.error(error, "Failed to open delete leave list modal");
  }
  return;
});

app.action("selectPresetDateRange", async ({ ack, body }) => {
  await ack();
  return;
});

app.view("filterLeaveList", async ({ ack, view, client, body, logger }) => {
  await ack();

  const selected =
    view.state.values.presetDateRadioButton.selectPresetDateRange
      .selected_option?.value;

  if (selected === "thisWeek") {
    const { monday, friday } = mondayAndFriday();

    try {
      const { Items } = await scanDynamo();

      if (!Items) {
        return;
      }

      const displayAllLeaveText = displayUserLeaveInText(
        groupLeaveByUser(
          filterLeaveByDateRange(monday, friday, Items as Leave[])
        )
      );

      await client.chat.postEphemeral({
        user: body.user.id,
        channel,
        text: "listing all the leave",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                displayAllLeaveText ||
                "🤷‍♂️ No leave found during selected period",
            },
          },
        ],
      });
    } catch (error) {
      logger.error(error, "failed to list this week's leave");
    }
  }

  if (selected === "nextWeek") {
    const { monday, friday } = mondayAndFridayNextWeek();

    try {
      const { Items } = await scanDynamo();

      if (!Items) {
        return;
      }
      console.log(filterLeaveByDateRange(monday, friday, Items as Leave[]));

      const displayAllLeaveText = displayUserLeaveInText(
        groupLeaveByUser(
          filterLeaveByDateRange(monday, friday, Items as Leave[])
        )
      );

      await client.chat.postEphemeral({
        user: body.user.id,
        channel,
        text: "listing all the leave",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                displayAllLeaveText ||
                "🤷‍♂️ No leave found during selected period",
            },
          },
        ],
      });
    } catch (error) {
      logger.error(error, "failed to list next week's leave");
    }
  }

  if (selected === "thisMonth") {
    const { firstDay, lastDay } = startAndEndOfMonth();

    try {
      const { Items } = await scanDynamo();

      if (!Items) {
        return;
      }

      const displayAllLeaveText = displayUserLeaveInText(
        groupLeaveByUser(
          filterLeaveByDateRange(firstDay, lastDay, Items as Leave[])
        )
      );

      await client.chat.postEphemeral({
        user: body.user.id,
        channel,
        text: "listing all the leave",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                displayAllLeaveText ||
                "🤷‍♂️ No leave found during selected period",
            },
          },
        ],
      });
    } catch (error) {
      logger.error(error, "failed to list this month's leave");
    }
  }

  return;
});

// Input leave
app.action("inputLeave", async ({ ack, body, client, logger }) => {
  await ack();

  // Today in yyyy-mm-dd format
  const today = new Date().toISOString().slice(0, 10);

  try {
    await client.views.open({
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
  } catch (error) {
    logger.error(error, "Failed to open input leave modal");
  }
  return;
});

// List leave
app.action("listLeave", async ({ ack, logger, client, body }) => {
  await ack();

  try {
    const { Items } = await scanDynamo();

    if (!Items) {
      return;
    }
    console.log("Items: ", Items);
    console.log(JSON.stringify(groupLeaveByUser(Items)));

    const displayAllLeaveText = displayUserLeaveInText(groupLeaveByUser(Items));

    await client.chat.postEphemeral({
      user: body.user.id,
      channel,
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
  } catch (error) {
    logger.error(error, "failed to list all leave");
  }
  return;
});

// List leave to delete
app.action("deleteLeaveList", async ({ ack, body, client, logger }) => {
  await ack();

  const { Items } = await scanDynamo();

  if (!Items) {
    return;
  }

  try {
    await client.views.open({
      trigger_id: (body as BlockAction).trigger_id,
      view: {
        type: "modal",
        callback_id: "deleteLeaveList",
        title: {
          type: "plain_text",
          text: "Delete leave",
        },
        blocks: convertLeaveByUserToBlocks(groupLeaveByUser(Items, true)),
      },
    });
  } catch (error) {
    logger.error(error, "Failed to open delete leave list modal");
  }

  return;
});

// TODO announce who's leave got deleted similar to when leave got entered
app.action("deleteLeave", async ({ ack, body, client, logger }) => {
  ack();

  const id = (body as any).actions[0].value;
  await deleteItemDynamo(id);

  const { Items } = await scanDynamo();

  if (!Items) {
    return;
  }

  try {
    await client.views.update({
      response_action: "update",
      view_id: (body as BlockAction).view?.id,
      view: {
        type: "modal",
        callback_id: "deleteLeaveList",
        title: {
          type: "plain_text",
          text: "Delete leave",
        },
        blocks: convertLeaveByUserToBlocks(groupLeaveByUser(Items, true)),
      },
    });
  } catch (error) {
    logger.error(error, "Failed to open delete leave list modal");
  }

  return;
});

app.action("leaveStartDate", async ({ ack, body }) => {
  await ack();
  return;
});

app.action("leaveEndDate", async ({ ack, body }) => {
  await ack();
  return;
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
    const { user } = await client.users.info({
      user: body.user.id,
    });

    const { id, name } = body.user;
    putDynamoItem({
      userId: id,
      userName: user?.real_name ?? name,
      leaveStart,
      leaveEnd,
    });

    await client.chat.postMessage({
      channel,
      text: `<@${body.user.id}> has entered leave 🏝\nStart: ${formatDate(
        leaveStart,
        true
      )}\nEnd: ${formatDate(leaveEnd, true)}`,
    });
  } catch (error) {
    logger.error(error, "Failed to put new leave entry to Dynamo");
  }
  return;
});

// TODO show who is on leave today cron job @ 8am

// TODO remove old leave from db cron job every week

export const handler = async (event: AwsEvent, context: any, callback: any) => {
  const receiver = await awsLambdaReceiver.start();
  return receiver(event, context, callback);
};
