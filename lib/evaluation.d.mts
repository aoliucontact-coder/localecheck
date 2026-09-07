export type EvaluationCase={id:string;source:string;target:string;context:string;expectedCategories:string[]};
export type CategoryCounts={truePositive:number;falsePositive:number;falseNegative:number};
export type EvaluationMetrics={cases:number;truePositive:number;falsePositive:number;falseNegative:number;precision:number|null;recall:number|null;f1:number|null;correctCases:number;falsePositivesPer100Correct:number|null;byCategory:Record<string,CategoryCounts>};
export type RuleDataset={name:string;provenance:'synthetic'|'deidentified-real'|'mixed';split:'development'|'test';description:string;glossary:{source:string;target:string}[];cases:EvaluationCase[]};
export function validateRuleDataset(dataset:unknown):RuleDataset;
export function scoreCategories(cases:EvaluationCase[],predict:(item:EvaluationCase)=>string[]):EvaluationMetrics;
