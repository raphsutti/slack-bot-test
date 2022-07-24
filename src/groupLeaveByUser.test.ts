import {
  filterLeaveByDateRange,
  filterLeaveByToday,
  generateDatesList,
  groupLeaveByUser,
  isWithinDateRange,
  mondayAndFriday,
  mondayAndFridayNextWeek,
  startAndEndOfMonth,
} from "./groupLeaveByUser";

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe("groupLeaveByUser", () => {
  it("should group all user leaves by user", () => {
    const input = [
      {
        userName: "Arnav",
        leaveEnd: "2022-07-09",
        id: "174a28fc-dc66-4dd1-b3da-bbde727cf0ee",
        userId: "UTF8G6EBA",
        leaveStart: "2022-07-09",
      },
      {
        userName: "Arnav",
        leaveEnd: "2022-08-09",
        id: "174a28fc-dc66-4dd1-b3da-bbde727cf0ee",
        userId: "UTF8G6EBA",
        leaveStart: "2022-08-01",
      },
      {
        userName: "Raph",
        leaveEnd: "2022-07-05",
        id: "85d08639-96a2-4c49-a187-eb0071339248",
        userId: "U03CH0NRR9Q",
        leaveStart: "2022-07-01",
      },
      {
        userName: "Raph",
        leaveEnd: "2022-08-01",
        id: "c69ce278-eb59-409a-a3a0-dc8abd5f62ea",
        userId: "U03CH0NRR9Q",
        leaveStart: "2022-07-01",
      },
      {
        userName: "Raph",
        leaveEnd: "2022-08-03",
        id: "36013823-681f-4422-ab19-2d6e69eabbf3",
        userId: "U03CH0NRR9Q",
        leaveStart: "2022-08-01",
      },
    ];

    const expected = [
      {
        userId: "U03CH0NRR9Q",
        name: "Raph",
        leaveList: [
          { id: "85d08639-96a2-4c49-a187-eb0071339248", leave: "01/07-05/07" },
          { id: "c69ce278-eb59-409a-a3a0-dc8abd5f62ea", leave: "01/07-01/08" },
          { id: "36013823-681f-4422-ab19-2d6e69eabbf3", leave: "01/08-03/08" },
        ],
      },
      {
        userId: "UTF8G6EBA",
        name: "Arnav",
        leaveList: [
          { id: "174a28fc-dc66-4dd1-b3da-bbde727cf0ee", leave: "09/07" },
          { id: "174a28fc-dc66-4dd1-b3da-bbde727cf0ee", leave: "01/08-09/08" },
        ],
      },
    ];

    expect(groupLeaveByUser(input)).toStrictEqual(expected);
  });
});

describe("mondayAndFriday", () => {
  it("should return monday and friday of that week with given system date of Saturday", () => {
    jest.useFakeTimers().setSystemTime(new Date("2022-07-09"));

    const result = mondayAndFriday();
    const expected = { monday: "2022-07-04", friday: "2022-07-08" };

    expect(result).toStrictEqual(expected);
  });

  it("should return monday and friday of that week with given system date of Sunday", () => {
    jest.useFakeTimers().setSystemTime(new Date("2022-07-10"));

    const result = mondayAndFriday();
    const expected = { monday: "2022-07-11", friday: "2022-07-15" };

    expect(result).toStrictEqual(expected);
  });
});

describe("mondayAndFridayNextWeek", () => {
  it("should return monday and friday of next week with given system date of Saturday", () => {
    jest.useFakeTimers().setSystemTime(new Date("2022-07-09"));

    const result = mondayAndFridayNextWeek();
    const expected = { monday: "2022-07-11", friday: "2022-07-15" };

    expect(result).toStrictEqual(expected);
  });

  it("should return monday and friday of next week with given system date of Sunday", () => {
    jest.useFakeTimers().setSystemTime(new Date("2022-07-10"));

    const result = mondayAndFridayNextWeek();
    const expected = { monday: "2022-07-18", friday: "2022-07-22" };

    expect(result).toStrictEqual(expected);
  });
});

