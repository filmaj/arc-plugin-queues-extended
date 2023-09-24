const plugin = require('../index.js');

const baseCfn = {
  Resources: {
    Role: {
      Properties: {
        Policies: []
      }
    }
  }
};

describe('@queues-extended plugin', () => {

  describe('deploy::', () => {

    describe('start()', () => {
      const start = plugin.deploy.start;

      it('should return unmodified cloudformation if `@queues-extended` not present in arc file', () => {
        const cfn = { ...baseCfn };
        const out = start({ arc: {}, cloudformation: cfn });
        expect(out).toEqual(cfn);
      });

      it('should return unmodified cloudformation if `@queues-extended` defines no queues arc file', () => {
        const cfn = { ...baseCfn };
        const out = start({ arc: { 'queues-extended': [] }, cloudformation: cfn });
        expect(out).toEqual(cfn);
      });

      it('should define a queue with all default parameters if only a queue name is provided', () => {
        const cfn = { ...baseCfn };
        const out = start({ arc: { 'queues-extended': [ 'q' ] }, cloudformation: cfn, stage: 'test' });
        expect(out.Resources.qtest).toEqual({
          Type: 'AWS::SQS::Queue',
          Properties: {
            MessageRetentionPeriod: 345600,
            ReceiveMessageWaitTimeSeconds: 0,
            VisibilityTimeout: 30
          }
        });
      });

      describe('queue configurations', () => {
        it('should allow specifying MessageRetentionPeriod via `retention`', () => {
          const cfn = { ...baseCfn };
          const out = start({ arc: { 'queues-extended': [ { q: { retention: 420 } } ] }, cloudformation: cfn, stage: 'test' });
          expect(out.Resources.qtest.Properties.MessageRetentionPeriod).toEqual(420);
        });
        it('should allow specifying ReceiveMessageWaitTimeSeconds via `polling`', () => {
          const cfn = { ...baseCfn };
          const out = start({ arc: { 'queues-extended': [ { q: { polling: 4 } } ] }, cloudformation: cfn, stage: 'test' });
          expect(out.Resources.qtest.Properties.ReceiveMessageWaitTimeSeconds).toEqual(4);
        });
        it('should allow specifying VisibilityTimeout via `timeout`', () => {
          const cfn = { ...baseCfn };
          const out = start({ arc: { 'queues-extended': [ { q: { timeout: 420 } } ] }, cloudformation: cfn, stage: 'test' });
          expect(out.Resources.qtest.Properties.VisibilityTimeout).toEqual(420);
        });
      });
    });
  });
});
