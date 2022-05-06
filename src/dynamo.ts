import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { v4 as uuidV4 } from "uuid";

const DYNAMO_TABLE = "leave";

// TODO add leave details
interface Leave {
  userName: string;
  leaveStart: string;
  leaveEnd: string;
}

const client = new DocumentClient({ region: "ap-southeast-2" });

export const putDynamoItem = (data: Leave) => {
  const params = {
    TableName: DYNAMO_TABLE,
    Item: {
      ...data,
      id: uuidV4(),
    },
    ReturnConsumedCapacity: "TOTAL",
  };

  client.put(params, function (err, data) {
    if (err) console.log(err);
    else console.log(data);
  });
};

export const scanDynamo = () => {
  client.scan(
    {
      TableName: DYNAMO_TABLE,
    },
    function (err, data) {
      if (err) console.log(err);
      else console.log(data);
    }
  );
};

// Testing
const data: Leave = {
  userName: "rsutti",
  leaveStart: "2022-06-26",
  leaveEnd: "2022-07-30",
};
try {
  // scanDynamo();
  // putDynamoItem(data);
} catch (err) {}
