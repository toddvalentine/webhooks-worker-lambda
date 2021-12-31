import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function } from '../myconstructs/function'
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions'
import * as eventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as iam from 'aws-cdk-lib/aws-iam'
import * as cw from 'aws-cdk-lib/aws-cloudwatch'
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions'
import { TreatMissingData } from 'aws-cdk-lib/aws-cloudwatch';

export class vtypeioWebhooksSqsWorkerLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dlq = new sqs.Queue(this, 'vtypeioWebhooksSqsWorkerLambdaDLQ', {
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    const queue = new sqs.Queue(this, 'vtypeioWebhooksSqsWorkerLambdaQueue', {
      visibilityTimeout: cdk.Duration.seconds(300),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
    });

    const topic = new sns.Topic(this, 'webhooksTopic', {
      displayName: 'webhooksTopic'
    })
    topic.addSubscription(new subs.EmailSubscription("servers@vtypeio.com"));

    const topicPolicy = new sns.TopicPolicy(this, 'webhooksTopicPolicy', {
      topics: [topic],
    });
    topicPolicy.document.addStatements(new iam.PolicyStatement({
      actions: ["sns:Publish"],
      principals: [new iam.AnyPrincipal()],
      resources: [topic.topicArn],
    }));

    const staleMsgsMetric = queue.metricApproximateAgeOfOldestMessage({
      period: cdk.Duration.seconds(60),
      statistic: "max"
    })
    const staleMsgsMetricAlarm = new cw.Alarm(this, "staleMsgsMetricAlarm", {
      metric: staleMsgsMetric,
      threshold: 600,
      evaluationPeriods: 1,
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_THRESHOLD
    })
    const staleMsgsTopicAction = new actions.SnsAction(topic);
    staleMsgsMetricAlarm.addAlarmAction(staleMsgsTopicAction);  
    staleMsgsMetricAlarm.addOkAction(staleMsgsTopicAction);

    const dlqTriggeredMetric = dlq.metricApproximateNumberOfMessagesVisible({
      period: cdk.Duration.seconds(60),
      statistic: "sum"
    })
    const dlqTriggeredMetricAlarm = new cw.Alarm(this, "dlqMetricAlarm", {
      metric: dlqTriggeredMetric,
      threshold: 0,
      evaluationPeriods: 1,
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING
    })
    const dlqTriggeredTopicAction = new actions.SnsAction(topic);
    dlqTriggeredMetricAlarm.addAlarmAction(dlqTriggeredTopicAction);  
    dlqTriggeredMetricAlarm.addOkAction(dlqTriggeredTopicAction);

    const fn = new Function(this, 'webhooksFunc', {
      entry: 'go/cmd/worker',
      events: [new eventSources.SqsEventSource(queue, {
        batchSize: 10
      })],
      memorySize: 512
    })    
  }
}
