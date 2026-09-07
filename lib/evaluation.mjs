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
