export const awsAuthConfigure = {
  region: import.meta.env.VITE_APP_AUTH_REGION,
  userPoolId: import.meta.env.VITE_APP_AUTH_USER_POOL_ID,
  userPoolWebClientId: import.meta.env.VITE_APP_AUTH_USER_POOL_WEB_CLIENT_ID,
  authenticationFlowType: 'USER_SRP_AUTH',
}
