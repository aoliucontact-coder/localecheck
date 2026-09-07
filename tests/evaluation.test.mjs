import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreCategories, validateRuleDataset } from '../lib/evaluation.mjs';

const dataset = {
  name: 'rules-dev',
  provenance: 'synthetic',
  split: 'development',
  description: '合成开发集',
  glossary: [{ source: '工作区', target: 'workspace' }],
  cases: [
    {
      id: '1',
      source: '保存',
      target: 'Save',
      context: '按钮',
      expectedCategories: [],
    },
  ],
};

test('valid rule dataset is accepted', () =>
  assert.equal(validateRuleDataset(dataset), dataset));
test('duplicate case ids and labels are rejected', () => {
  assert.throws(() =>
    validateRuleDataset({
      ...dataset,
      cases: [dataset.cases[0], dataset.cases[0]],
    }),
  );
  assert.throws(() =>
    validateRuleDataset({
      ...dataset,
      cases: [{ ...dataset.cases[0], expectedCategories: ['数字', '数字'] }],
    }),
  );
});
test('unknown labels and duplicate glossary sources are rejected', () => {
  assert.throws(() =>
    validateRuleDataset({
      ...dataset,
      cases: [{ ...dataset.cases[0], expectedCategories: ['准确性'] }],
    }),
  );
  assert.throws(() =>
    validateRuleDataset({
      ...dataset,
      glossary: [dataset.glossary[0], dataset.glossary[0]],
    }),
  );
});

test('category scoring counts true, false and missed findings', () => {
  const cases = [
    { expectedCategories: ['数字'] },
    { expectedCategories: ['术语'] },
    { expectedCategories: [] },
  ];
  const predictions = [['数字'], [], ['术语']];
  let index = 0;
  const score = scoreCategories(cases, () => predictions[index++]);
  assert.equal(score.truePositive, 1);
  assert.equal(score.falsePositive, 1);
  assert.equal(score.falseNegative, 1);
  assert.equal(score.precision, 0.5);
  assert.equal(score.recall, 0.5);
  assert.equal(score.f1, 0.5);
  assert.equal(score.falsePositivesPer100Correct, 100);
});

test('zero denominators are reported as not applicable', () => {
  const score = scoreCategories([{ expectedCategories: [] }], () => []);
  assert.equal(score.precision, null);
  assert.equal(score.recall, null);
  assert.equal(score.f1, null);
  assert.equal(score.falsePositivesPer100Correct, 0);
});
