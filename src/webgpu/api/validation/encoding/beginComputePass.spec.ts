export const description = `
Tests for validation in beginComputePass and GPUComputePassDescriptor as its optional descriptor.
`;

import { makeTestGroup } from '../../../../common/framework/test_group.js';
import { kQueryTypes } from '../../../capability_info.js';
import { ValidationTest } from '../validation_test.js';

class F extends ValidationTest {
  tryComputePass(success: boolean, descriptor: GPUComputePassDescriptor): void {
    const encoder = this.device.createCommandEncoder();
    const computePass = encoder.beginComputePass(descriptor);
    computePass.end();

    this.expectValidationError(() => {
      encoder.finish();
    }, !success);
  }
}

export const g = makeTestGroup(F);

g.test('timestampWrites,same_location')
  .desc(
    `
  Test that entries in timestampWrites do not have the same location in GPUComputePassDescriptor.
  `
  )
  .params(u =>
    u //
      .combine('locationA', ['beginning', 'end'] as const)
      .combine('locationB', ['beginning', 'end'] as const)
  )
  .beforeAllSubcases(t => {
    t.selectDeviceOrSkipTestCase(['timestamp-query']);
  })
  .fn(async t => {
    const { locationA, locationB } = t.params;

    const querySet = t.device.createQuerySet({
      type: 'timestamp',
      count: 2,
    });

    const timestampWriteA = {
      querySet,
      queryIndex: 0,
      location: locationA,
    };

    const timestampWriteB = {
      querySet,
      queryIndex: 1,
      location: locationB,
    };

    const isValid = locationA !== locationB;

    const descriptor = {
      timestampWrites: [timestampWriteA, timestampWriteB],
    };

    t.tryComputePass(isValid, descriptor);
  });

g.test('timestampWrites,query_set_type')
  .desc(
    `
  Test that all entries of the timestampWrites must have type 'timestamp'. If all query types are
  not 'timestamp' in GPUComputePassDescriptor, a validation error should be generated.
  `
  )
  .params(u =>
    u //
      .combine('queryTypeA', kQueryTypes)
      .combine('queryTypeB', kQueryTypes)
  )
  .beforeAllSubcases(t => {
    t.selectDeviceForQueryTypeOrSkipTestCase([
      'timestamp',
      t.params.queryTypeA,
      t.params.queryTypeB,
    ]);
  })
  .fn(async t => {
    const { queryTypeA, queryTypeB } = t.params;

    const timestampWriteA = {
      querySet: t.device.createQuerySet({ type: queryTypeA, count: 1 }),
      queryIndex: 0,
      location: 'beginning' as const,
    };

    const timestampWriteB = {
      querySet: t.device.createQuerySet({ type: queryTypeB, count: 1 }),
      queryIndex: 0,
      location: 'end' as const,
    };

    const isValid = queryTypeA === 'timestamp' && queryTypeB === 'timestamp';

    const descriptor = {
      timestampWrites: [timestampWriteA, timestampWriteB],
    };

    t.tryComputePass(isValid, descriptor);
  });

g.test('timestampWrites,query_index_count')
  .desc(`Test that querySet.count should be greater than timestampWrite.queryIndex.`)
  .params(u => u.combine('queryIndex', [0, 1, 2, 3]))
  .beforeAllSubcases(t => {
    t.selectDeviceOrSkipTestCase(['timestamp-query']);
  })
  .fn(async t => {
    const { queryIndex } = t.params;

    const querySetCount = 2;

    const timestampWrite = {
      querySet: t.device.createQuerySet({ type: 'timestamp', count: querySetCount }),
      queryIndex,
      location: 'beginning' as const,
    };

    const isValid = queryIndex < querySetCount;

    const descriptor = {
      timestampWrites: [timestampWrite],
    };

    t.tryComputePass(isValid, descriptor);
  });