describe("startAndEndOfMonth", () => {
  it("should return start and end of month given system date in July", () => {
    jest.useFakeTimers().setSystemTime(new Date("2022-07-09"));

    const result = startAndEndOfMonth();
    const expected = { firstDay: "2022-07-01", lastDay: "2022-07-31" };

    expect(result).toStrictEqual(expected);
  });

  it("should return start and end of month given system date in September", () => {
    jest.useFakeTimers().setSystemTime(new Date("2022-09-30"));

    const result = startAndEndOfMonth();
    const expected = { firstDay: "2022-09-01", lastDay: "2022-09-30" };

    expect(result).toStrictEqual(expected);
  });
});

describe("generateDatesList", () => {
  it("should generate list of dates given date range", () => {
    const result = generateDatesList(
      new Date("2022-12-20"),
      new Date("2022-12-25")
    );
    const expected = [
      "2022-12-20",
      "2022-12-21",
      "2022-12-22",
      "2022-12-23",
      "2022-12-24",
      "2022-12-25",
    ];

    expect(result).toStrictEqual(expected);
  });

  it("should generate list of dates given date range that crosses new month and year", () => {
    const result = generateDatesList(
      new Date("2022-12-31"),
      new Date("2023-01-02")
    );
    const expected = ["2022-12-31", "2023-01-01", "2023-01-02"];

    expect(result).toStrictEqual(expected);
  });
});

describe("isWithinDateRange", () => {
  it("should return true if input date is within date range", () => {
    const result = isWithinDateRange("2022-02-19", "2021-01-02", "2022-03-31");
    expect(result).toBe(true);
  });
  it("should return false if input date is not within date range", () => {
    const result = isWithinDateRange("2025-02-19", "2022-01-02", "2022-03-31");
    expect(result).toBe(false);
  });
});

describe("filterLeaveByToday", () => {
  it("should filter leave range that starts on melbourne today's date", () => {
    // 11pm UTC is 8am next day Melbourne time
    const UTC11PM_PREVIOUS_DAY = "2022-09-05T22:00:00.000Z";
    jest.useFakeTimers().setSystemTime(new Date(UTC11PM_PREVIOUS_DAY));

    const items = [
      {
        userName: "Raph",
        leaveEnd: "2022-09-07",
        id: "cbef9ad9-6afc-4d41-bc74-cb7481384e48",
        userId: "UTF8G6EBA",
        leaveStart: "2022-09-06",
      },
    ];

    const result = filterLeaveByToday(items);
    const expected = [
      {
        id: "cbef9ad9-6afc-4d41-bc74-cb7481384e48",
        leaveEnd: "2022-09-07",
        leaveStart: "2022-09-06",
        userId: "UTF8G6EBA",
        userName: "Raph",
      },
    ];

    expect(result).toStrictEqual(expected);
  });

  it("should filter leave range that ends on today's date", () => {
    jest.useFakeTimers().setSystemTime(new Date("2022-09-06"));
    const items = [
      {
        userName: "Raph",
        leaveEnd: "2022-09-06",
        id: "cbef9ad9-6afc-4d41-bc74-cb7481384e48",
        userId: "UTF8G6EBA",
        leaveStart: "2022-09-05",
      },
    ];

    const result = filterLeaveByToday(items);
    const expected = [
      {
        id: "cbef9ad9-6afc-4d41-bc74-cb7481384e48",
        leaveEnd: "2022-09-06",
        leaveStart: "2022-09-05",
        userId: "UTF8G6EBA",
        userName: "Raph",
      },
    ];

    expect(result).toStrictEqual(expected);
  });

  it("should filter leave range that surrounds on today's date", () => {
    jest.useFakeTimers().setSystemTime(new Date("2022-09-06"));
    const items = [
      {
        userName: "Raph",
        leaveEnd: "2022-09-07",
        id: "cbef9ad9-6afc-4d41-bc74-cb7481384e48",
        userId: "UTF8G6EBA",
        leaveStart: "2022-09-05",
      },
    ];

    const result = filterLeaveByToday(items);
    const expected = [
      {
        id: "cbef9ad9-6afc-4d41-bc74-cb7481384e48",
        leaveEnd: "2022-09-07",
        leaveStart: "2022-09-05",
        userId: "UTF8G6EBA",
        userName: "Raph",
      },
    ];

    expect(result).toStrictEqual(expected);
  });

  it("should not show leave range that is outside of today's date", () => {
    jest.useFakeTimers().setSystemTime(new Date("2022-09-06"));
    const items = [
      {
        userName: "Raph",
        leaveEnd: "2022-09-08",
        id: "cbef9ad9-6afc-4d41-bc74-cb7481384e48",
        userId: "UTF8G6EBA",
        leaveStart: "2022-09-07",
      },
    ];

    const result = filterLeaveByToday(items);

    expect(result).toStrictEqual([]);
  });
});

