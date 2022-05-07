import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { formatDate } from "./formatDate";

interface LeaveList {
  userId: string;
  name: string;
  leavePeriod: string[];
}

export const formatLeaveList = (items: DocumentClient.ItemList) => {
  let leaveList: LeaveList[] = [];
  items.forEach((el) => {
    const index = leaveList.findIndex((user) => user.userId === el.userId);
    if (index === -1) {
      leaveList.push({
        userId: el.userId,
        name: el.userName,
        leavePeriod: [
          `${formatDate(el.leaveStart)}-${formatDate(el.leaveEnd)}`,
        ],
      });
    }
    if (index >= 0) {
      leaveList[index].leavePeriod.push(
        `${formatDate(el.leaveStart)}-${formatDate(el.leaveEnd)}`
      );
    }
  });

  return leaveList;
};
