import { AwsRum, AwsRumConfig } from 'aws-rum-web';
let cwr: AwsRum | null = null;
try {
  const config: AwsRumConfig = {
    sessionSampleRate: 1,
    guestRoleArn: import.meta.env.VITE_APP_AWS_RUM_GUEST_ROLE_ARN,
    identityPoolId: import.meta.env.VITE_APP_AWS_RUM_GUEST_IDENTITY_POOL_ID,
    endpoint: import.meta.env.VITE_APP_AWS_RUM_ENDPOINT,
    telemetries: [],
    allowCookies: false,
    enableXRay: false
  };

  const APPLICATION_ID = import.meta.env.VITE_APP_AWS_RUM_APPLICATION_ID;
  const APPLICATION_VERSION = '1.0.0';
  const APPLICATION_REGION = import.meta.env.VITE_APP_AWS_RUM_APPLICATION_REGION;


  const awsRum: AwsRum = new AwsRum(
    APPLICATION_ID,
    APPLICATION_VERSION,
    APPLICATION_REGION,
    config
  );
  cwr = awsRum

} catch (error) {
  // Ignore errors thrown during CloudWatch RUM web client initialization
}
export const getRum = () => {
  return cwr
}
