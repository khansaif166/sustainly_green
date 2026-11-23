const fs = require('node:fs');
const vm = require('node:vm');
const {createRequire} = require('node:module');
const req = createRequire(process.cwd() + '/package.json');
const React = req('react');
const {renderToStaticMarkup} = req('react-dom/server');
const ts = req('typescript');
const source = fs.readFileSync('app/(protected)/admin/product-types/page.tsx', 'utf8');
const code = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
const categories = [{id:'c1',name:'Eco Products'}, {id:'c2',name:'Sustainable Construction and Industrial Materials'}];
const subcategories = [{id:'s1',categoryId:'c1',name:'Waste & Recycling'}, {id:'s2',categoryId:'c2',name:'Environmentally Responsible Building Supplies'}];
const types = [{id:'t1',name:'Water pump',subcategoryId:'s1',active:true},{id:'t2',name:'LongProductTypeNameWithoutSpacesThatMustWrapInsideItsOwnCell'.repeat(2),subcategoryId:'s2',active:false}];
for (const scenario of ['normal','edit','empty']) {
  let index=0;
  const state=[categories,subcategories,scenario==='empty'?[]:types,scenario==='edit'?'c1':'',scenario==='edit'?'s1':'',scenario==='edit'?'Water pump':'',scenario==='edit'?types[0]:null,false,''];
  const exports={};
  const localRequire = name => name==='react'?{...React,useState:()=>[state[index++],()=>{}],useEffect:()=>{},useCallback:fn=>fn}:name==='@/lib/supabaseAuth'?{}:req(name);
  vm.runInNewContext(code,{exports,require:localRequire,console});
  const markup=renderToStaticMarkup(React.createElement(exports.default));
  const checks = `
    const page=document.querySelector('.apt-page'),scroll=document.querySelector('.apt-table-scroll');
    const rect=page.getBoundingClientRect(),main=document.querySelector('.al-main').getBoundingClientRect();
    const buttons=[...document.querySelectorAll('.apt-row-actions button')];
    const pass={
      fullWidth:Math.abs(rect.width-(main.width-(innerWidth>=768?56:32)))<2,
      noPageOverflow:document.documentElement.scrollWidth<=innerWidth,
      formColumns:getComputedStyle(document.querySelector('.apt-form-grid')).gridTemplateColumns.split(' ').length===(innerWidth>=1024?4:innerWidth>=640?2:1),
      tableContained:scroll.getBoundingClientRect().right<=innerWidth,
      fiveColumns:document.querySelectorAll('thead th').length===5,
      actionsInsideCells:buttons.every(b=>{const r=b.getBoundingClientRect(),c=b.closest('td').getBoundingClientRect();return r.left>=c.left&&r.right<=c.right+1}),
      deleteCentered:[...document.querySelectorAll('.apt-delete')].every(b=>{const r=b.getBoundingClientRect(),i=b.querySelector('svg').getBoundingClientRect();return Math.abs((r.left+r.right)-(i.left+i.right))<2&&Math.abs((r.top+r.bottom)-(i.top+i.bottom))<2}),
      labels:buttons.every(b=>!!b.getAttribute('aria-label')),
      scenario: '${scenario}'==='empty'?document.querySelector('td[colspan="5"]')!==null:'${scenario}'==='edit'?document.querySelector('.apt-cancel')!==null:document.querySelectorAll('.apt-status').length===2
    };
    const result=document.createElement('pre');result.id='layout-results';result.textContent=JSON.stringify({width:innerWidth,scenario:'${scenario}',pass});document.body.append(result);
  `;
  fs.writeFileSync('/tmp/product-types-'+scenario+'.html',`<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#f8faf9;font-family:Arial,sans-serif}.al-main{padding:68px 16px 32px;min-width:0}@media(min-width:768px){.al-main{margin-left:220px;padding:28px 28px 32px}}button,input,select{font-family:inherit}#layout-results{white-space:pre-wrap;font-size:10px}</style><main class="al-main">${markup}</main><script>${checks}</script>`);
}
