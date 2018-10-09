const AWS = require('aws-sdk');
const uuid = require('uuid');
const dynamodbUpdateExpression = require('dynamodb-update-expression');

let dynamoDb;

// For use with serverless-offline and dynamodb-local
if (process.env.IS_OFFLINE) {
  const credentials = new AWS.SharedIniFileCredentials({profile: 'personal'});
  AWS.config.credentials = credentials;
  AWS.config.region = 'us-east-1';
}

if (process.env.STAGE === 'local') {
  console.log("Using dynamodb-local");
  dynamoDb = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  });
} else {
  console.log("Using dynamodb within AWS");
  dynamoDb = new AWS.DynamoDB.DocumentClient();
}

const tableFor = (tableName) => `citizen-dispatch-dev-${tableName}`

exports.call = (action, params) => {
  return dynamoDb[action](params).promise();
}

exports.upsert = (tableName, keyName, keyValue, fields) => {
  const params = Object.assign({
    TableName: tableFor(tableName),
    Key: { [keyName] : keyValue || uuid.v1() }, // Generate a new id (create a record) if non-existent
    ReturnValues: 'ALL_NEW'
  }, dynamodbUpdateExpression.getUpdateExpression({}, fields))
  console.log('Upsert Params', params);
  return exports.call('update', params)
    .then(result => result.Attributes)
}

exports.removeAttributes = (tableName, keyName, keyValue, fields) => {
  const params = Object.assign({
    TableName: tableFor(tableName),
    Key: { [keyName] : keyValue },
    ReturnValues: 'ALL_NEW',
    UpdateExpression: 'REMOVE ' + fields.join(', ')
  })
  console.log('RemoveAttributes params', params)
  return exports.call('update', params)
    .then(result => result.Attributes)
}

exports.getOne = (tableName, keyObject) => {
  const params = {
        TableName: tableFor(tableName),
        Key: keyObject, // ie { 'id': id }
      }
  return exports.call('get', params)
      .then(result => result.Item);
}

exports.getAll = (tableName) => {
  const params = {
        TableName: tableFor(tableName),
        Select: "ALL_ATTRIBUTES"
      }
  return exports.call('scan', params)
    .then(result => result.Items);
}

exports.delete = (tableName, keyObject) => {
  const params = {
        TableName: tableFor(tableName),
        Key: keyObject, // ie { 'id': id }
      };
  return exports.call('delete', params);
}