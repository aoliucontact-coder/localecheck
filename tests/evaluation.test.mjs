import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreCategories} from '../lib/evaluation.mjs';

test('category scoring counts true, false and missed findings',()=>{
 const cases=[{expectedCategories:['数字']},{expectedCategories:['术语']},{expectedCategories:[]}];
 const predictions=[['数字'],[],['术语']];let index=0;
 const score=scoreCategories(cases,()=>predictions[index++]);
 assert.equal(score.truePositive,1);
 assert.equal(score.falsePositive,1);
 assert.equal(score.falseNegative,1);
 assert.equal(score.precision,0.5);
 assert.equal(score.recall,0.5);
 assert.equal(score.f1,0.5);
 assert.equal(score.falsePositivesPer100Correct,100);
});

test('zero denominators are reported as not applicable',()=>{
 const score=scoreCategories([{expectedCategories:[]}],()=>[]);
 assert.equal(score.precision,null);
 assert.equal(score.recall,null);
 assert.equal(score.f1,null);
 assert.equal(score.falsePositivesPer100Correct,0);
});
