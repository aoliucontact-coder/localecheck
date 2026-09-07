/** Strict, bounded RFC-style CSV parser. No evaluation of imported text. */
export function decodeUTF8(input){
 const bytes=input instanceof ArrayBuffer?new Uint8Array(input):ArrayBuffer.isView(input)?new Uint8Array(input.buffer,input.byteOffset,input.byteLength):null;
 if(!bytes)throw Error('无法读取文件。');
 if(bytes.byteLength>1_000_000)throw Error('文件超过 1 MB 限制。');
 try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes)}catch{throw Error('文件不是有效的 UTF-8 编码。')}
}
export function parseCSV(input){
 if(typeof input!=='string'||new TextEncoder().encode(input).byteLength>1_000_000)throw Error('文件超过 1 MB 限制。');
 const text=input.replace(/^\uFEFF/,'');const grid=[];let row=[],cell='',quoted=false,closed=false;
 const endCell=()=>{row.push(cell);cell='';closed=false};const endRow=()=>{endCell();if(row.some(x=>x!==''))grid.push(row);row=[]};
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++}else{quoted=false;closed=true}}else cell+=c;continue}
 if(c==='"'){if(cell||closed)throw Error('CSV 引号格式错误。');quoted=true}else if(c===',')endCell();else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;endRow()}else{if(closed)throw Error('闭合引号后有多余字符。');cell+=c}}
 if(quoted)throw Error('CSV 存在未闭合的引号。');if(cell||row.length||closed)endRow();
 const head=grid.shift()?.map(x=>x.trim());if(!head||['id','source','target'].some(k=>!head.includes(k)))throw Error('CSV 必须包含 id、source、target 列。');
 if(new Set(head).size!==head.length)throw Error('CSV 列名重复。');if(head.some(k=>!['id','source','target','context'].includes(k)))throw Error('仅支持 id、source、target、context 列，请移除额外列以免丢失数据。');
 if(!grid.length||grid.length>100)throw Error('请导入 1—100 条文案。');const ids=new Set();return grid.map((r,i)=>{if(r.length!==head.length)throw Error(`第 ${i+2} 行列数不一致。`);const v=Object.fromEntries(head.map((k,j)=>[k,r[j]]));if(!v.id.trim()||ids.has(v.id))throw Error(`第 ${i+2} 行 id 为空或重复。`);if(!v.source.trim())throw Error(`第 ${i+2} 行原文为空。`);ids.add(v.id);return {id:v.id,source:v.source,target:v.target,context:v.context??''}})
}
export function exportCSV(rows,safe=false){const esc=v=>{let s=String(v??'');if(safe&&/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'};return 'id,source,target,context\r\n'+rows.map(r=>['id','source','target','context'].map(k=>esc(r[k])).join(',')).join('\r\n')}
export function finalRows(rows,decisions){return rows.map(r=>({...r,target:decisions[r.id]?.status==='accepted'?decisions[r.id].text:r.target}))}
const placeholders=s=>s.match(/\{\{[^{}]+\}\}|\{[^{}]+\}|%\d*\$?[sdif]/g)??[];
const numbers=s=>(s.replace(/\{\{[^{}]+\}\}|\{[^{}]+\}|%\d*\$?[sdif]/g,'').match(/-?\d+(?:,\d{3})*(?:\.\d+)?%?/g)??[]).map(x=>x.replaceAll(',',''));
const same=(a,b)=>JSON.stringify([...a].sort((x,y)=>x.localeCompare(y)))===JSON.stringify([...b].sort((x,y)=>x.localeCompare(y)));
export function parseGlossary(text){const entries=text.split('\n').filter(x=>x.trim()).map((line,i)=>{const pos=line.indexOf('=');if(pos<1||!line.slice(pos+1).trim())throw Error(`术语表第 ${i+1} 行请使用 中文=English。`);return {source:line.slice(0,pos).trim(),target:line.slice(pos+1).trim()}});if(new Set(entries.map(x=>x.source)).size!==entries.length)throw Error('术语表存在重复中文术语。');return entries}
export function reviewRows(rows,glossary=[]){const issues=[];for(const r of rows){const add=(category,reason,severity,evidence)=>issues.push({id:r.id,category,reason,severity,evidence,needsContext:false,origin:'规则',suggestion:''});if(!r.target.trim()){add('漏译','英文译文为空，请补充译文。','高',`原文：“${r.source}”；译文为空。`);continue}if(!same(placeholders(r.source),placeholders(r.target))){const sourceValues=placeholders(r.source),targetValues=placeholders(r.target);add('占位符','原文与译文中的占位符名称或数量不一致。','高',`原文：${sourceValues.join('、')||'无'}；译文：${targetValues.join('、')||'无'}。`)}if(!same(numbers(r.source),numbers(r.target))){const sourceValues=numbers(r.source),targetValues=numbers(r.target);add('数字','原文与译文中的数字或百分比不一致。','高',`原文：${sourceValues.join('、')||'无'}；译文：${targetValues.join('、')||'无'}。`)}for(const g of glossary){const escaped=g.target.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');if(r.source.includes(g.source)&&!new RegExp('(?:^|[^A-Za-z0-9_])'+escaped+'(?=$|[^A-Za-z0-9_])','i').test(r.target))add('术语',`“${g.source}”未使用指定译法。`,'中',`术语表要求：“${g.source}” = “${g.target}”。`)}}return issues}
