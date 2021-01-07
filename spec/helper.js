const url = require('url');
const querystring = require('querystring');

module.exports.eventRequestGenerator = (httpMethod, path, body, headers) => {
  const parsedPath = url.parse(path);
  const queryStringParameters = querystring.parse(parsedPath.query);

  return {
    httpMethod,
    path,
    queryStringParameters,
    requestContext: {
      elb: {
        targetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:213048282442:targetgroup/alb-lambdas/cc86f5e86dba614b',
      },
    },
    headers: {
      accept: '*/*',
      'content-type': 'application/json',
      host: 'alb-example-2043100370.us-east-1.elb.amazonaws.com',
      'x-api-key': 'UGOc3L8CrXK22OC5XuYisQ==:3a64445b636f48f4971089ee7e92e476',
      'x-forwarded-for': '191.6.8.195',
      'x-forwarded-port': '80',
      'x-forwarded-proto': 'http',
      ...headers || {},
    },
    body: body || 'null',
    isBase64Encoded: false,
  };
};
