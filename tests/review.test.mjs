import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeUTF8,
  parseCSV,
  exportCSV,
  reviewRows,
  finalRows,
} from '../lib/review.mjs';
test('strict UTF-8 decoding accepts valid text and rejects malformed bytes', () => {
  assert.equal(decodeUTF8(new TextEncoder().encode('中文')), '中文');
  assert.throws(() => decodeUTF8(Uint8Array.from([0xc3, 0x28])), /UTF-8/);
});
test('strict UTF-8 decoding applies the byte limit before decoding', () =>
  assert.throws(() => decodeUTF8(new Uint8Array(1_000_001)), /1 MB/));
test('quoted CSV round trip', () => {
  const r = parseCSV(
    '\ufeffid,source,target,context\r\n1,"你好,世界","Hello ""world""","a\nb"\r\n',
  );
  assert.equal(r[0].target, 'Hello "world"');
  assert.deepEqual(parseCSV(exportCSV(r)), r);
});
test('invalid CSV and duplicate IDs', () => {
  for (const s of [
    'id,source,target\n1,a,"bad',
    'id,source,target\n1,a,b\n1,c,d',
    'id,source,target\n,a,b',
    'id,source,target\n1,a,b,x',
    'id,source,target\n1,a,b"c',
  ])
    assert.throws(() => parseCSV(s));
});
test('100 row limit', () =>
  assert.throws(() =>
    parseCSV(
      'id,source,target\n' +
        Array.from({ length: 101 }, (_, i) => `${i},a,b`).join('\n'),
    ),
  ));
test('1 MB limit counts UTF-8 bytes, not JavaScript characters', () =>
  assert.throws(
    () => parseCSV(`id,source,target\n1,${'中'.repeat(400000)},x`),
    /1 MB/,
  ));
test('normalized and repeated numbers', () => {
  assert.equal(
    reviewRows([{ id: '1', source: '1,000个', target: '1000 items' }], [])
      .length,
    0,
  );
  assert.equal(
    reviewRows([{ id: '1', source: '30天', target: '3 days' }], [])[0].category,
    '数字',
  );
  assert.ok(reviewRows([{ id: '1', source: '2和2', target: '2' }], []).length);
});
test('ASCII, Unicode and full-width number signs are compared', () => {
  assert.equal(
    reviewRows([{ id: '1', source: '−5°C', target: '-5°C' }], []).length,
    0,
  );
  assert.equal(
    reviewRows([{ id: '1', source: '＋5', target: '+5' }], []).length,
    0,
  );
  assert.equal(
    reviewRows([{ id: '1', source: '−5°C', target: '5°C' }], [])[0].category,
    '数字',
  );
  assert.equal(
    reviewRows([{ id: '1', source: '+5', target: '-5' }], [])[0].category,
    '数字',
  );
});
test('full-width numeric forms are normalized without hiding value changes', () => {
  assert.equal(
    reviewRows([{ id: '1', source: '进度 ７５％', target: 'Progress 75%' }], [])
      .length,
    0,
  );
  assert.equal(
    reviewRows([{ id: '1', source: '版本 ２．５', target: 'Version 2.5' }], [])
      .length,
    0,
  );
  assert.equal(
    reviewRows(
      [{ id: '1', source: '进度 ７５％', target: 'Progress 70%' }],
      [],
    )[0].category,
    '数字',
  );
});
test('placeholder digits excluded from number checks', () =>
  assert.equal(
    reviewRows([{ id: '1', source: '你好 {user1}', target: 'Hi {user2}' }], [])
      .length,
    1,
  ));
test('iOS and formatted printf placeholders are compared', () => {
  assert.equal(
    reviewRows([{ id: '1', source: '你好，%@', target: 'Hello, %@' }], [])
      .length,
    0,
  );
  assert.equal(
    reviewRows(
      [{ id: '1', source: '价格：%1$0.2f', target: 'Price: %1$0.2f' }],
      [],
    ).length,
    0,
  );
  assert.equal(
    reviewRows([{ id: '1', source: '你好，%@', target: 'Hello, %s' }], [])[0]
      .category,
    '占位符',
  );
});
test('literal percent text is not treated as a printf placeholder', () =>
  assert.equal(
    reviewRows([{ id: '1', source: '100% 安全', target: '100% safe' }], [])
      .length,
    0,
  ));
test('term boundary', () => {
  const g = [{ source: '工作区', target: 'workspace' }];
  assert.equal(
    reviewRows([{ id: '1', source: '工作区', target: 'workspaces' }], g).length,
    1,
  );
  assert.equal(
    reviewRows([{ id: '1', source: '工作区', target: 'Workspace' }], g).length,
    0,
  );
});
test('only accepted edits change target', () => {
  const r = [{ id: '1', source: 'a', target: 'old', context: '' }];
  assert.equal(
    finalRows(r, { 1: { status: 'accepted', text: 'new' } })[0].target,
    'new',
  );
  assert.equal(
    finalRows(r, { 1: { status: 'rejected', text: 'bad' } })[0].target,
    'old',
  );
});
test('needs-context decisions preserve original target', () => {
  const r = [{ id: '1', source: 'a', target: 'old', context: '' }];
  assert.equal(
    finalRows(r, { 1: { status: 'needs-context', text: 'draft' } })[0].target,
    'old',
  );
});
test('safe spreadsheet export', () =>
  assert.ok(
    exportCSV(
      [{ id: '1', source: '=1+1', target: 'x', context: '' }],
      true,
    ).includes("'=1+1"),
  ));
test('rule findings include severity, evidence and provenance', () => {
  const [issue] = reviewRows(
    [{ id: '1', source: '保留 30 天', target: 'Keep for 3 days', context: '' }],
    [],
  );
  assert.equal(issue.severity, '高');
  assert.match(issue.evidence, /30/);
  assert.equal(issue.origin, '规则');
  assert.equal(issue.needsContext, false);
});
test('missing translations are high risk and stop duplicate findings', () => {
  const issues = reviewRows(
    [{ id: '1', source: '删除 {count} 个项目', target: '', context: '' }],
    [{ source: '项目', target: 'item' }],
  );
  assert.equal(issues.length, 1);
  assert.equal(issues[0].category, '漏译');
  assert.equal(issues[0].severity, '高');
});
test('glossary findings include configured term evidence', () => {
  const [issue] = reviewRows(
    [
      {
        id: '1',
        source: '打开工作区',
        target: 'Open the project',
        context: '',
      },
    ],
    [{ source: '工作区', target: 'workspace' }],
  );
  assert.equal(issue.severity, '中');
  assert.match(issue.evidence, /workspace/);
});
