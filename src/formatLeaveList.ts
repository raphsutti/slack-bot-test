import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { formatDate } from "./formatDate";

interface LeaveList {
  userId: string;
  name: string;
  leavePeriod: { id: string; leave: string }[];
}

export const formatLeaveList = (items: DocumentClient.ItemList) => {
  let leaveList: LeaveList[] = [];
  items.forEach((item) => {
    const index = leaveList.findIndex((user) => user.userId === item.userId);
    if (index === -1) {
      leaveList.push({
        userId: item.userId,
        name: item.userName,
        leavePeriod: [
          {
            id: item.id,
            leave: `${item.leaveStart},${item.leaveEnd}`,
          },
        ],
      });
    }
    if (index >= 0) {
      leaveList[index].leavePeriod.push({
        id: item.id,
        leave: `${item.leaveStart},${item.leaveEnd}`,
      });
    }
  });

  return leaveList
    .map((user) => {
      return {
        ...user,
        leavePeriod: user.leavePeriod.sort((a, b) => {
          return a.leave < b.leave ? -1 : 1;
        }),
      };
    })
    .map((user) => {
      return {
        ...user,
        leavePeriod: user.leavePeriod.map(({ id, leave }) => {
          return {
            id,
            leave: leave
              .split(",")
              .map((date) => formatDate(date))
              .join(" to "),
          };
        }),
      };
    });
};
