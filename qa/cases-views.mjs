import { chromium } from "@playwright/test";
const b = await chromium.launch();
for (const [name, w, h, scheme, mobile] of [["desktop-light",1440,900,"light",false],["desktop-dark",1440,900,"dark",false],["mobile",390,844,"light",true]]) {
  const c = await b.newContext({ viewport:{width:w,height:h}, colorScheme:scheme, isMobile:mobile, hasTouch:mobile });
  await c.addInitScript(()=>{try{sessionStorage.setItem("abel-loader-seen","1")}catch{}});
  const p = await c.newPage();
  await p.goto("http://localhost:3111/case-studies/seo-maker",{waitUntil:"networkidle"});
  await p.waitForTimeout(1200);
  for (const id of ["rd-design","rd-implementation"]) {
    await p.evaluate((id)=>document.getElementById(id).scrollIntoView(),id);
    await p.waitForTimeout(1500);
    await p.screenshot({path:`qa/cases/v-${name}-${id}.png`});
  }
  if (mobile) { // scroll code block to the right end to confirm it scrolls inside the card
    const r = await p.evaluate(()=>{const pre=document.querySelector(".rd-code pre");return {sw:pre.scrollWidth,cw:pre.clientWidth}});
    console.log("mobile pre", r);
  }
  await c.close();
}
await b.close();
