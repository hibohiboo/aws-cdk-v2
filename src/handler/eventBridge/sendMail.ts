
import { AlarmStateChangeHandler } from "@/domain/cloudWatch/types";
import { sendEMailMessage } from "@/domain/sns";

export const handler: AlarmStateChangeHandler = async (event, context) => {
  console.log(event);
  const [arn, partition, service, region, accountId, resourceId] = context.invokedFunctionArn.split(':');
  const envList = ['snsTopic', 'AWS_REGION'] as const;
  envList.forEach(k => { if (!process.env[k]) throw new Error(`${k} environment required`) });
  const processEnv = process.env as Record<typeof envList[number], string>;
  await sendEMailMessage({ account: accountId, region: processEnv.AWS_REGION, snsTopic: processEnv.snsTopic, subject: '件名テスト', message: '本文テスト' })
}