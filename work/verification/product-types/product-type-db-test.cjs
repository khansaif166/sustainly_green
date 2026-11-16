const {createRequire}=require('node:module');
const req=createRequire(process.cwd()+'/package.json');
const {PGlite}=req('@electric-sql/pglite');
const {citext}=req('@electric-sql/pglite/contrib/citext');
const {pgcrypto}=req('@electric-sql/pglite/contrib/pgcrypto');
const fs=require('node:fs'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const results=[];
async function check(name,fn){try{await fn();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',message:e.message,code:e.code});}}
(async()=>{
 const db=new PGlite({extensions:{citext,pgcrypto}});
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.role() returns text language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claim.role',true),''),current_user::text)$$;
 create schema storage;create table storage.buckets(id text primary key,name text,public boolean);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text,metadata jsonb);
 alter table storage.objects enable row level security;grant usage on schema public,auth,storage to anon,authenticated,service_role;`);
 for(const file of ['20260623055559_initial_sustainly_schema.sql','20260623070000_vendor_claims.sql','20260726090000_product_eco_verified_badge.sql','20261101090000_product_spreadsheet_import.sql','20261102090000_product_specifications.sql','20261116090000_product_types.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
 await db.exec('grant select,insert,update,delete on all tables in schema public to anon,authenticated,service_role; grant all on all tables in schema auth,storage to service_role;');
 results.push({name:'Apply base, import, specifications and product type migrations',status:'PASS'});
 const ids={};for(const k of ['adminU','admin','vendorU','vendorProfile','buyerU','buyer','vendor','cat','otherCat','sub','otherSub','freeSub','type','otherType','freeType','product'])ids[k]=randomUUID();
 await db.query('insert into auth.users(id) values ($1),($2),($3)',[ids.adminU,ids.vendorU,ids.buyerU]);
 for(const [id,u,role]of [[ids.admin,ids.adminU,'ADMIN'],[ids.vendorProfile,ids.vendorU,'VENDOR'],[ids.buyer,ids.buyerU,'BUYER']])await db.query('insert into profiles(id,auth_user_id,name,email,role) values($1,$2,$3,$4,$5)',[id,u,role,role+'@test.invalid',role]);
 await db.query('insert into vendors(id,profile_id,company_name) values($1,$2,$3)',[ids.vendor,ids.vendorProfile,'Test vendor']);
 await db.query('insert into categories(id,name,slug) values($1,$2,$3),($4,$5,$6)',[ids.cat,'Computers','computers',ids.otherCat,'Packaging','packaging']);
 await db.query('insert into subcategories(id,category_id,name) values($1,$2,$3),($4,$5,$6),($7,$2,$8)',[ids.sub,ids.cat,'Desktops',ids.otherSub,ids.otherCat,'Bottles',ids.freeSub,'Unused sub']);
 await db.query('insert into product_types(id,subcategory_id,name) values($1,$2,$3),($4,$5,$6),($7,$2,$8)',[ids.type,ids.sub,'All-in-One PCs',ids.otherType,ids.otherSub,'Bamboo bottle',ids.freeType,'Unused type']);
 const sqlProduct='insert into products(id,vendor_id,vendor_name,title,listing_type,category_id,subcategory_id,product_type_id,approved) values($1,$2,$3,$4,$5,$6,$7,$8,true)';
 const addProduct=patch=>db.query(sqlProduct,[patch?.id||randomUUID(),ids.vendor,'Test vendor','Test listing',patch?.listingType||'Product',patch?.category||ids.cat,patch?.sub||ids.sub,patch?.type===null?null:patch?.type||ids.type]);
 await check('Unique names are case and surrounding-space insensitive within a subcategory',()=>assert.rejects(db.query('insert into product_types(subcategory_id,name) values($1,$2)',[ids.sub,'  ALL-IN-ONE PCS ']),e=>e.code==='23505'));
 await check('Same name allowed under a different subcategory',()=>db.query('insert into product_types(subcategory_id,name) values($1,$2)',[ids.otherSub,'All-in-One PCs']));
 await check('Blank product type name rejected',()=>assert.rejects(db.query('insert into product_types(subcategory_id,name) values($1,$2)',[ids.sub,' ']),e=>e.code==='23514'));
 await check('Valid Product with full hierarchy inserts',()=>addProduct({id:ids.product}));
 await check('Legacy Product without type remains valid',()=>addProduct({type:null}));
 await check('Service without product type remains valid',()=>addProduct({type:null,listingType:'Service'}));
 await check('Service with product type rejected',()=>assert.rejects(addProduct({listingType:'Service'}),e=>e.code==='23514'));
 await check('Wrong category rejected',()=>assert.rejects(addProduct({category:ids.otherCat}),e=>e.code==='23514'));
 await check('Wrong subcategory rejected',()=>assert.rejects(addProduct({sub:ids.otherSub}),e=>e.code==='23514'));
 await check('Used type cannot be deleted',()=>assert.rejects(db.query('delete from product_types where id=$1',[ids.type]),e=>{console.log('Used type delete SQLSTATE: '+e.code);return ['23503','23001'].includes(e.code);}));
 await check('Used type cannot be reparented',()=>assert.rejects(db.query('update product_types set subcategory_id=$1 where id=$2',[ids.otherSub,ids.type]),e=>e.code==='23514'));
 await check('Used subcategory cannot be reparented',()=>assert.rejects(db.query('update subcategories set category_id=$1 where id=$2',[ids.otherCat,ids.sub]),e=>e.code==='23514'));
 await check('Unused type can be reparented',()=>db.query('update product_types set subcategory_id=$1 where id=$2',[ids.otherSub,ids.freeType]));
 await check('Unused subcategory can be reparented',()=>db.query('update subcategories set category_id=$1 where id=$2',[ids.otherCat,ids.freeSub]));
 await db.query('update product_types set active=false where id=$1',[ids.type]);
 await check('Inactive type rejected for a new product',()=>assert.rejects(addProduct(),e=>e.code==='23514'));
 await check('Existing inactive type preserved on unrelated edit',()=>db.query('update products set price=125,product_type_id=$1 where id=$2',[ids.type,ids.product]));
 await check('Public can read inactive type assigned to an approved product',async()=>{
  await db.exec('set role anon');try{const r=await db.query('select id from product_types where id=$1',[ids.type]);assert.equal(r.rows.length,1,'Inactive assigned type disappeared from public reads');}finally{await db.exec('reset role');}
 });
 await check('Non-admin cannot create product types',async()=>{
  await db.exec('set role authenticated');try{await assert.rejects(db.query('insert into product_types(subcategory_id,name) values($1,$2)',[ids.sub,'Unauthorized type']),e=>e.code==='42501');}finally{await db.exec('reset role');}
 });
 await check('Non-admin cannot change or delete product types',async()=>{
  await db.exec('set role authenticated');try{
   assert.equal((await db.query('update product_types set name=$1 where id=$2 returning id',['Tampered',ids.otherType])).rows.length,0);
   assert.equal((await db.query('delete from product_types where id=$1 returning id',[ids.otherType])).rows.length,0);
  }finally{await db.exec('reset role');}
 });

 await check('Authenticated admin can create, rename, deactivate and delete unused types',async()=>{
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[ids.adminU]);
  await db.exec('set role authenticated');try{
   const created=await db.query('insert into product_types(subcategory_id,name) values($1,$2) returning id',[ids.sub,'Admin permission fixture']);const id=created.rows[0].id;
   assert.equal((await db.query('update product_types set name=$1,active=false where id=$2 returning id',['Admin renamed',id])).rows.length,1);
   assert.equal((await db.query('select id from product_types where id=$1',[id])).rows.length,1);
   assert.equal((await db.query('delete from product_types where id=$1 returning id',[id])).rows.length,1);
  }finally{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub','',false)");}
 });
 await check('Actual vendor and buyer JWT subjects cannot manage product types',async()=>{
  for(const user of [ids.vendorU,ids.buyerU]){
   await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);await db.exec('set role authenticated');try{
    await assert.rejects(db.query('insert into product_types(subcategory_id,name) values($1,$2)',[ids.sub,'Unauthorized']),e=>e.code==='42501');
    assert.equal((await db.query('update product_types set active=false where id=$1 returning id',[ids.otherType])).rows.length,0);
    assert.equal((await db.query('delete from product_types where id=$1 returning id',[ids.otherType])).rows.length,0);
   }finally{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub','',false)");}
  }
 });
 await db.query('update product_types set active=true where id=$1',[ids.type]);
 const payload={title:'Imported computer',description:'Import fixture',listingType:'Product',categoryId:ids.cat,subCategoryId:ids.sub,productTypeId:ids.type,availableFor:[],priceType:'Price on Request',price:null,currency:'INR',moq:null,discount:'',shipRegions:[],inStock:true,sustainabilityClaim:'',sustainabilityTagIds:[]};
 async function prepare(actor,patch={}){const batch=randomUUID(),row=randomUUID();const r=await db.query('select prepare_product_import_row($1,$2,1,$3,$4,$5::jsonb,$6::jsonb) as result',[batch,row,actor,ids.vendor,JSON.stringify({...payload,...patch}),'[]']);return {batch,row,attempt:r.rows[0].result.attemptId};}
 async function commit(ticket,actor){return (await db.query('select commit_product_import_row($1,$2,$3,$4,$5) as result',[ticket.batch,ticket.row,ticket.attempt,actor,'https://example.invalid'])).rows[0].result;}
 await check('Admin import stores product type and approves product',async()=>{const t=await prepare(ids.admin);const r=await commit(t,ids.admin);const p=(await db.query('select product_type_id,approved from products where id=$1',[r.productId])).rows[0];assert.equal(p.product_type_id,ids.type);assert.equal(p.approved,true);assert.equal((await commit(t,ids.admin)).productId,r.productId);});
 await check('Vendor import stores product type and remains pending',async()=>{const t=await prepare(ids.vendorProfile);const r=await commit(t,ids.vendorProfile);const p=(await db.query('select product_type_id,approved from products where id=$1',[r.productId])).rows[0];assert.equal(p.product_type_id,ids.type);assert.equal(p.approved,false);});
 await check('Import without product type remains compatible',async()=>{const t=await prepare(ids.admin,{productTypeId:null});const r=await commit(t,ids.admin);assert.equal((await db.query('select product_type_id from products where id=$1',[r.productId])).rows[0].product_type_id,null);});
 await check('Import rejects mismatched product type at commit',async()=>{const t=await prepare(ids.admin,{productTypeId:ids.otherType});await assert.rejects(commit(t,ids.admin),e=>e.code==='22023');});
 await check('Import rejects type deactivated after prepare',async()=>{const t=await prepare(ids.admin);await db.query('update product_types set active=false where id=$1',[ids.type]);try{await assert.rejects(commit(t,ids.admin),e=>e.code==='22023');}finally{await db.query('update product_types set active=true where id=$1',[ids.type]);}});
 await check('Buyer cannot prepare product imports',()=>assert.rejects(prepare(ids.buyer),e=>e.code==='42501'));
 await check('Import commit still restricted to service role',async()=>{await db.exec('set role anon');try{await assert.rejects(db.query('select commit_product_import_row(null,null,null,null,null)'),e=>e.code==='42501');}finally{await db.exec('reset role');}});
 await db.close();
 fs.writeFileSync('/tmp/product-type-db-results.json',JSON.stringify(results,null,2));
 console.log(JSON.stringify(results,null,2));
 if(results.some(r=>r.status==='FAIL'))process.exitCode=1;
})().catch(e=>{console.error(JSON.stringify({setupFailure:e.message,code:e.code}));process.exitCode=1;});
