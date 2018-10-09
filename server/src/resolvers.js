//
// DDB
// 

const AWS = require('aws-sdk');
const update = require('update-immutable').default;
const uuid = require('uuid');
const filterEmptyValues = require('./filterEmptyValues');
const dynamodbUpdateExpression = require('dynamodb-update-expression');
const geolib = require('geolib');

// The new, better way to make ddb requests (instead of promisify)
const dynamoDbLib = require('../src/dynamoDbLib');

let dynamoDb;

// For use with serverless-offline and dynamodb-local
if (process.env.IS_OFFLINE) {
  const credentials = new AWS.SharedIniFileCredentials({ profile: 'personal' });
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
  console.log("Using dynamodb on AWS");
  dynamoDb = new AWS.DynamoDB.DocumentClient();
}

const tableFor = (tableName) => `citizen-dispatch-dev-${tableName}`

const promisify = foo => new Promise((resolve, reject) => {
  foo((error, result) => {
    if (error) {
      reject(error)
    } else {
      resolve(result)
    }
  })
})

//
// SYSTEM INFORMATION
//

exports.getSystemInformation = async (queryFields = {}) => {
  const response = {}
  if ('requestEpicenter' in queryFields) {
    const requests = await exports.getRequests();
    if (!requests || requests.length === 0) {
      response.requestEpicenter = { latitude: 5, longitude: 34, timestamp: Date.now() }
    } else {
      response.requestEpicenter = geolib.getCenter(requests);
      response.requestEpicenter.timestamp = Date.now();
    }
    return response;
  }
}

// 
// REQUESTS
//

exports.getRequest = ({ id }, queryFields = {}) => {
  return dynamoDbLib.getOne('requests', { 'id': id })
    .then(async record => {

      const newRecord = Object.assign({}, record);

      if ('team' in queryFields) {
        if (record.teamId) {
          newRecord.team = await exports.getTeam({ id: record.teamId }, queryFields.team)
        } else {
          newRecord.team = null;
        }
      }

      if ('dispatch' in queryFields) {
        if (record.dispatchId) {
          newRecord.dispatch = await exports.getDispatch({ id: record.dispatchId }, queryFields.dispatch)
        } else {
          newRecord.dispatch = null;
        }
      }

      if ('user' in queryFields) {
        if (record.userId) {
          newRecord.user = await exports.getDispatch({ id: record.userId }, queryFields.user)
        } else {
          newRecord.user = null;
        }
      }

      console.log('Returning request record:', newRecord);
      return newRecord;
    })
}

exports.createRequest = ({ request }) => {
  console.log("Creating request:", request)
  const newRequest = update(request, { id: { $set: uuid.v1() }, createdAt: { $set: Date.now() } })
  return promisify(callback =>
    dynamoDb.put({
      TableName: tableFor('requests'),
      Item: filterEmptyValues(newRequest),
    }, callback))
    .then(() => exports.getRequest(newRequest))
    .catch(err => console.log(err));
}

exports.assignRequest = ({ requestId, teamId, dispatchId }) => {
  dynamoDbLib.upsert('requests', 'id', requestId, { teamId, dispatchId })
  // dynamoDbLib.removeAttributes('requests', 'id', requestId, ['teamId'])
  }

exports.updateRequestStatus = ({ requestId, status }) => (
  dynamoDbLib.upsert('requests', 'id', requestId, { status })
)

// 
// USERS
// 

exports.getUser = ({ id }, queryFields = {}) => dynamoDbLib.getOne('users', { id })
  .then(item => {
    if (!item) return item;

    // Retrieve & append dispatch and team records if queried, passing the nested query fields
    const newItem = Object.assign({}, item);
    if (('dispatch' in queryFields) && item.dispatchId) {
      newItem.dispatch = exports.getDispatch({ id: item.dispatchId }, queryFields.dispatch)
    }
    if (('team' in queryFields) && item.teamId) {
      newItem.team = exports.getTeam({ id: item.teamId }, queryFields.team)
    }
    // TODO: fix the repeated query to the location table here
    if ('locationHistory' in queryFields) newItem.locationHistory = exports.getUserLocationHistory({ id: item.id });
    if ('location' in queryFields) newItem.location = exports.getUserLocation({ id: item.id })
    return newItem;
  })

