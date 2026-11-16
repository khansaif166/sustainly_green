// Read-only checks against the running app, including held real route responses.
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const origin = process.env.BROWSE_TEST_ORIGIN || 'http://127.0.0.1:3101';
const results = [];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const health = await fetch(origin + '/api/health', { signal: AbortSignal.timeout(15000) });
  if (!health.ok) throw Error('Local app is unavailable: HTTP ' + health.status);
  const env = {};
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
  async function read(table, params) {
    const response = await fetch(env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/' + table + '?' + new URLSearchParams(params), {
      headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, Authorization: 'Bearer ' + env.NEXT_PUBLIC_SUPABASE_ANON_KEY, Prefer: 'count=exact' },
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw Error('Public catalog read failed: HTTP ' + response.status);
    return { rows: await response.json(), count: Number(response.headers.get('content-range').split('/')[1]) };
  }
  const counts = {};
  for (const type of ['Product', 'Service', 'Vendor']) {
    counts[type] = (await read(type === 'Vendor' ? 'vendors' : 'products', { select: 'id', approved: 'eq.true', limit: '1', ...(type === 'Vendor' ? {} : { listing_type: 'eq.' + type }) })).count;
  }
  const typed = (await read('products', {
    select: 'id,title,category_id,subcategory_id,product_type_id,category:categories(name,slug),subcategory:subcategories(name),product_type:product_types(name)',
    approved: 'eq.true', listing_type: 'eq.Product', product_type_id: 'not.is.null', limit: '1',
  })).rows[0];
  if (!typed?.category || !typed?.subcategory || !typed?.product_type) throw Error('No readable approved typed product available for real hierarchy checks');
  const catValue = typed.category.slug || typed.category_id;
  const categoryQuery = new URLSearchParams({ type: 'Product', category: catValue }).toString();
  const hierarchyQuery = new URLSearchParams({ type: 'Product', category: catValue, subcategory: typed.subcategory_id, product_type: typed.product_type_id }).toString();
  const filteredCount = (await read('products', { select: 'id', approved: 'eq.true', listing_type: 'eq.Product', category_id: 'eq.' + typed.category_id, subcategory_id: 'eq.' + typed.subcategory_id, product_type_id: 'eq.' + typed.product_type_id, limit: '1' })).count;

  const chrome = spawn('google-chrome', ['--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--disable-background-networking', '--no-first-run', '--remote-debugging-port=0', '--user-data-dir=/tmp/browse-real-recheck-' + process.pid, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  let socket;
  try {
    const endpoint = await new Promise((resolve, reject) => {
      let output = '';
      const timer = setTimeout(() => reject(Error('Chrome startup timeout')), 10000);
      chrome.stderr.on('data', chunk => {
        output += chunk;
        const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
        if (match) { clearTimeout(timer); resolve(match[1]); }
      });
      chrome.on('error', reject);
    });
    socket = new WebSocket(endpoint);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    let id = 0;
    const pending = new Map();
    let hold = false;
    const held = [];
    const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
      const next = ++id;
      pending.set(next, { resolve, reject });
      socket.send(JSON.stringify({ id: next, method, params, sessionId }));
    });
    socket.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const request = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) request.reject(Error(JSON.stringify(message.error))); else request.resolve(message.result);
      } else if (message.method === 'Fetch.requestPaused') {
        const request = { requestId: message.params.requestId, sessionId: message.sessionId };
        if (hold) held.push(request);
        else send('Fetch.continueRequest', { requestId: request.requestId }, request.sessionId).catch(() => {});
      }
    };
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const evaluate = async expression => {
      const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId);
      if (response.exceptionDetails) throw Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
      return response.result?.value;
    };
    const run = code => evaluate(`(async()=>{${code};return true})()`);
    const wait = async expression => {
      for (let attempt = 0; attempt < 600; attempt++) { if (await evaluate(expression)) return; await sleep(50); }
      throw Error('Browser state timeout: ' + expression);
    };
    const settled = async () => {
      await wait(`!!document.querySelector('.bs-count')&&!document.querySelector('.bs-skel')&&!document.querySelector('.bs-count').textContent.includes('Loading')`);
      await run(`if(document.querySelector('[role=alert]'))throw Error(document.querySelector('[role=alert]').textContent);`);
    };
    async function open(query) {
      await send('Page.navigate', { url: origin + '/browse?' + query }, sessionId);
      await wait(`!!document.querySelector('.bs-search-in')&&Object.keys(document.querySelector('.bs-search-in')).some(k=>k.startsWith('__reactProps'))`);
      await settled();
      await run(`window.check=(v,m)=>{if(!v)throw Error(m)};window.clickText=(text,scope=document)=>{const b=[...scope.querySelectorAll('button')].find(b=>b.textContent.trim()===text);check(b,'Missing button '+text);b.click()};window.change=(input,value)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}))};window.removeChip=key=>{const b=[...document.querySelectorAll('.bs-chip')].find(b=>b.textContent.startsWith(key+':'));check(b,'Missing '+key+' chip');b.click()};`);
    }
    async function release() {
      hold = false;
      await Promise.all(held.splice(0).map(request => send('Fetch.continueRequest', { requestId: request.requestId }, request.sessionId)));
    }
    async function check(name, test) {
      if (process.env.BROWSE_TEST_CASE && !name.includes(process.env.BROWSE_TEST_CASE)) return;
      try { await test(); results.push({ name, status: 'PASS' }); }
      catch (error) { results.push({ name, status: 'FAIL', message: error.message.split('\n')[0] }); }
      finally { await release(); await send('Fetch.disable', {}, sessionId); }
      console.log(results.at(-1).status + ': ' + name);
    }
    async function holdResponses(action) {
      await send('Fetch.enable', { patterns: [{ urlPattern: origin + '/browse*', requestStage: 'Response' }] }, sessionId);
      hold = true;
      await run(action);
      for (let attempt = 0; attempt < 400 && !held.length; attempt++) await sleep(50);
      assert(held.length > 0, 'No real browse response was held');
      await wait(`!!document.querySelector('[aria-label="Loading results"]')`);
    }

    for (const width of [375, 768, 1440]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId);
      await check(`${width}px real response held: last chip/count/selection clear before results`, async () => {
        await open(categoryQuery);
        await holdResponses(`removeChip('Category')`);
        await run(`check(!document.querySelector('.bs-chip')&&!document.querySelector('.bs-badge'),'Last chip/count not immediately cleared');check(!document.querySelector('.bs-card'),'Old result card is visible');check([...document.querySelectorAll('.bs-opt-active')].some(b=>b.textContent==='All Categories'),'Category selection not cleared');`);
        await release(); await settled();
        await run(`check(document.querySelector('.bs-count').textContent.startsWith('${counts.Product} products found'),'Wrong final product count');`);
      });
      await check(`${width}px real response held: parent clears both descendants`, async () => {
        await open(hierarchyQuery);
        await run(`check(document.querySelectorAll('.bs-chip').length===3,'Full hierarchy not displayed');check(document.querySelector('.bs-count').textContent.startsWith('${filteredCount} products found'),'Typed count differs from database');`);
        await holdResponses(`removeChip('Category')`);
        await run(`check(!document.querySelector('.bs-chip')&&!document.querySelector('.bs-badge'),'Hierarchy descendants remain');check(!document.querySelector('.bs-card'),'Stale typed results are visible');`);
        await release(); await settled();
      });
      await check(`${width}px real response held: Reset clears all selections`, async () => {
        await open(hierarchyQuery + '&sort=name_az');
        if (width < 900) await run(`document.querySelector('.bs-mobile-filter').click()`);
        await holdResponses(`clickText('Reset',document.querySelector('${width < 900 ? '.bs-drawer .bs-sidebar' : '.bs-sidebar'}'))`);
        await run(`check(!document.querySelector('.bs-chip')&&!document.querySelector('.bs-badge'),'Reset left active filters');check(!document.querySelector('.bs-card'),'Reset left stale result cards');`);
        await release(); await settled();
      });
      await check(`${width}px real responses held: rapid chip removals preserve latest selection`, async () => {
        await open(hierarchyQuery + '&sort=name_az');
        await holdResponses(`removeChip('Product type');removeChip('Sort');removeChip('Subcategory');removeChip('Category')`);
        await run(`check(!document.querySelector('.bs-chip')&&!document.querySelector('.bs-badge'),'Rapid removal restored a selection');check(!document.querySelector('.bs-card'),'Rapid removal showed stale results');`);
        await release(); await settled();
        await run(`const p=new URL(location.href).searchParams;check([...p.keys()].length===1&&p.get('type')==='Product','Final URL retained filters');check(!document.querySelector('.bs-chip'),'Response restored removed filters');`);
      });
    }
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId);
    for (const from of ['Product', 'Vendor', 'Service']) for (const to of ['Product', 'Vendor', 'Service']) if (from !== to) {
      await check(`Real catalog ${from} → ${to}: search/sort/page reset`, async () => {
        await open(`type=${from}&q=no-match-filter-recheck-987654&sort=name_az&page=2`);
        await run(`clickText('${to}s',document.querySelector('.bs-tabs'))`);
        await wait(`document.querySelector('.bs-tab-active')?.textContent.trim()==='${to}s'`);
        await settled();
        await run(`check(new URL(location.href).searchParams.toString()==='type=${to}','Tab kept filters');check(!document.querySelector('.bs-chip'),'Tab kept chips');check(document.querySelector('.bs-count').textContent.startsWith('${counts[to]} ${to.toLowerCase()}s found'),'Count differs from public database');`);
      });
    }
    await check('Real Back/Forward restores hierarchy and clean state', async () => {
      await open(hierarchyQuery);
      await run(`removeChip('Category')`);
      // Wait for the outgoing navigation to commit before pressing Back. An
      // absence-only loader check can race the first React render of removal.
      await wait(`new URL(location.href).searchParams.toString()==='type=Product'`);
      await settled();
      await run(`history.back()`);
      await wait(`new URL(location.href).searchParams.has('product_type')`);
      await wait(`document.querySelectorAll('.bs-chip').length===3`); await settled();
      await run(`check(document.querySelector('.bs-count').textContent.startsWith('${filteredCount} products found'),'Back count incorrect: '+document.querySelector('.bs-count').textContent);history.forward()`);
      await wait(`new URL(location.href).searchParams.toString()==='type=Product'`);
      await wait(`document.querySelectorAll('.bs-chip').length===0`); await settled();
    });
    await check('Real search draft preserves chips until submission; clearing recovers results', async () => {
      await open('type=Product');
      await run(`change(document.querySelector('.bs-search-in'),'no-match-filter-recheck-987654');check(!document.querySelector('.bs-chip'),'Draft prematurely added chip')`);
      await wait(`!!document.querySelector('.bs-chip')`); await settled();
      await run(`check(document.querySelector('.bs-empty'),'Expected genuine empty search result');removeChip('Search')`);
      await wait(`!new URL(location.href).searchParams.has('q')`);
      await settled();
      await run(`check(document.querySelector('.bs-search-in').value==='','Search control not cleared');check(!document.querySelector('.bs-empty'),'Clear search did not recover results')`);
    });
    await check('Real invalid hierarchy URL returns empty, not request error', async () => {
      await open('type=Product&category=' + catValue + '&subcategory=00000000-0000-4000-8000-000000000001');
      await run(`check(document.querySelector('.bs-empty'),'Invalid hierarchy showed matches');check(!document.querySelector('[role=alert]'),'Invalid hierarchy shown as fetch failure')`);
    });
    const report = { origin, readOnly: true, counts, typedHierarchyMatches: filteredCount, results };
    fs.writeFileSync('/tmp/browse-real-filter-recheck.json', JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ pass: results.filter(r => r.status === 'PASS').length, fail: results.filter(r => r.status === 'FAIL') }, null, 2));
    if (results.some(r => r.status === 'FAIL')) process.exitCode = 1;
  } finally { if (socket) socket.close(); chrome.kill(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
