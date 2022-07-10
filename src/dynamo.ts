import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { v4 as uuidV4 } from "uuid";

const DYNAMO_TABLE = "athena-leave";

// TODO add leave details
// ? add profile pic link
export interface Leave {
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

// TODO use query Dynamo instead
export const scanDynamo = () =>
  client.scan({ TableName: DYNAMO_TABLE }).promise();

export const deleteItemDynamo = (id: string) =>
  client
    .delete({
      TableName: DYNAMO_TABLE,
      Key: {
        id,
      },
    })
    .promise();
