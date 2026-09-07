import {readFile} from 'node:fs/promises';
import {scoreCategories} from '../lib/evaluation.mjs';
import {reviewRows} from '../lib/review.mjs';

const path=new URL('../evals/rules.dev.json',import.meta.url);
const dataset=JSON.parse(await readFile(path,'utf8'));
if(dataset.provenance!=='synthetic'||dataset.split!=='development'||!Array.isArray(dataset.cases))throw Error('评测集元数据无效。');
const metrics=scoreCategories(dataset.cases,item=>reviewRows([item],dataset.glossary).map(issue=>issue.category));
const noMisses=category=>(metrics.byCategory[category]?.falseNegative??0)===0;
const gates={
 numberRecall100:noMisses('数字'),
 placeholderRecall100:noMisses('占位符'),
 missingTranslationRecall100:noMisses('漏译'),
 terminologyPrecision95:(()=>{const value=metrics.byCategory['术语'];return !value||value.truePositive/(value.truePositive+value.falsePositive)>=0.95})(),
 correctFalsePositivesAtMost3Per100:(metrics.falsePositivesPer100Correct??0)<=3
};
console.log(JSON.stringify({dataset:dataset.name,provenance:dataset.provenance,split:dataset.split,...metrics,gates},null,2));
if(Object.values(gates).some(passed=>!passed))process.exitCode=1;
