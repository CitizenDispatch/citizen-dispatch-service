'use strict';

const { graphql } = require('graphql');

const schema = require('../src/schema');

exports.handler = (event, context, callback) => {
  const body = JSON.parse(event.body);
  return graphql(schema, body.query, null, null, body.variables)
  .then(
    result => callback(null, {statusCode: 200, body: JSON.stringify(result), headers: {"Access-Control-Allow-Origin": "*"}}),
    err => {console.log(err), callback(err)}
  )}