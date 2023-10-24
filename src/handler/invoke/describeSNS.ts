import { Handler } from 'aws-lambda';

export const handler: Handler = async (event, context) => {
  console.log(JSON.stringify(event));
  // テストイベント
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
  // S3コピーイベント
  //   {
  //     "Records": [
  //         {
  //             "EventSource": "aws:sns",
  //             "EventVersion": "1.0",
  //             "EventSubscriptionArn": "arn:aws:sns:ap-northeast-1:000000000:aws-cdk-v2-samples-s3-filter-topic:d2999460-254f-404d-ad44-2cca1bdb9e79",
  //             "Sns": {
  //                 "Type": "Notification",
  //                 "MessageId": "3d5a09c3-4288-5d7d-8df5-547200ecd4ed",
  //                 "TopicArn": "arn:aws:sns:ap-northeast-1:000000000:aws-cdk-v2-samples-s3-filter-topic",
  //                 "Subject": "Amazon S3 Notification",
  //                 "Message": "{\"Records\":[{\"eventVersion\":\"2.1\",\"eventSource\":\"aws:s3\",\"awsRegion\":\"ap-northeast-1\",\"eventTime\":\"2023-10-24T03:55:16.105Z\",\"eventName\":\"ObjectCreated:Copy\",\"userIdentity\":{\"principalId\":\"AWS:AIDAX2O364LUGD67CDKTY\"},\"requestParameters\":{\"sourceIPAddress\":\"133.226.1.27\"},\"responseElements\":{\"x-amz-request-id\":\"KRRA75VHDM28RQJM\",\"x-amz-id-2\":\"axwHKBLXEDUj2nuYA8F/fDqBMI/fVIpyGPlRx8dxHCEj1xiXWnsagV1JkxbBbtv5Eq0RY0k+AzuWijGN/ib4nQrNlgmtV2yZ\"},\"s3\":{\"s3SchemaVersion\":\"1.0\",\"configurationId\":\"ZTQ5NzVlZmItYjkwYi00YTNiLTk5ODMtZTIzMzk1MGJjYmQz\",\"bucket\":{\"name\":\"aws-cdk-v2-samples-s3-filter-bucket\",\"ownerIdentity\":{\"principalId\":\"A33EP3QCQB2R71\"},\"arn\":\"arn:aws:s3:::aws-cdk-v2-samples-s3-filter-bucket\"},\"object\":{\"key\":\"ptest/rename.txt\",\"size\":0,\"eTag\":\"d41d8cd98f00b204e9800998ecf8427e\",\"sequencer\":\"006537402411D53368\"}}}]}",
  //                 "Timestamp": "2023-10-24T03:55:16.973Z",
  //                 "SignatureVersion": "1",
  //                 "Signature": "euFZ4V5BkaC+zDeqPHgyrKGSQAi4ExxXlaZO6F1gt8CE8HrqLAueHYV7H75StF5Fh5nCndkBcsT4QvE8D5LzBTikYJYiULEfn5xBMx+FnzGYUk0Byrt07PrTURj5ewPEkjHfnEXm3dNnuoNOstebopwLOIOdqH7cxeKP2kA9UauCcuK7SQPvRmoR8m1ja4aDPjFcCjvACHLONwx9PQUV9T2zV+BDuVNP/yiFS/GAN2b4EQnwz7gsVyGauL94P7LVF2W4y4owF/ldWfuOVreeLbrlqYab8GvkPI50o4jgZoZ5R/c5MMc9+z/5N5IZuK0L86wOZkJ3iPFZ2cJTXG17zA==",
  //                 "SigningCertUrl": "https://sns.ap-northeast-1.amazonaws.com/SimpleNotificationService-01d088a6f77103d0fe307c0069e40ed6.pem",
  //                 "UnsubscribeUrl": "https://sns.ap-northeast-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:ap-northeast-1:000000000:aws-cdk-v2-samples-s3-filter-topic:d2999460-254f-404d-ad44-2cca1bdb9e79",
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
