const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {createRequire} = require('node:module');
const req = createRequire(process.cwd()+'/package.json');
const React=req('react');
const {renderToStaticMarkup}=req('react-dom/server');
const ts=req('typescript');
function compile(file, imports) {
  const exports={};
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  vm.runInNewContext(code,{exports,URLSearchParams,require:name=>imports[name]??req(name)});
  return exports;
}
const slug=compile('lib/slug.ts',{});
const {default:ProductDetail}=compile('app/products/[productId]/ProductDetailClient.tsx',{
  'next/link':{default:({href,children,...props})=>React.createElement('a',{...props,href},children)},
  '@/app/components/Header':{default:()=>null},
  '@/app/components/layouts/Footer':{default:()=>null},
  '../../components/ContactVendorModal':{default:()=>null},
  '@/lib/supabaseAuth':{getStoredSession:()=>null},
  '@/lib/slug':slug,
  './ProductDetailClient.module.css':{default:{breadcrumbLink:'breadcrumbLink'}},
  '@/app/components/product-specifications/ProductSpecificationsTable':{default:()=>null},
});
const base={id:'p1',title:'All-in-One Desktop PC',vendorId:'v1',vendorName:'Elite Computers',categoryId:'c1',categoryName:'Computers',categorySlug:'Computers',subcategoryId:'s1',subcategoryName:'Desktops',productTypeId:'t1',productTypeName:'All-in-One PCs',listingType:'Product',images:[],availableFor:['B2B'],shipRegions:['Countrywide'],inStock:true,currency:'INR',approved:true,ecoVerified:false,featured:false,sustainabilityTags:[],tagNames:[],description:'An efficient desktop for your workspace, with a compact design and an integrated display.'};
const cases={full:{},optional:{productTypeId:undefined,productTypeName:undefined},category:{subcategoryId:undefined,subcategoryName:undefined,productTypeId:undefined,productTypeName:undefined},legacy:{categoryId:undefined,categorySlug:undefined,subcategoryId:undefined,productTypeId:undefined},service:{listingType:'Service',productTypeId:undefined,productTypeName:undefined},none:{categoryName:undefined},long:{categoryName:'Sustainable technology and computing equipment',subcategoryName:'Energy-efficient desktop computers and workstations',productTypeName:'All-in-One PCs with integrated high-resolution displays'}};
for(const [name,patch]of Object.entries(cases)) {
 const product={...base,...patch};
 const html=renderToStaticMarkup(React.createElement(ProductDetail,{product}));
 const nav=html.match(/<nav aria-label="Product categories"[\s\S]*?<\/nav>/)?.[0]??'';
 const links=[...nav.matchAll(/href="([^"]+)"/g)].map(x=>x[1].replaceAll('&amp;','&'));
 if(name==='full')assert.deepEqual(links,['/browse?category=computers','/browse?category=computers&subcategory=s1','/browse?category=computers&subcategory=s1&product_type=t1']);
 if(name==='optional')assert.equal(links.length,2);
 if(name==='category')assert.equal(links.length,1);
 if(name==='legacy')assert.equal(links.length,0);
 if(name==='none')assert.equal(nav,'');
 if(name==='service')assert(links.every(href=>href.includes('type=service')&&!href.includes('product_type')));
 if(nav)assert(html.indexOf(nav)<html.indexOf('<h1'));
 const browserChecks=`const nav=document.querySelector('nav[aria-label="Product categories"]');const links=nav?[...nav.querySelectorAll('a')]:[];const text=nav?[...nav.querySelectorAll('a,span')]:[];const checks={noPageOverflow:document.documentElement.scrollWidth<=innerWidth,linksFit:text.every(a=>{const r=a.getBoundingClientRect(),p=nav.getBoundingClientRect();return r.left>=p.left-1&&r.right<=p.right+1}),aboveTitle:!nav||nav.getBoundingClientRect().bottom<=document.querySelector('h1').getBoundingClientRect().top,linksValid:links.every(a=>a.getAttribute('href').startsWith('/browse?category=')),greenLinks:links.every(a=>getComputedStyle(a).color==='rgb(4, 120, 87)')};const output=document.createElement('output');output.hidden=true;output.id='layout-results';output.textContent=JSON.stringify({width:innerWidth,scenario:'${name}',pass:checks});document.body.append(output);`;
 fs.writeFileSync('/tmp/breadcrumb-'+name+'.html','<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="file:///tmp/product-breadcrumb-ui.css"><style>body{margin:0;--font-poppins:Arial,sans-serif;--font-plus-jakarta-sans:Arial,sans-serif}'+fs.readFileSync('app/products/[productId]/ProductDetailClient.module.css','utf8')+'</style>'+html+'<script>'+browserChecks+'</script>');
}
(async()=>{
 const postcss=req('postcss');
 const tailwind=req('@tailwindcss/postcss');
 const result=await postcss([tailwind()]).process(fs.readFileSync('app/globals.css','utf8'),{from:process.cwd()+'/app/globals.css'});
 fs.writeFileSync('/tmp/product-breadcrumb-ui.css',result.css);
 assert(result.css.includes('.pointer-coarse\\:min-h-11'));
 console.log('PASS: rendered real product component; verified full hierarchy links, optional type, category only, legacy data, Services, and breadcrumb placement. Generated current Tailwind styles for browser checks.');
})().catch(e=>{console.error(e);process.exitCode=1;});
