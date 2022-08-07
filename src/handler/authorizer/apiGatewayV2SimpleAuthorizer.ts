import { APIGatewayRequestSimpleAuthorizerHandlerV2WithContext } from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

const envList = [
  'COGNITO_UER_POOL_ID',
  'COGNITO_CLIENT_ID',
  'COGNITO_USER_GROUP'
] as const
for (const key of envList) {
  if (!process.env[key]) throw new Error(`environment missing. please add ${key} to environmenet`)
}
const processEnv = process.env as Record<typeof envList[number], string>

const verifier = CognitoJwtVerifier.create({
  userPoolId: processEnv.COGNITO_UER_POOL_ID, // mandatory, can't be overridden upon calling verify
  tokenUse: "id", // needs to be specified here or upon calling verify
  clientId: processEnv.COGNITO_CLIENT_ID, // needs to be specified here or upon calling verify
  groups: "group_0", // optional
  // graceSeconds: 0, // optional
  // scope: "my-api/read", // optional
  // customJwtCheck: (payload, header, jwk) => {}, // optional
});

export type AuthorizedCognitoContext = { cognitoUsername: string, email: string, congnitoUserId: string }

type AuthorizedCognitoContextAllOptional = Partial<AuthorizedCognitoContext>

export const handler: APIGatewayRequestSimpleAuthorizerHandlerV2WithContext<AuthorizedCognitoContextAllOptional> = async (event) => {
  console.log("request:", JSON.stringify(event, undefined, 2));
  const ret = {
    isAuthorized: false,
    context: {}
  };
  if (!event.headers?.authorization) return ret;
  const jwt = event.headers.authorization;
  let payload = null
  try {
    payload = await verifier.verify(jwt, { groups: processEnv.COGNITO_USER_GROUP }); // group_0をgroup_1で 上書きするサンプル
    console.log("Access allowed. JWT payload:");
    return {
      isAuthorized: true,
      context: {
        cognitoUsername: `${payload['cognito:username']}`,
        email: `${payload.email}`,
        congnitoUserId: `${payload.sub}`
      }
    };
  } catch (err) {
    console.error("Access forbidden:", err);
  }
  return ret;
};


// verify後のpayloadの型は以下。
// type IdTokenPayload = {
//   aud: string //"17e4qspqct1l2cuh7s73h13e7s"
//   auth_time: number
//   event_id: string //'a778712b-1e5d-475c-9ab3-edae87faad0c'
//   exp: number
//   iat: number
//   iss: string // 'https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_xxxxxx'
//   jti: string //'2284a3cf-1f21-42fc-943e-3837dfbf24e4'
//   origin_jti: string // 'b31b301f-1df4-1aaa-a01b-33270cf3b839'
//   sub: string // '15949eae-bc0c-459a-af0c-3eca21b4226e'
//   token_use: string // 'id'
//   email: string
//   'cognito:username': string // '15949eae-bc0c-459a-af0c-3eca21b4226e'
//   'cognito:groups': string[]
// }

