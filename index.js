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
          throw new Error('Unrecognized extended queue definition / format! Plugin aborting.');
        }
        if (!qLogicalId) continue;
        qLogicalId += stage;
        cloudformation.Resources[qLogicalId] = createCloudformationDefinitions(opts, stage);
        // TODO: service discovery; see https://github.com/filmaj/arc-plugin-queues-extended/issues/3
        /*
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
        // TODO: should we put anything into cloudformation.Outputs?
      }
      logger.status(`Included ${queues.length} queue(s) in stack.`);
      return cloudformation;
    }
  }
};

// https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-sqs-queue.html
function createCloudformationDefinitions (q, stage) {
  // console.log(JSON.stringify(q, null, 2));
  // All default values below are taken from the above CloudFormation SQS reference doc.
  const queueCfn = {
    Type: 'AWS::SQS::Queue',
    Properties: {
      MessageRetentionPeriod: q.retention || 345600, // 4 days
      ReceiveMessageWaitTimeSeconds: q.polling || 0, // short polling
      VisibilityTimeout: q.timeout || 30 // 30 seconds
    }
  };
  if (q.dlq) {
    // TODO: might be nice to check if the user set up the DLQ in this plugin and error out if they didn't
    queueCfn.DependsOn = `${q.dlq}${stage}`;
    queueCfn.Properties.RedrivePolicy = {
      deadLetterTargetArn: { 'Fn::GetAtt': [ queueCfn.DependsOn, 'Arn' ] },
      maxReceiveCount: 10 // TODO: expose this via an option
    };
  }
  return queueCfn;
}
