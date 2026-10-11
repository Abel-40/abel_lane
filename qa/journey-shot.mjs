import { chromium } from "@playwright/test";
const b = await chromium.launch();
for (const [n,w,h,s] of [["light",1440,900,"light"],["dark",1440,900,"dark"],["dark-1366",1366,768,"dark"],["light-1920",1920,1080,"light"]]) {
  const c = await b.newContext({viewport:{width:w,height:h},colorScheme:s});
  await c.addInitScript(()=>{try{sessionStorage.setItem("abel-loader-seen","1")}catch{}});
  const p = await c.newPage(); const errs=[]; p.on("console",x=>x.type()==="error"&&errs.push(x.text())); p.on("pageerror",e=>errs.push(e.message));
  await p.goto("http://localhost:3111/",{waitUntil:"networkidle"}); await p.waitForTimeout(2500);
  const y = await p.evaluate(()=>document.querySelector(".journey").getBoundingClientRect().top+scrollY);
  await p.evaluate((y)=>window.scrollTo(0,y+300),y); await p.waitForTimeout(2500);
  await p.screenshot({path:`qa/cases/jr-${n}.png`});
  const m = await p.evaluate(()=>{const g=id=>document.querySelector(id).getBoundingClientRect();const band=g(".jr-band"),st=g(".jr-stack"),grid=g(".jr-grid"),panel=g(".jr-panel");return {band:[band.top,band.bottom],stack:[st.top,st.bottom],panel:[panel.top,panel.bottom],grid:[grid.top,grid.bottom],sw:document.documentElement.scrollWidth}});
  console.log(n,JSON.stringify(m),errs); await c.close();
}
await b.close();
