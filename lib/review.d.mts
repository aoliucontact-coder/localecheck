export type Row={id:string;source:string;target:string;context:string};
export type Issue={id:string;category:string;reason:string;origin:string;suggestion:string};
export type Decision={status:'accepted'|'rejected'|'pending';text:string};
export function parseCSV(input:string):Row[];
export function exportCSV(rows:Row[],safe?:boolean):string;
export function finalRows(rows:Row[],decisions:Record<string,Decision>):Row[];
export function parseGlossary(text:string):{source:string;target:string}[];
export function reviewRows(rows:Row[],glossary?:{source:string;target:string}[]):Issue[];
