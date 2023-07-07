export const description = `
Execution tests for the 'clamp' builtin function

S is AbstractInt, i32, or u32
T is S or vecN<S>
@const fn clamp(e: T , low: T, high: T) -> T
Returns min(max(e,low),high). Component-wise when T is a vector.

S is AbstractFloat, f32, f16
T is S or vecN<S>
@const clamp(e: T , low: T , high: T) -> T
Returns either min(max(e,low),high), or the median of the three values e, low, high.
Component-wise when T is a vector.
`;

import { makeTestGroup } from '../../../../../../common/framework/test_group.js';
import { GPUTest } from '../../../../../gpu_test.js';
import { kValue } from '../../../../../util/constants.js';
import { ScalarType, TypeF32, TypeI32, TypeU32 } from '../../../../../util/conversion.js';
import { FP } from '../../../../../util/floating_point.js';
import { sparseF32Range } from '../../../../../util/math.js';
import { makeCaseCache } from '../../case_cache.js';
import { allInputSources, Case, run } from '../../expression.js';

import { builtin } from './builtin.js';

export const g = makeTestGroup(GPUTest);

const u32Values = [kValue.u32.min, 1, 2, 0x70000000, 0x80000000, kValue.u32.max];

const i32Values = [kValue.i32.negative.min, -2, -1, 0, 1, 2, 0x70000000, kValue.i32.positive.max];

export const d = makeCaseCache('clamp', {
  u32_non_const: () => {
    return generateIntegerTestCases(u32Values, TypeU32, 'non-const');
  },
  u32_const: () => {
    return generateIntegerTestCases(u32Values, TypeU32, 'const');
  },
  i32_non_const: () => {
    return generateIntegerTestCases(i32Values, TypeI32, 'non-const');
  },
  i32_const: () => {
    return generateIntegerTestCases(i32Values, TypeI32, 'const');
  },
  f32_const: () => {
    return generateF32TestCases(sparseF32Range(), 'const');
  },
  f32_non_const: () => {
    return generateF32TestCases(sparseF32Range(), 'non-const');
  },
});

/** @returns a set of clamp test cases from an ascending list of integer values */
function generateIntegerTestCases(
  test_values: Array<number>,
  type: ScalarType,
  stage: 'const' | 'non-const'
): Array<Case> {
  const cases = new Array<Case>();
  for (const e of test_values) {
    for (const low of test_values) {
      for (const high of test_values) {
        if (stage === 'const' && low > high) {
          continue; // This would result in a shader compilation error
        }
        cases.push({
          input: [type.create(e), type.create(low), type.create(high)],
          expected: type.create(Math.min(Math.max(e, low), high)),
        });
      }
    }
  }
  return cases;
}

function generateF32TestCases(
  test_values: Array<number>,
  stage: 'const' | 'non-const'
): Array<Case> {
  const cases = new Array<Case>();
  for (const e of test_values) {
    for (const low of test_values) {
      for (const high of test_values) {
        if (stage === 'const' && low > high) {
          continue; // This would result in a shader compilation error
        }
        const c = FP.f32.makeScalarTripleToIntervalCase(
          e,
          low,
          high,
          stage === 'const' ? 'finite' : 'unfiltered',
          ...FP.f32.clampIntervals
        );
        if (c !== undefined) {
          cases.push(c);
        }
      }
    }
  }
  return cases;
}

g.test('abstract_int')
  .specURL('https://www.w3.org/TR/WGSL/#integer-builtin-functions')
  .desc(`abstract int tests`)
  .params(u =>
    u.combine('inputSource', allInputSources).combine('vectorize', [undefined, 2, 3, 4] as const)
  )
  .unimplemented();

g.test('u32')
  .specURL('https://www.w3.org/TR/WGSL/#integer-builtin-functions')
  .desc(`u32 tests`)
  .params(u =>
    u.combine('inputSource', allInputSources).combine('vectorize', [undefined, 2, 3, 4] as const)
  )
  .fn(async t => {
    const cases = await d.get(t.params.inputSource === 'const' ? 'u32_const' : 'u32_non_const');
    await run(t, builtin('clamp'), [TypeU32, TypeU32, TypeU32], TypeU32, t.params, cases);
  });

g.test('i32')
  .specURL('https://www.w3.org/TR/WGSL/#integer-builtin-functions')
  .desc(`i32 tests`)
  .params(u =>
    u.combine('inputSource', allInputSources).combine('vectorize', [undefined, 2, 3, 4] as const)
  )
  .fn(async t => {
    const cases = await d.get(t.params.inputSource === 'const' ? 'i32_const' : 'i32_non_const');
    await run(t, builtin('clamp'), [TypeI32, TypeI32, TypeI32], TypeI32, t.params, cases);
  });

g.test('abstract_float')
  .specURL('https://www.w3.org/TR/WGSL/#float-builtin-functions')
  .desc(`abstract float tests`)
  .params(u =>
    u.combine('inputSource', allInputSources).combine('vectorize', [undefined, 2, 3, 4] as const)
  )
  .unimplemented();

g.test('f32')
  .specURL('https://www.w3.org/TR/WGSL/#float-builtin-functions')
  .desc(`f32 tests`)
  .params(u =>
    u.combine('inputSource', allInputSources).combine('vectorize', [undefined, 2, 3, 4] as const)
  )
  .fn(async t => {
    const cases = await d.get(t.params.inputSource === 'const' ? 'f32_const' : 'f32_non_const');
    await run(t, builtin('clamp'), [TypeF32, TypeF32, TypeF32], TypeF32, t.params, cases);
  });

g.test('f16')
  .specURL('https://www.w3.org/TR/WGSL/#float-builtin-functions')
  .desc(`f16 tests`)
  .params(u =>
    u.combine('inputSource', allInputSources).combine('vectorize', [undefined, 2, 3, 4] as const)
  )
  .unimplemented();
