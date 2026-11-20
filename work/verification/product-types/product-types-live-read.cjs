const fs=require('node:fs');
const env={};
for(const line of fs.readFileSync('.env.local','utf8').split(/\r?\n/)){const m=line.match(/^([A-Z_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim().replace(/^['"]|['"]$/g,'');}
(async()=>{
 const output={local:[],database:[]};
 for(const path of ['/api/health','/api/admin/master/product-types','/api/vendor/catalog','/api/admin/products?masters=1']){
  try{const r=await fetch('http://localhost:3000'+path,{signal:AbortSignal.timeout(10000)});output.local.push({path,status:r.status});await r.arrayBuffer();}
  catch(e){output.local.push({path,error:e.cause?.code||e.name});}
 }
 const root=env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/,'');
 const snapshots={};
 for(const [label,path,kind]of [
  ['catalog','product_types?select=id,subcategory_id,active&limit=1000','service'],
  ['public_catalog','product_types?select=id,subcategory_id,active&limit=1000','anon'],
  ['assigned_products','products?select=id,category_id,subcategory_id,product_type_id,product_type:product_types(name)&approved=eq.true&product_type_id=not.is.null&limit=1000','anon'],
  ['categories','categories?select=id,slug&active=eq.true&limit=1000','anon'],
  ['subcategories','subcategories?select=id,category_id&active=eq.true&limit=1000','anon']]){
  try{const key=kind==='service'?env.SUPABASE_SERVICE_ROLE_KEY:env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
   const r=await fetch(root+'/rest/v1/'+path,{headers:{apikey:key,Authorization:'Bearer '+key},signal:AbortSignal.timeout(15000)});
   const data=await r.json();snapshots[label]=data;
   output.database.push({label,status:r.status,rows:Array.isArray(data)?data.length:undefined,error:!r.ok?data.code:undefined,missingTypeLabels:label==='assigned_products'&&Array.isArray(data)?data.filter(p=>!p.product_type?.name).length:undefined});
  }catch(e){output.database.push({label,error:e.cause?.code||e.name});}
 }
 fs.writeFileSync('/tmp/product-types-live-snapshot.json',JSON.stringify(snapshots));
 console.log(JSON.stringify(output,null,2));
})();
