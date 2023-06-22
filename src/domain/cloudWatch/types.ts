import { EventBridgeHandler } from "aws-lambda"

export type AlarmStateChangeHandler = EventBridgeHandler<"CloudWatch Alarm State Change", Detail, void>;

type StateValue = 'OK' | 'ALARM' | 'INSUFFICIENT';

interface Detail {
  alarmName: string
  state: State
  previousState: PreviousState
  configuration: Configuration
}

interface State {
  value: StateValue
  reason: string //  'arn:aws:cloudwatch:ap-northeast-1:0000000000:alarm:test2 transitioned to OK at Thursday 22 June, 2023 14:26:01 UTC',
  reasonData: string // '{"triggeringAlarms":[{"arn":"arn:aws:cloudwatch:ap-northeast-1:0000000000:alarm:test2","state":{"value":"OK","timestamp":"2023-06-22T14:26:01.928+0000"}},{"arn":"arn:aws:cloudwatch:ap-northeast-1:0000000000:alarm:test1","state":{"value":"OK","timestamp":"2023-06-22T14:25:30.174+0000"}}]}'
  timestamp: string // yyyy-MM-dd'T'HH:mm:ss.SSS+0000
}

interface PreviousState {
  value: StateValue
  reason: string
  reasonData: string
  timestamp: string
}

interface Configuration {
  alarmRule: string // '(ALARM("arn:aws:cloudwatch:ap-northeast-1:0000000000:alarm:test1") OR ALARM("arn:aws:cloudwatch:ap-northeast-1:0000000000:alarm:test2"))'
}
