const api = require('./api');
exports.handler = async (event, context) => {
  const q = event.queryStringParameters || {};
  const forwarded = {...event, httpMethod:'GET', path:'/api/issue-ads', queryStringParameters:{...q, action:'issueAds'}};
  return api.handler(forwarded, context);
};
