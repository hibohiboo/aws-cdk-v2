import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { Handler } from "aws-lambda";

export const handler: Handler = async (event, context) => {
  const envList = ['AWS_REGION', 'compositeAlarmName'] as const;
  envList.forEach(k => { if (!process.env[k]) throw new Error(`${k} environment required`) });
  const processEnv = process.env as Record<typeof envList[number], string>;

  const client = new CloudWatchClient({ region: processEnv.AWS_REGION });
  const compositeAlarmCommand = new DescribeAlarmsCommand({
    AlarmNames: [processEnv.compositeAlarmName],
    AlarmTypes: ['CompositeAlarm']
  })
  const compositeResult = await client.send(compositeAlarmCommand);
  console.log('composite', compositeResult);

  const alarmCommand = new DescribeAlarmsCommand({
    AlarmNamePrefix: 'test'
  });
  const alarmResult = await client.send(alarmCommand);
  console.log('alarms', alarmResult);
}