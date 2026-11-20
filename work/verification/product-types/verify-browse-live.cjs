const {spawn}=require('node:child_process');const fs=require('node:fs');
(async()=>{const chrome=spawn('google-chrome',['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--remote-debugging-port=0','--user-data-dir=/tmp/product-type-interactions-'+process.pid,'about:blank'],{stdio:['ignore','ignore','pipe']});let socket;const results=[];
try{
const url=await new Promise((resolve,reject)=>{let data='';const t=setTimeout(()=>reject(Error('Chrome startup timeout')),10000);chrome.stderr.on('data',c=>{data+=c;const m=data.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m){clearTimeout(t);resolve(m[1]);}});chrome.on('error',reject)});
socket=new WebSocket(url);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j});let id=0;const pending=new Map();socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}};
const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params,sessionId}))});
const {targetId}=await send('Target.createTarget',{url:'about:blank'});const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
const evaluate=async expression=>{const out=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);if(out.exceptionDetails)throw Error(out.exceptionDetails.exception?.description||out.exceptionDetails.text);return out.result?.value;};
const env={};for(const line of fs.readFileSync('.env.local','utf8').split(/\r?\n/)){const m=line.match(/^([A-Z_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim().replace(/^['"]|['"]$/g,'');}
const origin=process.env.BROWSE_TEST_ORIGIN||'http://127.0.0.1:3101';
const key=env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
async function count(table,filters){const response=await fetch(env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/,'')+'/rest/v1/'+table+'?select=id&approved=eq.true&limit=1'+filters,{headers:{apikey:key,Authorization:'Bearer '+key,Prefer:'count=exact'},signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('Read-only count failed: '+response.status);return Number(response.headers.get('content-range').split('/')[1]);}
const [serviceCount,vendorCount]=await Promise.all([count('products','&listing_type=eq.Service'),count('vendors','')]);
await send('Network.enable',{},sessionId);
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false},sessionId);
async function openComputerPage(){
await send('Page.navigate',{url:origin+'/browse?type=Product&category=computers'},sessionId);
await evaluate(`new Promise((resolve,reject)=>{let tries=0;const t=setInterval(()=>{const input=document.querySelector('.bs-search-in');if(input&&Object.keys(input).some(k=>k.startsWith('__reactProps'))){clearInterval(t);resolve(true)}else if(++tries>1200){clearInterval(t);reject('App hydration timed out')}},50)})`);
await evaluate(`window.pause=()=>new Promise(r=>setTimeout(r,80));window.assert=(x,m)=>{if(!x)throw Error(m)};window.clickText=(text,scope=document)=>{const b=[...scope.querySelectorAll('button')].find(b=>b.textContent.trim()===text);assert(b,'Missing '+text);b.click()};window.setInput=(input,value)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}))};window.settled=async(type,count)=>{let tries=0;while(true){const active=document.querySelector('.bs-tab-active')?.textContent.trim();const text=document.querySelector('.bs-count')?.textContent||'';if(active===type+'s'&&text.includes(count+' '+type.toLowerCase()+'s found'))return true;if(++tries>600)throw Error('Navigation timed out: '+location.search+' '+text);await new Promise(r=>setTimeout(r,50));}};true`);
}
async function check(name,code){try{await evaluate(`(async()=>{${code};return true})()`);results.push({name,status:'PASS'})}catch(e){results.push({name,status:'FAIL',message:e.message})}}
for(const width of [375,1440]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false},sessionId);
 await openComputerPage();
 await check(`${width}px real catalog: Product Computers → Vendor → Service`, `clickText('Vendors',document.querySelector('.bs-tabs'));await settled('Vendor',${vendorCount});assert(new URL(location.href).searchParams.toString()==='type=Vendor','Vendor retained filters');clickText('Services',document.querySelector('.bs-tabs'));await settled('Service',${serviceCount});assert(new URL(location.href).searchParams.toString()==='type=Service','Service retained filters');assert(!document.querySelector('.bs-empty'),'Service list is empty');`);
 await check(`${width}px real catalog: delayed search cannot undo Service switch`, `clickText('Vendors',document.querySelector('.bs-tabs'));await settled('Vendor',${vendorCount});setInput(document.querySelector('.bs-search-in'),'no-match-temporary-search');clickText('Services',document.querySelector('.bs-tabs'));await settled('Service',${serviceCount});await new Promise(r=>setTimeout(r,600));assert(new URL(location.href).searchParams.toString()==='type=Service','Pending search restored old query');`);
}
fs.writeFileSync('/tmp/browse-filter-live-results.json',JSON.stringify({serviceCount,vendorCount,results},null,2));console.log(JSON.stringify({serviceCount,vendorCount,results},null,2));if(results.some(r=>r.status==='FAIL'))process.exitCode=1;
}finally{if(socket)socket.close();chrome.kill()}})().catch(e=>{console.error(e.message);process.exitCode=1});
