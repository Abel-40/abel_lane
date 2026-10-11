import { chromium } from "@playwright/test";
const b = await chromium.launch();
for (const [n,w,h,s,m] of [["light",1440,900,"light",false],["dark",1440,900,"dark",false],["mobile",390,844,"light",true]]) {
  const c = await b.newContext({viewport:{width:w,height:h},colorScheme:s,isMobile:m,hasTouch:m});
  await c.addInitScript(()=>{try{sessionStorage.setItem("abel-loader-seen","1")}catch{}});
  const p = await c.newPage(); const errs=[]; p.on("console",x=>x.type()==="error"&&errs.push(x.text())); p.on("pageerror",e=>errs.push(e.message));
  await p.goto("http://localhost:3111/about",{waitUntil:"networkidle"}); await p.waitForTimeout(3500);
  await p.screenshot({path:`qa/cases/about-${n}.png`});
  const img = await p.evaluate(()=>{const i=document.querySelector(".ph-frame img");return {src:i.currentSrc.slice(-60),nw:i.naturalWidth,sw:document.documentElement.scrollWidth}});
  console.log(n,JSON.stringify(img),errs);
  await c.close();
}
await b.close();
