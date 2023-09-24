const { updater } = require('@architect/utils');
const logger = updater('queues-extended', {});

module.exports = {
  deploy: {
    start: function queueCustomizer ({ arc, cloudformation, stage }) {
      const queues = arc['queues-extended'];
      if (!queues || queues.length === 0) return cloudformation;
      // give queue access to the arc app
      // TODO: if the app already uses @queues, then these are not needed. can we only add them if necessary?
      // maybe we can check if there are more than 0 stock @queues define in the `arc` obj, and if so, assume SQS actions are allowed?
      cloudformation.Resources.Role.Properties.Policies.push({
        PolicyName: 'ExtendedQueuePolicy',
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [ 'sqs:SendMessageBatch', 'sqs:SendMessage', 'sqs:ReceiveMessage', 'sqs:DeleteMessage', 'sqs:GetQueueAttributes' ],
              Resource: '*'
            }
          ]
        }
      });
      for (const q of arc['queues-extended']) {
        let qLogicalId, opts = {};
        switch (typeof q) {
        case 'string':
          qLogicalId = q;
          break;
        case 'object':
          qLogicalId = Object.getOwnPropertyNames(q)[0];
          opts = q[qLogicalId];
          break;
        default:
          logger.error('Unrecognized extended queue definition / format! Plugin aborting.');
          return cloudformation;
        }
        if (!qLogicalId) continue;
        qLogicalId += stage;
        const defns = createCloudformationDefinitions(opts);
        cloudformation.Resources[qLogicalId] = defns.queueCfn;
        // TODO: add a resource for DLQ via defns.dlqCfn
        // TODO: should we put anything into cloudformation.Outputs?
      }
      /*
      cloudformation.Resources[dlq] = {
        Type: 'AWS::SQS::Queue',
        Properties: {
          MessageRetentionPeriod: 1209600, // max (14 days)
          ReceiveMessageWaitTimeSeconds: 20
        }
      }
      cloudformation.Outputs[dlq] = { Description: 'Dead Letter Queue of GitHub usernames', Value: { Ref: dlq } };
      // service discovery for the queue via SSM; allows us to arc.queues.publish()
      cloudformation.Resources[`${queue}Param`] = {
        Type: 'AWS::SSM::Parameter',
        Properties: {
          Type: 'String',
          Name: { 'Fn::Sub': ['/${AWS::StackName}/queues/${queue}', { queue }] },
          Value: { Ref: queue }
        }
      }
      */
      return cloudformation;
    }
  }
};

// https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-sqs-queue.html
function createCloudformationDefinitions (q) {
  console.log(JSON.stringify(q, null, 2));
  // All default values below are taken from the above CloudFormation SQS reference doc.
  const queueCfn = {
    Type: 'AWS::SQS::Queue',
    Properties: {
      MessageRetentionPeriod: q.retention || 345600, // 4 days
      ReceiveMessageWaitTimeSeconds: q.polling || 0, // short polling
      // TODO: DLQ support
      /*
      RedrivePolicy: {
        deadLetterTargetArn: {"Fn::GetAtt": [dlq, 'Arn']},
        maxReceiveCount: 10
      },
      */
      VisibilityTimeout: q.timeout || 30 // 30 seconds
    }
  };
  // TODO: add DLQ as a resource to cfn if exists
  const dlqCfn = {};
  return { queueCfn, dlqCfn };
}
