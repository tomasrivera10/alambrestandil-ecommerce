import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { PrismaClient } from "../src/generated/prisma/client";
import catalog from "../prisma/catalog.json";
import { strict as assert } from "node:assert";

async function main() {
  const p=new PrismaClient();
  try {
    const products=await p.product.findMany({where:{status:"ACTIVE"},include:{variants:{include:{inventory:true}},images:true}});
    assert.equal(products.length,31);
    const imported=products.flatMap(p=>p.variants).filter(v=>v.sku.startsWith("AT-XLS-"));
    assert.equal(imported.length,94);
    assert(imported.every(v=>v.price===null && v.inventory?.onHand===0));
    assert(products.every(p=>p.price===null && p.priceVisibility==="HIDDEN"));
    assert.equal(imported.filter(v=>v.active).length,86);
    assert(products.flatMap(p=>p.variants).filter(v=>!v.sku.startsWith("AT-XLS-")).every(v=>!v.active));
    const originalRows = catalog.products.flatMap(p=>p.variants).map(v=>Number(v.sourceReference.match(/Stock!A(\d+)/)?.[1]));
    assert.equal(new Set(originalRows).size,94);
    console.log("Base local: 31 familias, 94 referencias; 86 publicadas, 8 ocultas por datos ambiguos. Sin precios ni stock importados.");
    const auth=await fetch("http://localhost:3000/api/auth/sign-in/email",{method:"POST",headers:{"Content-Type":"application/json",Origin:"http://localhost:3000"},body:JSON.stringify({email:process.env.SEED_ADMIN_EMAIL,password:process.env.SEED_ADMIN_PASSWORD})});
    assert(auth.ok,`Login local: ${auth.status}`);
    const cookie=auth.headers.getSetCookie().map(c=>c.split(";")[0]).join("; ");
    const directory="/tmp/tandil-catalog-qa";
    await mkdir(directory,{recursive:true});
    for(const [name,route] of [["admin","/admin/productos"],["missing","/admin/productos?foto=missing"],["edit",`/admin/productos/${products.find(p=>p.slug==="tejido-romboidal-galvanizado")!.id}`],["stock","/admin/stock"],["categories","/admin/categorias"]]){
      const result=await fetch(`http://localhost:3000${route}`,{headers:{cookie}});
      assert(result.ok && !result.url.includes("/login"),`${route}: ${result.status}`);
      const html=await result.text();
      assert(!html.includes("NEXT_HTTP_ERROR_FALLBACK"));
      // Static SSR capture for visual QA only: no session, cookies or script data.
      const preview=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"").replace(/<head>/,"<head><base href=\"http://localhost:3000\">");
      await writeFile(`${directory}/${name}.html`,preview);
      console.log(`HTTP autenticado OK: ${route}`);
    }
    await fetch("http://localhost:3000/api/auth/sign-out",{method:"POST",headers:{cookie,Origin:"http://localhost:3000","Content-Type":"application/json"},body:"{}"});
  } finally { await p.$disconnect(); }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
