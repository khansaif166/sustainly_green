const {createRequire}=require('node:module');const req=createRequire(process.cwd()+'/package.json');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');const ts=req('typescript');
const uuid=n=>'10000000-0000-4000-8000-'+String(n).padStart(12,'0');
const ids={cat:uuid(1),sub:uuid(2),type:uuid(3),vendor:uuid(4),profile:uuid(5),otherSub:uuid(6),inactive:uuid(7)};
const db={categories:[{id:ids.cat,name:'Computers',slug:'computers',active:true}],subcategories:[{id:ids.sub,name:'Desktops',category_id:ids.cat,active:true},{id:ids.otherSub,name:'Laptops',category_id:ids.cat,active:true}],product_types:[{id:ids.type,name:'All-in-One PCs',subcategory_id:ids.sub,active:true},{id:ids.inactive,name:'Legacy PCs',subcategory_id:ids.sub,active:false}],vendors:[{id:ids.vendor,company_name:'Test vendor'}],products:[],sustainability_tags:[],product_images:[],product_sustainability_tags:[]};
let actorRole='ADMIN',actorVendor=ids.vendor,nextID=100,forcedError=null,calls=[];const results=[],cache=new Map();
class HttpError extends Error{constructor(message,status,code){super(message);this.status=status;this.code=code;}}
class AuthError extends Error{constructor(status){super('Not authorized');this.status=status;}}
const clone=v=>JSON.parse(JSON.stringify(v));
async function serviceFetch(url,options={}){
 calls.push({url,method:options.method||'GET',body:options.body?JSON.parse(options.body):undefined});
 if(forcedError)throw forcedError;
 const parsed=new URL(url,'https://test.invalid');const table=parsed.pathname.split('/')[3];
 if(table==='rpc'){const name=parsed.pathname.split('/')[4];return {state:name==='prepare_product_import_row'?'prepared':'created',attemptId:uuid(200),productId:uuid(201),paths:[]};}
 if(!db[table])throw new Error('Unhandled table '+table);
 const filter=row=>[...parsed.searchParams].every(([key,value])=>['select','order','limit','offset'].includes(key)||!value.startsWith('eq.')||String(row[key])===value.slice(3));
 if(options.method==='POST'){
  const input=JSON.parse(options.body);const rows=(Array.isArray(input)?input:[input]).map(row=>({id:uuid(nextID++),images:[],...row}));db[table].push(...rows);return clone(rows);
 }
 if(options.method==='PATCH'){const patch=JSON.parse(options.body);const rows=db[table].filter(filter);rows.forEach(row=>Object.assign(row,patch));return clone(rows);}
 if(options.method==='DELETE'){db[table]=db[table].filter(row=>!filter(row));return;}
 const rows=db[table].filter(filter).map(row=>{
  const extra={};if(table==='product_types')extra.subcategory=db.subcategories.find(s=>s.id===row.subcategory_id);
  if(table==='products'){extra.product_images=db.product_images.filter(i=>i.product_id===row.id);extra.product_sustainability_tags=[];}
  return {...row,...extra};
 });return clone(rows);
}
const server={SupabaseHttpError:HttpError,supabaseServiceFetch:serviceFetch,supabaseServiceFetchAll:serviceFetch,supabaseServiceCount:async()=>0,requireRole:async(request,roles)=>{if(!actorRole)throw new AuthError(401);if(!roles.includes(actorRole))throw new AuthError(403);return {role:actorRole,vendorId:actorVendor,profile:{id:ids.profile,vendor_profile_complete:true}};},toAuthError:e=>e instanceof AuthError?e:null,toConfigError:()=>null};
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;vm.runInNewContext(code,{exports,URL,URLSearchParams,Request,Response,File,process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://test.invalid'}},console:{error(){}},require(name){if(name==='server-only')return {};if(name==='next/cache')return {revalidatePath(){}};if(name==='@/lib/supabaseServer'||(name.startsWith('.')&&path.resolve(path.dirname(file),name)===path.resolve('lib/supabaseServer')))return server;if(name.startsWith('@/'))return load(name.slice(2)+'.ts');if(name.startsWith('.'))return load(path.resolve(path.dirname(file),name)+'.ts');return req(name);}});return exports;}
const master=load('app/api/admin/master/[resource]/route.ts'),item=load('app/api/admin/master/[resource]/[id]/route.ts');
const admin=load('app/api/admin/products/route.ts'),adminItem=load('app/api/admin/products/[id]/route.ts');
const vendor=load('app/api/vendor/products/route.ts'),vendorItem=load('app/api/vendor/products/[id]/route.ts');
const catalog=load('app/api/vendor/catalog/route.ts'),imports=load('lib/productImportServer.ts');
const context=(id=ids.type)=>({params:Promise.resolve({resource:'product-types',id})});
const request=(body,method='POST')=>new Request('https://test.invalid/api/test',{method,headers:{'Content-Type':'application/json'},body:method==='GET'?undefined:JSON.stringify(body)});
const body={vendorId:ids.vendor,title:'Test computer',description:'Sustainable computing equipment suitable for office use. '.repeat(30),listingType:'Product',categoryId:ids.cat,subCategoryId:ids.sub,productTypeId:ids.type,priceType:'Price on Request',images:[],specifications:[]};
async function check(name,fn){forcedError=null;calls=[];actorRole='ADMIN';actorVendor=ids.vendor;try{await fn();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',message:e.message});}}
(async()=>{
 await check('Admin catalog lists parent IDs and statuses',async()=>{const r=await master.GET(request(null,'GET'),context());assert.equal(r.status,200);assert.equal((await r.json()).items[0].subcategoryId,ids.sub);});
 await check('Admin creates product type with parent subcategory',async()=>{const r=await master.POST(request({name:' New type ',subcategoryId:ids.sub}),context());assert.equal(r.status,201);assert.equal(db.product_types.at(-1).name,'New type');});
 await check('Admin catalog validates missing parent, blank and overlong names',async()=>{for(const b of [{name:'x'},{name:' ',subcategoryId:ids.sub},{name:'x'.repeat(121),subcategoryId:ids.sub}])assert.equal((await master.POST(request(b),context())).status,400);});
 await check('Admin edits and toggles a type',async()=>{assert.equal((await item.PATCH(request({name:'Renamed',active:false},'PATCH'),context(db.product_types.at(-1).id))).status,200);assert.equal(db.product_types.at(-1).active,false);});
 await check('Admin deletes an unused type',async()=>{assert.equal((await item.DELETE(request(null,'DELETE'),context(db.product_types.at(-1).id))).status,200);});
 await check('Duplicate type errors return conflict',async()=>{forcedError=new HttpError('duplicate',409,'23505');assert.equal((await master.POST(request({name:'x',subcategoryId:ids.sub}),context())).status,409);});
 await check('Invalid parent move returns validation error',async()=>{forcedError=new HttpError('used',400,'23514');assert.equal((await item.PATCH(request({subcategoryId:ids.otherSub},'PATCH'),context())).status,400);});
 await check('Used type deletion returns conflict and the exact explanatory message for FK errors',async()=>{forcedError=new HttpError('used',409,'23503');const response=await item.DELETE(request(null,'DELETE'),context());assert.equal(response.status,409);assert.equal((await response.json()).error.message,'This item is used by products or child catalog items and cannot be deleted.');});
 await check('Used type deletion returns conflict for RESTRICT SQLSTATE',async()=>{forcedError=new HttpError('used',409,'23001');assert.equal((await item.DELETE(request(null,'DELETE'),context())).status,409);});
 await check('Buyer and vendor cannot manage catalog',async()=>{for(const role of ['BUYER','VENDOR',null]){actorRole=role;assert.equal((await master.POST(request({name:'x',subcategoryId:ids.sub}),context())).status,role?403:401);}});
 await check('Admin creates product with valid type and mapped SQL field',async()=>{const r=await admin.POST(request(body));assert.equal(r.status,201);assert.equal(db.products.at(-1).product_type_id,ids.type);});
 await check('Admin product without type succeeds',async()=>{const r=await admin.POST(request({...body,productTypeId:''}));assert.equal(r.status,201);assert.equal(db.products.at(-1).product_type_id,null);});
 await check('Vendor creates pending product with type',async()=>{actorRole='VENDOR';const r=await vendor.POST(request(body));assert.equal(r.status,201);const p=(await r.json()).product;assert.equal(p.productTypeId,ids.type);assert.equal(p.approved,false);});
 await check('Admin and vendor reject malformed IDs, Services with type, mismatched parents and new inactive assignments',async()=>{for(const mode of ['ADMIN','VENDOR']){actorRole=mode;for(const patch of [{productTypeId:'not-a-uuid'},{productTypeId:3},{listingType:'Service'},{subCategoryId:ids.otherSub},{productTypeId:ids.inactive}])assert.equal((await(mode==='ADMIN'?admin:vendor).POST(request({...body,...patch}))).status,400);}});
 await check('Service without a product type succeeds',async()=>{assert.equal((await admin.POST(request({...body,listingType:'Service',productTypeId:''}))).status,201);});
 await check('Admin edit round-trips the type',async()=>{const id=db.products[0].id;const r=await adminItem.PUT(request({...body,title:'Edited product'},'PUT'),{params:Promise.resolve({id})});assert.equal(r.status,200);assert.equal((await r.json()).product.productTypeId,ids.type);});
 await check('Vendor edit round-trips the type',async()=>{actorRole='VENDOR';const id=db.products.find(p=>p.approved===false).id;const r=await vendorItem.PUT(request({...body,title:'Edited vendor product'},'PUT'),{params:Promise.resolve({id})});assert.equal(r.status,200);assert.equal((await r.json()).product.productTypeId,ids.type);});
 await check('Inactive type retained on an unrelated admin edit',async()=>{const id=db.products[0].id;db.product_types[0].active=false;try{const r=await adminItem.PUT(request({...body,price:100},'PUT'),{params:Promise.resolve({id})});assert.equal(r.status,200);}finally{db.product_types[0].active=true;}});
 await check('Vendor cannot edit another vendor product',async()=>{actorRole='VENDOR';actorVendor=uuid(999);const r=await vendorItem.PUT(request(body,'PUT'),{params:Promise.resolve({id:db.products[0].id})});assert.equal(r.status,404);});
 await check('Vendor catalog supplies inactive records for retaining old selections',async()=>{actorRole='VENDOR';const r=await catalog.GET(request(null,'GET'));assert.equal(r.status,200);assert((await r.json()).productTypes.some(t=>t.id===ids.inactive&&t.active===false));});
 await check('Import prepare forwards resolved productTypeId to the RPC',async()=>{const r=await imports.postProductImport(request({action:'prepare',batchId:uuid(400),rowId:uuid(401),rowNumber:1,vendorId:ids.vendor,fields:{title:'Test',listing_type:'Product',category_slug:'computers',subcategory_name:'Desktops',product_type_name:'All-in-One PCs',price_type:'Price on Request'},images:[]}), 'admin');assert.equal(r.status,200);assert.equal(calls.find(c=>c.url.endsWith('/prepare_product_import_row')).body.p_payload.productTypeId,ids.type);});
 await check('Import prepare rejects invalid type name before RPC',async()=>{const r=await imports.postProductImport(request({action:'prepare',batchId:uuid(410),rowId:uuid(411),rowNumber:1,vendorId:ids.vendor,fields:{title:'Test',listing_type:'Product',category_slug:'computers',subcategory_name:'Desktops',product_type_name:'Missing',price_type:'Price on Request'},images:[]}), 'admin');assert.equal(r.status,400);assert(!calls.some(c=>c.url.includes('/rpc/')));});
 fs.writeFileSync('/tmp/product-type-api-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));if(results.some(r=>r.status==='FAIL'))process.exitCode=1;
})().catch(e=>{console.error(e.message);process.exitCode=1;});
