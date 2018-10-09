'use strict';

const dynamoDbLib = require('../src/dynamoDbLib');
const { success, failure } = require('../src/responseLib');

exports.handler = async (event, context, callback) => {

  let id;
  const body = JSON.parse(event.body);

  try {
    if (event.isOffline) {
      id = body.id;
    } else {
      id = event.requestContext.authorizer.claims['cognito:username'];
    }
    console.log('Received request from user:', id)
  } catch (e) {
    console.log("reportLocation could not determine caller username: ", e);
  }
  
  // Number of seconds the record should be left in DDB table
  const millisecondsTtl = 86400000;

  const params = {
    TableName: "citizen-dispatch-dev-userLocations",
    Item: {
      id,
      timestamp: Date.now(),
      latitude: body.latitude,
      longitude: body.longitude,
      expiresAt: Date.now() + millisecondsTtl
    }
  };

  try {
    await dynamoDbLib.call("put", params);
    callback(null, success(params.Item));
  } catch (e) {
    console.log("Error in DDB Put:", e)
    callback(null, failure({ status: false }));
  }
}