'use client';
import {useEffect,useRef} from 'react';
import {flushSync} from 'react-dom';
type Tool={name:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean;untrustedContentHint:boolean};execute:(input:unknown)=>unknown};
type Context={registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>};
export function useReviewTools(actions:{load:(csv:string,name:string)=>void;read:()=>unknown;export:()=>string}){
 const current=useRef(actions);
 useEffect(()=>{current.current=actions},[actions]);
 useEffect(()=>{const context=(document as Document&{modelContext?:Context}).modelContext;if(!context)return;const controller=new AbortController();
 const tools:Tool[]=[{name:'import_review_csv',description:'Replace the current review session with a CSV. Existing decisions are cleared.',inputSchema:{type:'object',properties:{csv:{type:'string'}},required:['csv'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute(input){if(!input||typeof input!=='object'||!('csv'in input)||typeof input.csv!=='string')throw Error('csv must be a string');const csv=input.csv;flushSync(()=>current.current.load(csv,'Agent 导入'));return current.current.read()}},{name:'read_review',description:'Read the current document rows, issues and human decisions.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(){return current.current.read()}},{name:'export_confirmed_csv',description:'Return CSV text using only accepted edits. Does not download or transmit data.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(){return {csv:current.current.export()}}}];
 for(const tool of tools){try{void Promise.resolve(context.registerTool(tool,{signal:controller.signal})).catch(()=>{})}catch{}}
 return ()=>controller.abort();},[])
}
