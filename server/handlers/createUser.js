'use strict';

const dynamoDbLib = require('../src/dynamoDbLib');
const { success, failure } = require('../src/responseLib');

// This is called when Cognito receives a signup request (and assigns a user id aka sub)
exports.handler = async (event, context, callback) => {
  try {
    const username = event.request.userAttributes.username
    await dynamoDbLib.upsert('users', 'username', username, {})
    callback(null, event);
  } catch (e) {
    console.log("Could not create user record: ", e);
    callback(`Could not create user record: ${e}`);
  }
}