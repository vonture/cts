import { FP, FPVector } from '../../../../util/floating_point.js';
import { sparseScalarF16Range, sparseVectorF16Range } from '../../../../util/math.js';
import { makeCaseCache } from '../case_cache.js';

const remainderVectorScalarInterval = (v: readonly number[], s: number): FPVector => {
  return FP.f16.toVector(v.map(e => FP.f16.remainderInterval(e, s)));
};

const remainderScalarVectorInterval = (s: number, v: readonly number[]): FPVector => {
  return FP.f16.toVector(v.map(e => FP.f16.remainderInterval(s, e)));
};

const scalar_cases = ([true, false] as const)
  .map(nonConst => ({
    [`scalar_${nonConst ? 'non_const' : 'const'}`]: () => {
      return FP.f16.generateScalarPairToIntervalCases(
        sparseScalarF16Range(),
        sparseScalarF16Range(),
        nonConst ? 'unfiltered' : 'finite',
        FP.f16.remainderInterval
      );
    },
  }))
  .reduce((a, b) => ({ ...a, ...b }), {});

const vector_scalar_cases = ([2, 3, 4] as const)
  .flatMap(dim =>
    ([true, false] as const).map(nonConst => ({
      [`vec${dim}_scalar_${nonConst ? 'non_const' : 'const'}`]: () => {
        return FP.f16.generateVectorScalarToVectorCases(
          sparseVectorF16Range(dim),
          sparseScalarF16Range(),
          nonConst ? 'unfiltered' : 'finite',
          remainderVectorScalarInterval
        );
      },
    }))
  )
  .reduce((a, b) => ({ ...a, ...b }), {});

const scalar_vector_cases = ([2, 3, 4] as const)
  .flatMap(dim =>
    ([true, false] as const).map(nonConst => ({
      [`scalar_vec${dim}_${nonConst ? 'non_const' : 'const'}`]: () => {
        return FP.f16.generateScalarVectorToVectorCases(
          sparseScalarF16Range(),
          sparseVectorF16Range(dim),
          nonConst ? 'unfiltered' : 'finite',
          remainderScalarVectorInterval
        );
      },
    }))
  )
  .reduce((a, b) => ({ ...a, ...b }), {});

export const d = makeCaseCache('binary/f16_remainder', {
  ...scalar_cases,
  ...vector_scalar_cases,
  ...scalar_vector_cases,
});
