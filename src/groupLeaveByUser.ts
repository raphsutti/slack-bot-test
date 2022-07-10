import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Leave } from "./dynamo";
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

  // Sort by more recent leave dates first
  items.sort((a, b) => Date.parse(a.leaveStart) - Date.parse(b.leaveStart));

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

export const mondayAndFriday = () => {
  const currentDay = new Date();
  // New week starts when it is Sunday
  // This week monday
  const monday = new Date(
    currentDay.setDate(currentDay.getDate() - currentDay.getDay() + 1)
  )
    .toISOString()
    .slice(0, 10);
  // This week friday
  const friday = new Date(
    currentDay.setDate(currentDay.getDate() - currentDay.getDay() + 5)
  )
    .toISOString()
    .slice(0, 10);
  return {
    monday,
    friday,
  };
};

export const mondayAndFridayNextWeek = () => {
  const currentDay = new Date();

  const nextWeekCurrentDay = new Date(
    currentDay.setDate(currentDay.getDate() + 7)
  );
  // New week starts when it is Sunday
  // This week monday
  const monday = new Date(
    nextWeekCurrentDay.setDate(
      nextWeekCurrentDay.getDate() - nextWeekCurrentDay.getDay() + 1
    )
  )
    .toISOString()
    .slice(0, 10);
  // This week friday
  const friday = new Date(
    nextWeekCurrentDay.setDate(
      nextWeekCurrentDay.getDate() - nextWeekCurrentDay.getDay() + 5
    )
  )
    .toISOString()
    .slice(0, 10);
  return {
    monday,
    friday,
  };
};

export const startAndEndOfMonth = () => {
  const today = new Date();

  return {
    firstDay: new Date(today.getFullYear(), today.getMonth(), 2)
      .toISOString()
      .slice(0, 10),
    lastDay: new Date(today.getFullYear(), today.getMonth() + 1, 1)
      .toISOString()
      .slice(0, 10),
  };
};

export const startAndEndOfNextMonth = () => {
  const today = new Date();
  return {
    firstDay: new Date(today.getFullYear(), today.getMonth() + 1, 2)
      .toISOString()
      .slice(0, 10),
    lastDay: new Date(today.getFullYear(), today.getMonth() + 2, 1)
      .toISOString()
      .slice(0, 10),
  };
};

export const generateDatesList = (startDate: Date, endDate: Date) => {
  const date = new Date(startDate.getTime());
  const dates = [];

  while (date <= endDate) {
    dates.push(new Date(date).toISOString().slice(0, 10));
    date.setDate(date.getDate() + 1);
  }

  return dates;
};

export const isWithinDateRange = (
  inputDate: string,
  filterStart: string,
  filterEnd: string
) =>
  Date.parse(inputDate) >= Date.parse(filterStart) &&
  Date.parse(inputDate) <= Date.parse(filterEnd);

export const filterLeaveByDateRange = (
  start: string,
  end: string,
  leaveByUser: Leave[]
) =>
  leaveByUser.filter((leave) => {
    const dateList = generateDatesList(
      new Date(leave.leaveStart),
      new Date(leave.leaveEnd)
    );

    // TODO this is not very efficient and will probably die for a big date range of leave dates
    // Check each leave date if they fall inside the filter range
    let i = 0;
    let found = false;
    do {
      if (isWithinDateRange(dateList[i], start, end)) {
        found = true;
      }
      i++;
    } while (!found && i <= dateList.length);
    return found;
  });

// TODO implement with daily cron job
export const filterLeaveToday = (leaveByUser: Leave[]) => {
  const todayString = new Date().toISOString().slice(0, 10);
  const onLeaveToday = leaveByUser.filter(
    (leave) =>
      Date.parse(todayString) >= Date.parse(leave.leaveStart) &&
      Date.parse(todayString) <= Date.parse(leave.leaveEnd)
  );
};
