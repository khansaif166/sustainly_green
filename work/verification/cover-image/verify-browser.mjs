import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const directory = path.dirname(fileURLToPath(import.meta.url));

(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "sustainly-cover-"));
  const stubs = {
    "next/link": "import React from 'react'; export default function Link({href,children,prefetch,...props}) {return <a href={href} {...props}>{children}</a>}",
    "@/lib/supabaseAuth": "export const getValidSession = async () => ({accessToken:'fixture-token'});",
  };
  await esbuild.build({
    entryPoints: [path.join(directory, "browser-entry.tsx.txt")], loader: { ".txt": "tsx" },
    outfile: path.join(temp, "bundle.js"), bundle: true, platform: "browser", jsx: "automatic",
    tsconfig: path.resolve("tsconfig.json"),
    plugins: [{ name: "mock-auth-only", setup(build) {
      build.onResolve({ filter: /^(next\/link|@\/lib\/supabaseAuth)$/ }, args => ({ path: args.path, namespace: "stub" }));
      build.onLoad({ filter: /.*/, namespace: "stub" }, args => ({ contents: stubs[args.path], loader: "jsx", resolveDir: process.cwd() }));
    } }],
  });
  fs.writeFileSync(path.join(temp, "index.html"), '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="bundle.css"><style>body{margin:0;padding:12px;font:14px Arial}*{box-sizing:border-box}button,input{font:inherit}</style><div id="root"></div><script src="bundle.js"></script>');
  const chrome = spawn("google-chrome", ["--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--disable-background-networking", "--no-first-run", "--remote-debugging-port=0", `--user-data-dir=${temp}/chrome`, "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
  let socket;
  const results = [];
  try {
    const endpoint = await new Promise((resolve, reject) => {
      let output = "";
      const timer = setTimeout(() => reject(Error("Chrome startup timed out")), 10000);
      chrome.stderr.on("data", chunk => { output += chunk; const match = output.match(/DevTools listening on (ws:\/\/\S+)/); if (match) { clearTimeout(timer); resolve(match[1]); } });
      chrome.on("error", reject);
      chrome.on("exit", code => { clearTimeout(timer); reject(Error(`Chrome exited (${code}): ${output.slice(-1000)}`)); });
    });
    socket = new WebSocket(endpoint);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    let sequence = 0;
    const pending = new Map();
    socket.onmessage = event => { const message = JSON.parse(event.data); if (message.id) { const request = pending.get(message.id); pending.delete(message.id); if (message.error) request.reject(Error(JSON.stringify(message.error))); else request.resolve(message.result); } };
    const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, {resolve,reject}); socket.send(JSON.stringify({id,method,params,sessionId})); });
    const {targetId} = await send("Target.createTarget", {url:"about:blank"});
    const {sessionId} = await send("Target.attachToTarget", {targetId,flatten:true});
    const evaluate = async expression => {
      const result = await send("Runtime.evaluate", {expression,awaitPromise:true,returnByValue:true}, sessionId);
      if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result?.value;
    };
    await send("Emulation.setDeviceMetricsOverride", {width:1440,height:1000,deviceScaleFactor:1,mobile:false}, sessionId);
    await send("Page.navigate", {url:`file://${temp}/index.html`}, sessionId);
    await evaluate("new Promise((r,j)=>{let n=0;const t=setInterval(()=>{if(window.ready){clearInterval(t);r(true)}else if(++n>200){clearInterval(t);j(Error('Fixture failed to load'))}},25)})");
    const check = async (name, code) => { try { await evaluate(`(async()=>{${code};return true})()`); results.push({name,status:"PASS"}); } catch (error) { results.push({name,status:"FAIL",message:error.message}); } };
    await check("Empty cover shows format, size, crop and publication guidance", `await start(); assert(card().textContent.includes('No cover image'),'No empty state'); assert(card().textContent.includes('1600 × 400'),'No dimensions'); assert(!card().querySelector('button[type=submit]'),'Empty upload offered'); assert(card().textContent.includes('Up to 5 MB'),'Missing upload limit');`);
    for (const type of ["image/png", "image/jpeg", "image/webp"]) {
      await check(`${type}: selected image decodes, previews and submits`, `await start(); await selectFile(await goodFile('${type}')); assert(card().querySelector('img').naturalWidth===1600,'No decoded preview'); assert(card().textContent.includes('1600 × 400 px'),'Missing dimensions'); await submitCover(); assert(calls.find(c=>c.action==='add_media')?.file.type==='${type}','Wrong upload'); assert(card().textContent.includes('Current cover'),'Saved state missing'); assert(!card().querySelector('figure'),'Selection not cleared');`);
    }
    for (const [name, expression] of [
      ["unsupported SVG", "new File(['<svg/>'],'cover.svg',{type:'image/svg+xml'})"],
      ["empty PNG", "new File([],'cover.png',{type:'image/png'})"],
      ["oversized PNG", "new File([new Uint8Array(5*1024*1024+1)],'cover.png',{type:'image/png'})"],
      ["corrupt PNG", "new File(['not an image'],'cover.png',{type:'image/png'})"],
    ]) await check(`${name}: rejected before upload`, `await start(); await selectFile(${expression}); assert(card().querySelector('[role=alert]'),'No error'); assert(!card().querySelector('button[type=submit]'),'Invalid upload offered'); assert(!calls.some(c=>c.action),'Invalid file submitted');`);
    await check("Replacing cover sends its ID without deleting first", `await start({existing:true}); await selectFile(await goodFile()); await submitCover(); const saves=calls.filter(c=>c.action); assert(saves.length===1&&saves[0].action==='replace_cover','Replacement was destructive'); assert(saves[0].id==='10000000-0000-4000-8000-000000000002','Wrong ID');`);
    await check("Failed replacement keeps selection and old cover for retry", `await start({existing:true}); failSave=true; await selectFile(await goodFile()); await submitCover(); assert(card().textContent.includes('Original company cover'),'Old cover disappeared'); assert(card().querySelector('figure'),'Selection lost'); assert(document.querySelector('[role=alert]').textContent.includes('Simulated'),'Server error hidden'); failSave=false; await submitCover(); assert(calls.filter(c=>c.action==='replace_cover').length===2,'Retry missing');`);
    await check("Blank description disables save and custom description survives reselection", `await start(); await selectFile(await goodFile()); change(card().querySelector('input[maxlength="120"]'),' '); await pause(); assert(card().querySelector('button[type=submit]').disabled,'Whitespace title enabled'); change(card().querySelector('input[maxlength="120"]'),'Custom alt text'); await pause(); await selectFile(await goodFile('image/jpeg','next.jpg')); assert(card().querySelector('input[maxlength="120"]').value==='Custom alt text','Custom description overwritten');`);
    await check("Clear selection releases blob and supports choosing the same file again", `await start(); const file=await goodFile(); await selectFile(file); const url=card().querySelector('img').src; click('Cancel',card()); await pause(); assert(revoked.includes(url),'Blob leaked'); assert(!card().querySelector('figure'),'Selection remains'); await selectFile(file); assert(card().querySelector('figure'),'Same file cannot be reselected');`);
    await check("Double submit during delayed upload produces one request and disabled controls", `await start({existing:true,delay:300}); await selectFile(await goodFile()); const form=card().querySelector('form'); for(let i=0;i<2;i++) form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})); await pause(); assert(card().querySelector('fieldset').disabled,'Controls active during save'); assert(calls.filter(c=>c.action).length===1,'Duplicate save'); await new Promise(r=>setTimeout(r,400));`);
    await check("Successful save remains visible when editor refresh fails", `await start(); await selectFile(await goodFile()); failRefresh=true; await submitCover(); assert(card().textContent.includes('Current cover'),'Saved cover missing'); assert(document.body.textContent.includes('Changes were saved'),'Refresh error misleading');`);
    await check("Existing banner does not block editing a stored cover", `await start({existing:true,banner:true}); await selectFile(await goodFile()); await submitCover(); assert(calls.some(c=>c.action==='replace_cover'),'Banner blocked replacement'); assert(card().textContent.includes('Current cover'),'Saved cover missing');`);
    await check("Read-only vendor sees cover preview and no upload/remove controls", `await start({existing:true,editable:false,admin:false}); const cover=[...document.querySelectorAll('section')].find(e=>e.querySelector('h4')?.textContent==='Cover image'); assert(cover,'Read-only cover missing'); assert(!cover.querySelector('input[type=file]'),'Read-only upload offered'); assert(!cover.textContent.includes('Remove cover image'),'Read-only delete offered');`);
    await check("Authenticated preview supports retry after failure", `await start({existing:true,previewFailure:true}); click('Preview',card()); await waitFor(()=>{const dialog=card().querySelector('dialog[open]'); return dialog?.querySelector('[role=alert]') && !dialog.querySelector('[role=status]');},'Preview error hidden'); previewFailure=false; click('Retry preview',card().querySelector('dialog[open]')); await waitFor(()=>document.querySelector('dialog[open] img'),'Retry did not load'); assert(calls.find(c=>c.preview)?.headers.Authorization==='Bearer fixture-token','Preview unauthenticated'); click('Close');`);
    await check("Replacing an opened cover invalidates old preview blob", `await start({existing:true}); click('Preview',card()); await waitFor(()=>document.querySelector('dialog[open] img'),'Original preview did not load'); const old=document.querySelector('dialog[open] img').src; click('Close'); await selectFile(await goodFile()); await submitCover(); assert(revoked.includes(old),'Old preview blob leaked'); click('Preview',card()); await waitFor(()=>document.querySelector('dialog[open] img'),'Replacement preview did not load'); const image=document.querySelector('dialog[open] img'); assert(image.src!==old,'Stale preview reused'); click('Close');`);
    await check("Remove confirmation can cancel and successful removal permits reupload", `await start({existing:true}); window.confirm=()=>false; click('Remove cover image',card()); await pause(); assert(!calls.some(c=>c.action==='delete_media'),'Cancel deleted cover'); window.confirm=()=>true; click('Remove cover image',card()); await pause(); await pause(); assert(card().textContent.includes('No cover image'),'Removal not reflected'); assert(calls.filter(c=>c.action==='delete_media').length===1,'Wrong delete count');`);
    for (const width of [375,768,1440]) {
      await send("Emulation.setDeviceMetricsOverride", {width,height:1000,deviceScaleFactor:1,mobile:false}, sessionId);
      await check(`Cover controls and preview fit at ${width}px`, `await start({existing:true}); await selectFile(await goodFile('image/png','very_long_company_cover_filename_'.repeat(8)+'.png')); assert(document.documentElement.scrollWidth<=innerWidth,'Horizontal overflow'); for(const el of card().querySelectorAll('input,button,img')) {const r=el.getBoundingClientRect();assert(r.left>=0&&r.right<=innerWidth,'Control overflows');} assert(fileInput().labels.length>0,'File input has no label');`);
      if (width !== 768) {
        const screenshot = await send("Page.captureScreenshot", {format:"png",captureBeyondViewport:true}, sessionId);
        fs.writeFileSync(path.join(directory, `cover-${width}.png`), Buffer.from(screenshot.data,"base64"));
      }
    }
    console.log(JSON.stringify(results,null,2));
    fs.writeFileSync(path.join(directory,"browser-results.json"),JSON.stringify(results,null,2)+"\n");
    if(results.some(result=>result.status==="FAIL")) process.exitCode=1;
  } finally { if(socket) socket.close(); chrome.kill(); }
})().catch(error=>{console.error(error);process.exitCode=1});
