# arc-plugin-queues-extended

Add an [SQS queue](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html)
to your arc.codes project, while exposing more of SQS' configurations than the default architect
[`@queues](https://arc.codes/docs/en/reference/project-manifest/queues).

## Features

- Customization of many of SQS' configurations, such as visibility timeouts, message retention and polling times.
  - The main differentiator between this plugin and the default `@queue` implementation in arc is the ability to configure a [long polling queue](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-short-and-long-polling.html#sqs-long-polling). Arc, by default, implements [short polling](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-short-and-long-polling.html#sqs-short-polling), which can eat through [the SQS free tier](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-pricing.html) quickly.
- The ability to set up a [dead-letter queue](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html).

## Configuration

Install this plugin as per the [arc.codes docs](https://arc.codes/docs/en/guides/plugins/overview#finding-%26-installing-plugins).

Then, add a `@queues-extended` section to your `app.arc` file. Each entry under this section will create a new queue.

The following `app.arc` example section will create two queues:
1. a queue with logical ID `overflowQ` with all default settings, and
2. a queue with logical ID `someQ` with a custom message retention period and its dead-letter queue set to the above `overflowQ`

```
@queues-extended
overflowQ
someQ
  retention 69420
  dlq overflowQ
```

The full table of options and configurations follow:

|Option|Description|Default|
|---|---|---|
|`dlq`|Sets up a [dead-letter queue](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html) for the housing queue. The string you provide should match the name of another queue defined using this plugin. For example, if you set `dlq overflowQ` on a `mainQ` defined with this plugin, make sure you add a queue named `overflowQ` under the `@queues-extended` pragma. Failing to do so will cause your `arc deploy` to fail.|Not applicable.|
|`polling`|Sets the queue's [`ReceiveMessageWaitTimeSeconds`](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-sqs-queue.html#cfn-sqs-queue-receivemessagewaittimeseconds) in seconds. Accepts integers between `0` and `20` inclusive. Please carefully read [Amazon SQS short and long polling](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-short-and-long-polling.html) to understand the implications of tweaking this setting. Architect's default `@queues` implementation sets this to `0`, meaning, short polling. Increase this value to reduce the amount of polling SQS will do to collect messages, and thus, have a chance to reduce your bill.|`0` (short polling)|
|`retention`|Sets the queue's [`MessageRetentionPeriod`](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-sqs-queue.html#cfn-sqs-queue-messageretentionperiod) in seconds.|`345600` (4 days)|
|`timeout`|Sets the queue's [`VisibilityTimeout`](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-sqs-queue.html#cfn-sqs-queue-visibilitytimeout) in seconds.|`30` (30 seconds)|
