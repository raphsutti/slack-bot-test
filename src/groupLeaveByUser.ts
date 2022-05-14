import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { formatDate } from "./formatDate";

interface LeaveByUser {
  userId: string;
  name: string;
  leaveList: { id: string; leave: string }[];
}

export const groupLeaveByUser = (
  items: DocumentClient.ItemList
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
              .map((date) => formatDate(date))
              .join("-"),
          };
        }),
    };
  });
};

// Display user leave text: user1 \n leave1 \n leave2 user2 \n leave1 \n leave2
export const displayUserLeaveInText = (leaveByUser: LeaveByUser[]) => {
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
