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

The following `app.arc` example section will create an SQS queue with a custom message retention period:

```
@queues-extended
someQ
  retention 69420
```

The full table of options and configurations follow:

|Option|Description|Default|
|---|---|---|
|`polling`|Sets the queue's [`ReceiveMessageWaitTimeSeconds`](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-sqs-queue.html#cfn-sqs-queue-receivemessagewaittimeseconds) in seconds. Accepts integers between `0` and `20` inclusive. Please carefully read [Amazon SQS short and long polling](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-short-and-long-polling.html) to understand the implications of tweaking this setting. Architect's default `@queues` implementation sets this to `0`, meaning, short polling. Increase this value to reduce the amount of polling SQS will do to collect messages, and thus, have a chance to reduce your bill.|`0` (short polling)|
|`retention`|Sets the queue's [`MessageRetentionPeriod`](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-sqs-queue.html#cfn-sqs-queue-messageretentionperiod) in seconds.|`345600` (4 days)|
|`timeout`|Sets the queue's [`VisibilityTimeout`](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-sqs-queue.html#cfn-sqs-queue-visibilitytimeout) in seconds.|`30` (30 seconds)|
