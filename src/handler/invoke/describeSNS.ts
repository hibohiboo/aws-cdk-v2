import { Handler } from 'aws-lambda';

export const handler: Handler = async (event, context) => {
  console.log(JSON.stringify(event));
  //   {
  //     "Records": [
  //         {
  //             "EventSource": "aws:sns",
  //             "EventVersion": "1.0",
  //             "EventSubscriptionArn": "arn:aws:sns:ap-northeast-1:000000000:aws-cdk-v2-samples-s3-filter-topic:bc96209a-a476-40bd-8028-ca8c9592e110",
  //             "Sns": {
  //                 "Type": "Notification",
  //                 "MessageId": "3708696c-2632-51e2-8a90-34dd1861bf79",
  //                 "TopicArn": "arn:aws:sns:ap-northeast-1:000000000:aws-cdk-v2-samples-s3-filter-topic",
  //                 "Subject": "Amazon S3 Notification",
  //                 "Message": "{\"Service\":\"Amazon S3\",\"Event\":\"s3:TestEvent\",\"Time\":\"2023-10-24T03:37:55.685Z\",\"Bucket\":\"aws-cdk-v2-samples-s3-filter-bucket\",\"RequestId\":\"6VX914VY4C1ND23X\",\"HostId\":\"a08xxnRDcAfHhLQt7/m7WyIREzGqj6tL0Av2Y/E/yAXmNyDzRxjFqVQkG22y02KUIXXWGVabMjI=\"}",
  //                 "Timestamp": "2023-10-24T03:37:55.706Z",
  //                 "SignatureVersion": "1",
  //                 "Signature": "jYBh8Pvvfwmtwv7EOD+f8q/J+SXFAPKCoGcTTrTd0zHtwHR37GPXgbdoQVF1wX31RNUN3hlstujdDcVsW+JdeKyKGaMZpamBYG4Ff42knVxHmaIoY04D8UmDFECVziiGla204N9UkCoQQ7BMEl3N4j+ZTm22hBG1AXhxZ3OBgIEFICMjFL/qkDOhDEwRPOHQhYIPBMDymJZH17DXN8CyYAXmXm/9GpJ1C0uPZRXyZHkbXPFc9Tq9MFBsfsAB1/V1dY9KWeakQNTilAos+Xyv0niLv+fNh3r03b3/+LgZGXk9Ny21q9rP8GIqIW4qOdlwCN8JVhynYMKK/gFeRZ9mOQ==",
  //                 "SigningCertUrl": "https://sns.ap-northeast-1.amazonaws.com/SimpleNotificationService-01d088a6f77103d0fe307c0069e40ed6.pem",
  //                 "UnsubscribeUrl": "https://sns.ap-northeast-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:ap-northeast-1:000000000:aws-cdk-v2-samples-s3-filter-topic:bc96209a-a476-40bd-8028-ca8c9592e110",
  //                 "MessageAttributes": {}
  //             }
  //         }
  //     ]
  // }
  // console.log(context);
  // {
  //   callbackWaitsForEmptyEventLoop: [Getter/Setter],
  //   succeed: [Function (anonymous)],
  //   fail: [Function (anonymous)],
  //   done: [Function (anonymous)],
  //   functionVersion: '$LATEST',
  //   functionName: 's3-filter-sns-subscription',
  //   memoryLimitInMB: '128',
  //   logGroupName: '/aws/lambda/s3-filter-sns-subscription',
  //   logStreamName: '2023/10/24/[$LATEST]863e50c0c5fc44beb76f467d7bae7dbb',
  //   clientContext: undefined,
  //   identity: undefined,
  //   invokedFunctionArn: 'arn:aws:lambda:ap-northeast-1:000000000:function:s3-filter-sns-subscription',
  //   awsRequestId: '7f28093a-7417-44ab-bac4-8b5534bfde68',
  //   getRemainingTimeInMillis: [Function: getRemainingTimeInMillis]
  // }
};
