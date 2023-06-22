
export const externalModules = [
  'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime ... v2
  'date-fns', // Layrerに入れておきたいモジュール
  'pg',
  'aws-jwt-verify',
  // ↓ sdk v3
  '@aws-sdk/client-cloudwatch',
  '@aws-sdk/client-sns'
]
