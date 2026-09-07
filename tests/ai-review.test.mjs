import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROMPT_VERSION,
  buildReviewMessages,
  parseReviewResponse,
  parseProviderUsage,
  readBoundedText,
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
test('review request ids are trimmed before duplicate validation', () => {
  assert.equal(
    validateReviewRequest({
      ...request,
      rows: [{ ...request.rows[0], id: ' save ' }],
    }).rows[0].id,
    'save',
  );
  assert.throws(() =>
    validateReviewRequest({
      ...request,
      rows: [request.rows[0], { ...request.rows[0], id: ' save ' }],
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
test('duplicate glossary sources are rejected after trimming', () =>
  assert.throws(() =>
    validateReviewRequest({
      ...request,
      glossary: [
        { source: '工作区', target: 'workspace' },
        { source: ' 工作区 ', target: 'space' },
      ],
    }),
  ));
test('bounded response reader accepts small UTF-8 responses', async () =>
  assert.equal(await readBoundedText(new Response('中文'), 6), '中文'));
test('bounded response reader rejects declared and streamed oversize responses', async () => {
  await assert.rejects(
    readBoundedText(
      new Response('small', { headers: { 'content-length': '11' } }),
      10,
    ),
    /too large/,
  );
  await assert.rejects(
    readBoundedText(new Response('中'.repeat(4)), 10),
    /too large/,
  );
});
test('bounded response reader rejects malformed UTF-8', async () => {
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(Uint8Array.from([0xc3, 0x28]));
      controller.close();
    },
  });
  await assert.rejects(readBoundedText(new Response(body)));
});
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
  assert.throws(() =>
    parseReviewResponse(
      JSON.stringify({
        issues: [
          {
            ...base,
            category: '语境不足',
            needsContext: false,
            suggestion: '',
          },
        ],
      }),
      new Set(['save']),
      { model: 'test' },
    ),
  );
});
test('model content limit counts UTF-8 bytes', () =>
  assert.throws(() =>
    parseReviewResponse('中'.repeat(400000), new Set(['save']), {
      model: 'test',
    }),
  ));
test('provider token usage is normalized across compatible field names', () => {
  assert.deepEqual(
    parseProviderUsage({
      prompt_tokens: 10,
      completion_tokens: 4,
      total_tokens: 14,
    }),
    { inputTokens: 10, outputTokens: 4, totalTokens: 14 },
  );
  assert.deepEqual(parseProviderUsage({ input_tokens: 3, output_tokens: 2 }), {
    inputTokens: 3,
    outputTokens: 2,
    totalTokens: 5,
  });
});
test('missing or inconsistent provider usage is ignored', () => {
  assert.equal(parseProviderUsage(undefined), null);
  assert.equal(
    parseProviderUsage({
      prompt_tokens: 10,
      completion_tokens: 4,
      total_tokens: 2,
    }),
    null,
  );
  assert.equal(
    parseProviderUsage({ prompt_tokens: -1, completion_tokens: 4 }),
    null,
  );
});
