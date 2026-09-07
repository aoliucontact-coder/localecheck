import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROMPT_VERSION,
  buildReviewMessages,
  parseReviewResponse,
  validateReviewRequest,
} from '../lib/ai-review.mjs';

const request = {
  rows: [{ id: 'save', source: '保存', target: 'Save', context: '按钮' }],
  context: '协作产品',
  glossary: [{ source: '工作区', target: 'workspace' }],
};

test('valid review request is accepted', () =>
  assert.deepEqual(validateReviewRequest(request), request));
test('invalid rows and duplicate ids are rejected', () => {
  assert.throws(() => validateReviewRequest({ ...request, rows: [] }));
  assert.throws(() =>
    validateReviewRequest({
      ...request,
      rows: [request.rows[0], request.rows[0]],
    }),
  );
  assert.throws(() =>
    validateReviewRequest({
      ...request,
      rows: [{ ...request.rows[0], source: '' }],
    }),
  );
});
test('invalid glossary entries are rejected', () =>
  assert.throws(() =>
    validateReviewRequest({
      ...request,
      glossary: [{ source: '工作区', target: '' }],
    }),
  ));
test('prompt identifies version and treats input as data', () => {
  const messages = buildReviewMessages(request);
  assert.match(
    messages[0].content,
    new RegExp(PROMPT_VERSION.replaceAll('.', '\\.')),
  );
  assert.match(messages[0].content, /untrusted data/);
  assert.equal(JSON.parse(messages[1].content).rows[0].id, 'save');
});
test('valid model response is normalized with provenance', () => {
  const content = JSON.stringify({
    issues: [
      {
        id: 'save',
        category: '准确性',
        severity: '高',
        reason: '操作含义错误',
        evidence: '保存不等于删除',
        suggestion: 'Save',
        needsContext: false,
      },
    ],
  });
  const [issue] = parseReviewResponse(content, new Set(['save']), {
    model: 'test-model',
  });
  assert.equal(issue.origin, 'AI');
  assert.equal(issue.model, 'test-model');
  assert.equal(issue.promptVersion, PROMPT_VERSION);
});
test('unknown ids, categories and inconsistent context responses are rejected', () => {
  const base = {
    id: 'save',
    category: '准确性',
    severity: '高',
    reason: '理由',
    evidence: '依据',
    suggestion: 'Save',
    needsContext: false,
  };
  assert.throws(() =>
    parseReviewResponse(
      JSON.stringify({ issues: [{ ...base, id: 'other' }] }),
      new Set(['save']),
      { model: 'test' },
    ),
  );
  assert.throws(() =>
    parseReviewResponse(
      JSON.stringify({ issues: [{ ...base, category: '安全' }] }),
      new Set(['save']),
      { model: 'test' },
    ),
  );
  assert.throws(() =>
    parseReviewResponse(
      JSON.stringify({
        issues: [{ ...base, category: '语境不足', needsContext: true }],
      }),
      new Set(['save']),
      { model: 'test' },
    ),
  );
});
