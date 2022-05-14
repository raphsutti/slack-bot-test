import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { formatDate } from "./formatDate";

interface LeaveByUser {
  userId: string;
  name: string;
  leaveList: { id: string; leave: string }[];
}

export const groupLeaveByUser = (
  items: DocumentClient.ItemList,
  withYear = false
): LeaveByUser[] => {
  let leaveByUser: LeaveByUser[] = [];

  items.forEach((item) => {
    const index = leaveByUser.findIndex((user) => user.userId === item.userId);

    // User not found, add new user entry
    if (index === -1) {
      leaveByUser.push({
        userId: item.userId,
        name: item.userName,
        leaveList: [
          {
            id: item.id,
            leave: `${item.leaveStart},${item.leaveEnd}`,
          },
        ],
      });
    }

    // User found, append leave to existing user's leaveList
    if (index >= 0) {
      leaveByUser[index].leaveList.push({
        id: item.id,
        leave: `${item.leaveStart},${item.leaveEnd}`,
      });
    }
  });

  return leaveByUser.map((user) => {
    return {
      ...user,
      leaveList: user.leaveList
        // Sort leave dates ascending
        .sort((a, b) => {
          return a.leave < b.leave ? -1 : 1;
        })
        // Format all dates to dd/mm
        .map((user) => {
          return {
            ...user,
            leave: user.leave
              .split(",")
              .map((date) => formatDate(date, withYear))
              .join("-"),
          };
        }),
    };
  });
};

// Display user leave text: user1 \n leave1 \n leave2 user2 \n leave1 \n leave2
export const displayUserLeaveInText = (leaveByUser: LeaveByUser[]): string => {
  let displayAllLeaveInText = "";

  leaveByUser.forEach((user) => {
    displayAllLeaveInText += user.name + " 🏝\n";
    user.leaveList.forEach(({ leave }) => {
      displayAllLeaveInText += leave + "\n";
    });

    displayAllLeaveInText += "\n";
  });

  return displayAllLeaveInText;
};

interface DividerBlock {
  type: string;
}
interface UserBlock {
  type: string;
  text: {
    type: string;
    text: string;
    emoji: boolean;
  };
}
interface LeaveBlock {
  type: string;
  text: {
    type: string;
    text: string;
  };
  accessory: {
    type: string;
    text: {
      type: string;
      text: string;
      emoji: boolean;
    };
    value: string;
    action_id: string;
  };
}

type DeleteBlocks = (DividerBlock | LeaveBlock | UserBlock)[];

export const convertLeaveByUserToBlocks = (
  leaveByUser: LeaveByUser[]
): DeleteBlocks => {
  let blocks: DeleteBlocks = [];

  leaveByUser.forEach((user) => {
    // Create user block
    blocks.push({
      type: "divider",
    });
    blocks.push({
      type: "header",
      text: {
        type: "plain_text",
        text: user.name,
        emoji: true,
      },
    });

    // Create leave blocks with delete buttons
    const leaveBlocks = user.leaveList.map(({ id, leave }) => ({
      type: "section",
      text: {
        type: "mrkdwn",
        text: leave,
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "Delete",
          emoji: true,
        },
        style: "danger",
        value: id,
        action_id: "deleteLeave",
      },
    }));

    blocks.push(...leaveBlocks);
  });

  return blocks;
};
