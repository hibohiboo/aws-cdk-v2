import { Aspects, Stack, StackProps, Tag } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_logs as logs } from 'aws-cdk-lib';
import logGroups from '../constants/log-groups.json';

export class CdkV2LogRetentionStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    logGroups.forEach((name => {
      // https://stackoverflow.com/questions/67212678/list-all-loggroups-using-cdk
      const logRetention = new logs.LogRetention(this, `log-retention-${name}`, {
        logGroupName: name,
        retention: logs.RetentionDays.TWO_MONTHS
      });
    }))


    // 作成したリソース全てにタグをつける
    Aspects.of(this).add(new Tag('Stack', id));
  }
}
