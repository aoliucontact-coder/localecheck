export type EvaluationCase={id:string;source:string;target:string;context:string;expectedCategories:string[]};
export type CategoryCounts={truePositive:number;falsePositive:number;falseNegative:number};
export type EvaluationMetrics={cases:number;truePositive:number;falsePositive:number;falseNegative:number;precision:number|null;recall:number|null;f1:number|null;correctCases:number;falsePositivesPer100Correct:number|null;byCategory:Record<string,CategoryCounts>};
export function scoreCategories(cases:EvaluationCase[],predict:(item:EvaluationCase)=>string[]):EvaluationMetrics;
