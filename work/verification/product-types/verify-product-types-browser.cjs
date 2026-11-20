const {spawn}=require('node:child_process');
const fs=require('node:fs');
(async()=>{
  const chrome=spawn('google-chrome',['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--remote-debugging-port=0','--user-data-dir=/tmp/product-types-cdp','about:blank'],{stdio:['ignore','ignore','pipe']});
  let socket;
  try {
    const url=await new Promise((resolve,reject)=>{
      let data='';const timer=setTimeout(()=>reject(new Error('Chrome startup timed out')),10000);
      chrome.stderr.on('data',chunk=>{data+=chunk;const m=data.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m){clearTimeout(timer);resolve(m[1]);}});
      chrome.on('error',reject);
    });
    socket=new WebSocket(url);
    await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
    let id=0;const pending=new Map();
    socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);}};
    const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params,sessionId}));});
    const {targetId}=await send('Target.createTarget',{url:'about:blank'});
    const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
    let failed=false;
    for(const width of [375,768,1440])for(const scenario of ['normal','edit','empty']){
      await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false},sessionId);
      await send('Page.navigate',{url:'file:///tmp/product-types-'+scenario+'.html'},sessionId);
      const {result}=await send('Runtime.evaluate',{expression:"new Promise((resolve,reject)=>{let tries=0;const t=setInterval(()=>{const el=document.getElementById('layout-results');if(el){clearInterval(t);resolve(el.textContent);}else if(++tries>100){clearInterval(t);reject('Missing layout results');}},25);})",awaitPromise:true,returnByValue:true},sessionId);
      const values=JSON.parse(result.value);if(values.width!==width||Object.values(values.pass).some(x=>!x))failed=true;
      console.log(JSON.stringify(values));
      if(scenario==='normal'&&(width===375||width===1440)){
        const {data}=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},sessionId);
        fs.writeFileSync('/tmp/product-types-'+width+'.png',Buffer.from(data,'base64'));
      }
    }
    if(failed)process.exitCode=1;
  }finally{if(socket)socket.close();chrome.kill();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
