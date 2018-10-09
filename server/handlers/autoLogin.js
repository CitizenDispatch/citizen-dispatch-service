exports.handler = async (event, context, callback) => {
  event.response.issueTokens = true;
  event.response.failAuthentication = false;
  callback(null, event);
};