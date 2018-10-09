// Solves the issue where __typename is sent from the server but not accepted back.
module.exports.removeTypename = ({__typename, ...args}) => args;