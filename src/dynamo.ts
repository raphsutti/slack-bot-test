import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { v4 as uuidV4 } from "uuid";

const DYNAMO_TABLE = "athena-leave";

// TODO add leave details
// ? add profile pic link
interface Leave {
  userId: string;
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

export const scanDynamo = () =>
  client.scan({ TableName: DYNAMO_TABLE }).promise();

// TODO use query Dynamo instead
export const deleteItemDynamo = (id: string) =>
  client
    .delete({
      TableName: DYNAMO_TABLE,
      Key: {
        id,
      },
    })
    .promise();

// Testing
const data: Leave = {
  userName: "rsutti",
  userId: "U03CH0NRR9Q",
  leaveStart: "2022-06-26",
  leaveEnd: "2022-07-30",
};
try {
  // scanDynamo();
  // putDynamoItem(data);
  // deleteItemDynamo("8c84c06b-8bf5-4073-af73-ad97bf982c94");
} catch (err) {}
