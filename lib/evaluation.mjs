const RULE_CATEGORIES=new Set(['数字','占位符','漏译','术语']);

export function validateRuleDataset(dataset){
 if(!dataset||typeof dataset!=='object'||typeof dataset.name!=='string'||!dataset.name.trim()||!['synthetic','deidentified-real','mixed'].includes(dataset.provenance)||!['development','test'].includes(dataset.split)||typeof dataset.description!=='string'||!dataset.description.trim())throw Error('评测集元数据无效。');
 if(!Array.isArray(dataset.glossary)||dataset.glossary.length>200)throw Error('评测集术语表无效。');
 const glossarySources=new Set();
 for(const entry of dataset.glossary){
  if(!entry||typeof entry!=='object'||typeof entry.source!=='string'||!entry.source.trim()||typeof entry.target!=='string'||!entry.target.trim()||glossarySources.has(entry.source))throw Error('评测集术语表无效。');
  glossarySources.add(entry.source);
 }
 if(!Array.isArray(dataset.cases)||dataset.cases.length<1||dataset.cases.length>1000)throw Error('评测案例数量无效。');
 const ids=new Set();
 for(const item of dataset.cases){
  if(!item||typeof item!=='object'||typeof item.id!=='string'||!item.id.trim()||ids.has(item.id)||typeof item.source!=='string'||!item.source.trim()||typeof item.target!=='string'||typeof item.context!=='string'||!Array.isArray(item.expectedCategories))throw Error('评测案例格式无效。');
  if(new Set(item.expectedCategories).size!==item.expectedCategories.length||item.expectedCategories.some(category=>!RULE_CATEGORIES.has(category)))throw Error('评测案例标签无效。');
  ids.add(item.id);
 }
 return dataset;
}

export function scoreCategories(cases,predict){
 let truePositive=0,falsePositive=0,falseNegative=0,correctCases=0,correctCaseFalsePositives=0;
 const byCategory={};
 for(const item of cases){
  const expected=new Set(item.expectedCategories),predicted=new Set(predict(item));
  if(!expected.size){correctCases++;correctCaseFalsePositives+=predicted.size}
  for(const category of new Set([...expected,...predicted])){
   const bucket=byCategory[category]??={truePositive:0,falsePositive:0,falseNegative:0};
   if(expected.has(category)&&predicted.has(category)){truePositive++;bucket.truePositive++}
   else if(predicted.has(category)){falsePositive++;bucket.falsePositive++}
   else{falseNegative++;bucket.falseNegative++}
  }
 }
 const ratio=(a,b)=>b===0?null:a/b;
 const metrics={cases:cases.length,truePositive,falsePositive,falseNegative,precision:ratio(truePositive,truePositive+falsePositive),recall:ratio(truePositive,truePositive+falseNegative),f1:null,correctCases,falsePositivesPer100Correct:correctCases?correctCaseFalsePositives/correctCases*100:null,byCategory};
 metrics.f1=metrics.precision===null||metrics.recall===null||metrics.precision+metrics.recall===0?null:2*metrics.precision*metrics.recall/(metrics.precision+metrics.recall);
 return metrics;
}