describe("filterLeaveByDateRange", () => {
  it("should show leave that has leaveStart within date range", () => {
    const items = [
      {
        userName: "Raph",
        leaveEnd: "2022-07-20",
        id: "cbef9ad9-6afc-4d41-bc74-cb7481384e48",
        userId: "UTF8G6EBA",
        leaveStart: "2022-07-08",
      },
      {
        userName: "Raph",
        leaveEnd: "2025-01-30",
        id: "cbef9ad9-6afc-4d41-bc74-cb7481384e48",
        userId: "UTF8G6EBA",
        leaveStart: "2025-01-08",
      },
    ];
    const expected = [
      {
        id: "cbef9ad9-6afc-4d41-bc74-cb7481384e48",
        leaveEnd: "2022-07-20",
        leaveStart: "2022-07-08",
        userId: "UTF8G6EBA",
        userName: "Raph",
      },
    ];
    const result = filterLeaveByDateRange("2022-07-01", "2022-07-09", items);

    expect(result).toStrictEqual(expected);
  });

  it("should show leave that has leaveEnd within date range", () => {
    const items = [
      {
        userName: "Raph",
        leaveEnd: "2022-07-20",
        id: "cbef9ad9-6afc-4d41-bc74-cb7481384e48",
        userId: "UTF8G6EBA",
        leaveStart: "2022-07-18",
      },
      {
        userName: "Raph",
        leaveEnd: "2025-01-30",
        id: "cbef9ad9-6afc-4d41-bc74-cb7481384e48",
        userId: "UTF8G6EBA",
        leaveStart: "2025-01-28",
      },
    ];
    const expected = [
      {
        id: "cbef9ad9-6afc-4d41-bc74-cb7481384e48",
        leaveEnd: "2022-07-20",
        leaveStart: "2022-07-18",
        userId: "UTF8G6EBA",
        userName: "Raph",
      },
    ];
    const result = filterLeaveByDateRange("2022-07-19", "2022-07-21", items);

    expect(result).toStrictEqual(expected);
  });

  it("should show leave that has leaveStart and leaveEnd within date range", () => {
    const items = [
      {
        userName: "Raph",
        leaveEnd: "2022-07-20",
        id: "cbef9ad9-6afc-4d41-bc74-cb7481384e48",
        userId: "UTF8G6EBA",
        leaveStart: "2022-07-08",
      },
      {
        userName: "Raph",
        leaveEnd: "2025-01-30",
        id: "cbef9ad9-6afc-4d41-bc74-cb7481384e48",
        userId: "UTF8G6EBA",
        leaveStart: "2025-01-08",
      },
    ];
    const expected = [
      {
        id: "cbef9ad9-6afc-4d41-bc74-cb7481384e48",
        leaveEnd: "2022-07-20",
        leaveStart: "2022-07-08",
        userId: "UTF8G6EBA",
        userName: "Raph",
      },
    ];
    const result = filterLeaveByDateRange("2022-07-07", "2022-07-21", items);

    expect(result).toStrictEqual(expected);
  });

  it("should show leave that has leaveStart and leaveEnd surround date range", () => {
    const items = [
      {
        userName: "Raph",
        leaveEnd: "2022-07-20",
        id: "cbef9ad9-6afc-4d41-bc74-cb7481384e48",
        userId: "UTF8G6EBA",
        leaveStart: "2022-07-08",
      },
      {
        userName: "Raph",
        leaveEnd: "2025-01-30",
        id: "cbef9ad9-6afc-4d41-bc74-cb7481384e48",
        userId: "UTF8G6EBA",
        leaveStart: "2025-01-08",
      },
    ];
    const expected = [
      {
        id: "cbef9ad9-6afc-4d41-bc74-cb7481384e48",
        leaveEnd: "2022-07-20",
        leaveStart: "2022-07-08",
        userId: "UTF8G6EBA",
        userName: "Raph",
      },
    ];
    const result = filterLeaveByDateRange("2022-07-09", "2022-07-19", items);

    expect(result).toStrictEqual(expected);
  });
});