// exports.getUser = async ({ id }) => {
//   const locationHistory = await exports.getUserLocationHistory({ id })
// }

exports.getUserLocationHistory = ({ id }) => {
  console.log("Location history for id", id)
  const params = {
    TableName: 'citizen-dispatch-dev-userLocations',
    KeyConditionExpression: '#id = :id',
    ExpressionAttributeValues: {
      ':id': id
    },
    ExpressionAttributeNames: {
      '#id': "id"
    },
    Select: 'ALL_ATTRIBUTES'
  }
  return dynamoDbLib.call('query', params)
    .then(result => result.Items)
}

exports.getUserLocation = ({ id }) => (
  exports.getUserLocationHistory({ id })
    .then(locations => locations[locations.length - 1])
)

// Non-standard upsert
exports.upsertUser = ({ id, ...fields }) => {
  const params = Object.assign({
    TableName: tableFor('users'),
    Key: { id: id }, // It will always have an id since it's generated by cognito
    ReturnValues: 'ALL_NEW'
  }, dynamodbUpdateExpression.getUpdateExpression({}, fields))
  return dynamoDbLib.call('update', params)
    .then(result => result.Attributes)
}

exports.assignUser = ({ userId, teamId, dispatchId }) => {
  dynamoDbLib.upsert('users', 'id', userId, { teamId, dispatchId })
}

// 
// STANDARD GETS
//

// TODO: fetch extra query fields
exports.getDispatch = ({ id }) => dynamoDbLib.getOne('dispatches', { id })

exports.getTeam = ({ id }, queryFields) => dynamoDbLib.getOne('teams', { id })
  .then(record => {
    if (!record) return record;

    // Retrieve & append dispatch and team records if queried, passing the nested query fields
    const newRecord = Object.assign({}, record);
    if (('dispatch' in queryFields) && record.dispatchId) {
      newRecord.dispatch = exports.getDispatch({ id: record.dispatchId }, queryFields.dispatch)
    }
    return newRecord;
})

exports.getRequests = (queryFields = {}) => (dynamoDbLib.getAll('requests')
  .then(records => {
    console.log("queryfields", queryFields)
    if (!records) return records;
    const newRecords = Promise.all(records.map (record => {
      let result = Promise.resolve(record);
      if ('team' in queryFields && record.teamId) {
        result = result
          .then(record => exports.getTeam({ id: record.teamId }, queryFields.team)
          .then(team => Object.assign({}, record, {team})))
      }
      if ('dispatch' in queryFields && record.dispatchId) {
        result = result
          .then(record => exports.getDispatch({ id: record.dispatchId }, queryFields.dispatch)
          .then(dispatch => Object.assign({}, record, {dispatch})))
      }
      if ('user' in queryFields && record.userId) {
        result = result
          .then(record => exports.getUser({ id: record.userId }, queryFields.user)
          .then(user => Object.assign({}, record, {user})))
      }
      return result;
    }))
    return newRecords;
  }));

exports.getDispatches = () => dynamoDbLib.getAll('dispatches');

exports.getTeams = (queryFields = {}) => (dynamoDbLib.getAll('teams')
  .then(records => {
    if (!records) return records;
    let newRecords = records.slice();
    if ('leader' in queryFields) {
      newRecords = newRecords.map(async record => {
        if (record.leaderId) {
          const leader = await exports.getUser({ id: record.leaderId }, queryFields.leader)
          return Object.assign({}, record, {leader})
        } else {
          return record;
        }
      })
    }
    return newRecords;
  }));

//
// STANDARD UPSERTS
//

exports.upsertRequest = ({ id, ...fields }) => dynamoDbLib.upsert('requests', 'id', id, fields);
exports.upsertDispatch = ({ id, ...fields }) => dynamoDbLib.upsert('dispatches', 'id', id, fields);
exports.upsertTeam = ({ id, ...fields }) => dynamoDbLib.upsert('teams', 'id', id, fields);