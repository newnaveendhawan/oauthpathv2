const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let G=[],D={managed:[],byo:[]};
const norm=s=>s.toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/.*$/,'').replace(/\.(com|io|so|dev|app|co|org|net)$/,'').replace(/[^a-z0-9]/g,'');
function dirStatus(name){const n=norm(name);
 if(D.managed.some(x=>norm(x)===n))return 'managed';
 if(D.byo.some(x=>norm(x)===n))return 'byo';return 'unknown'}
function dirBanner(name){const s=dirStatus(name);
 if(s==='managed')return `<div class="banner"><b>Composio managed OAuth app available.</b> For prototypes you may not need to register your own OAuth app. Read <a href="https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app" target="_blank" rel="noopener">managed vs custom auth</a> to decide. The guide below covers setting up your own app.</div>`;
 if(s==='byo')return `<div class="banner warn"><b>Bring your own OAuth app.</b> Composio's directory lists this app as needing your own OAuth app. This guide is the path.</div>`;
 return `<div class="banner warn">This app is not in the Composio managed OAuth directory snapshot (${esc(D.checked)}). It may use API keys only, or be missing from that list.</div>`}
function meter(n){return `<div class="meter" title="${n} of 5">${[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}</div>`}
function list(a){return `<ul>${(a||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`}
function render(g,generated){window.__lastGuide=window.__lastGuide||null;
 const src=g.sources||[];
 const claims=(g.claims||[]).map(c=>{const s=src[c.src];return `<li><span class="tag ${c.status}">${esc(c.status)}</span>${esc(c.text)} ${s?`<a href="${esc(s.url)}" target="_blank" rel="noopener">source</a>`:''}${c.note?` <span class="muted">${esc(c.note)}</span>`:''}</li>`}).join('');
 $('#main').innerHTML=`<article class="card">
 ${generated?`<div class="banner warn"><b>Generated live by an AI agent just now.</b> It has not been reviewed. Check the sources before you rely on it.</div>`:''}
 <h2 style="margin-top:0">${esc(g.name)} OAuth setup</h2>
 <p>${esc(g.summary)}</p>
 ${dirBanner(g.dirName||g.name)}
 <div class="grid">
  <div class="fact"><b>Difficulty</b>${esc(g.difficultyLabel)}${meter(g.difficulty)}</div>
  <div class="fact"><b>Ready to build</b>${esc(g.time?.devReady)}</div>
  <div class="fact"><b>Ready for real users</b>${esc(g.time?.production)}</div>
  <div class="fact"><b>Approval wait</b>${esc(g.time?.approvalWait)}</div>
 </div>
 <h2>Steps</h2>${(g.stages||[]).map((s,i)=>`<div class="stage"><h3>${i+1}. ${esc(s.title)} <span class="muted">(${esc(s.time)})</span></h3>${list(s.steps)}</div>`).join('')}
 <h2>What you need</h2>${list(g.requirements)}
 <h2>If you get blocked</h2>${(g.blockers||[]).map(b=>`<p><b>${esc(b.issue)}</b><br>${esc(b.fix)}</p>`).join('')}
 <div class="two"><div><h2>An agent can</h2>${list(g.agentCan)}</div><div><h2>You take over for</h2>${list(g.youDo)}</div></div>
 <h2>What this is based on</h2><ul>${claims}</ul>
 <p class="muted"><b>What was tested:</b> ${esc(g.tested)}</p>
 <h2>Sources</h2><ul>${src.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`).join('')}</ul>
 <p class="noprint"><button class="alt" id="share">Copy share link</button> <button class="alt" onclick="print()">Print / save PDF</button></p>
 </article>`;
 $('#share').onclick=()=>{const h=generated?'#g='+btoa(unescape(encodeURIComponent(JSON.stringify(g)))):'#'+g.slug;
  navigator.clipboard.writeText(location.href.split('#')[0]+h);$('#share').textContent='Copied'};
 if(!generated)history.replaceState(null,'','#'+g.slug);
 scrollTo(0,0)}
function findGuide(q){const n=norm(q);if(!n)return null;return G.find(g=>norm(g.dirName||'')===n||norm(g.name.split(' ')[0])===n||g.slug===n||norm(g.website)===n||norm(g.name)===n)}
const gcall=async(model,key,text,tools)=>{const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text}]}],...(tools?{tools}:{})})});const j=await r.json();if(!r.ok)throw new Error(j.error?.message||r.status);return j};
const gtext=j=>(j.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('');
const pj=t=>{const a=t.indexOf('{'),b=t.lastIndexOf('}'),c=t.indexOf('['),d=t.lastIndexOf(']');return JSON.parse(c>=0&&(a<0||c<a)?t.slice(c,d+1):t.slice(a,b+1))};
async function attempt(q,key,model,avoid){
  const j1=await gcall(model,key,`List up to 4 official developer documentation page URLs (on the provider's own domain) about creating an OAuth app, getting it approved or reviewed, verification, and rate limits for "${q}". Return ONLY a JSON array of URL strings.${avoid.length?' Do NOT return these (they could not be fetched): '+avoid.join(' ')+' . Prefer pages you are sure exist, such as documentation index or overview pages.':''}`);
  const urls=pj(gtext(j1)).filter(u=>typeof u==='string'&&/^https:\/\//.test(u)).slice(0,4);
  if(!urls.length)throw new Error('No documentation pages found for this app.');
  const j2=await gcall(model,key,`Read these official pages: ${urls.join(' ')}\nThen write an OAuth setup guide for "${q}" using ONLY what these pages say. Return ONLY one JSON object with the same keys as this example:\n${JSON.stringify(G[1],null,1)}\nRules: difficulty is 1-5. "sources" are the pages you actually read (title, url). Tag a claim "verified" only if one of those pages states it ("src" = index in sources); "inferred" if you reason from them; "unverified" if the pages do not say it. Do NOT invent review times, fees or limits: say not found. Set "slug" lowercase and "managed" false. Simple English.`,[{url_context:{}}]);
  const meta=j2.candidates?.[0]?.urlContextMetadata?.urlMetadata||[];
  const fetched=new Set(meta.filter(m=>m.urlRetrievalStatus==='URL_RETRIEVAL_STATUS_SUCCESS').map(m=>m.retrievedUrl));
  const failed=meta.filter(m=>!fetched.has(m.retrievedUrl)).map(m=>m.retrievedUrl);
  return {g:pj(gtext(j2)),fetched,failed,total:meta.length}}
async function generate(q){
 const key=localStorage.gkey,model=localStorage.gmodel||'gemini-3.1-flash-lite';
 if(!key){$('#main').innerHTML=`<div class="card"><b>"${esc(q)}" is not in the library yet.</b><p>Live generation needs a Gemini API key (a free one from Google AI Studio works). Open "Live generation settings" below, paste a key, then look this up again. Your key stays in this browser.</p></div>`;$('#settings details').open=true;return}
 $('#main').innerHTML=`<div class="card"><b>Investigating ${esc(q)}...</b><p class="muted">An agent is picking the provider's doc pages and reading them. If pages fail to load it tries once more. This can take up to a minute.</p></div>`;
 try{
  let best=await attempt(q,key,model,[]);
  if(best.fetched.size<2){try{const r2=await attempt(q,key,model,best.failed);if(r2.fetched.size>best.fetched.size)best=r2}catch(e){}}
  const {g,fetched,total}=best;g.name=g.name||q;
  const keep=[],remap=new Map();(g.sources||[]).forEach((s,i)=>{if(fetched.has(s.url)){remap.set(i,keep.length);keep.push(s)}});
  fetched.forEach(u=>{if(!keep.some(s=>s.url===u))keep.push({title:u,url:u})});
  let down=0;g.claims=(g.claims||[]).map(c=>{if(c.status==='verified'&&!remap.has(c.src)){down++;return{...c,status:'unverified',src:undefined,note:'Not backed by a page that was successfully fetched.'}}return remap.has(c.src)?{...c,src:remap.get(c.src)}:c});
  g.sources=keep;
  g.tested=`Docs read by an AI agent. ${fetched.size} of ${total} pages were fetched successfully; ${down} claim(s) downgraded because no fetched page supported them. No account was created and no OAuth flow was run.`;
  window.__lastGuide=g;render(g,true)
 }catch(e){$('#main').innerHTML=`<div class="card"><b>Could not generate a guide.</b><p>${esc(e.message)}</p><p class="muted">Check the API key and model name in settings, then try again.</p></div>`}}
function dirList(filter){
 const f=norm(filter||'');const all=[...D.managed.map(n=>[n,'managed']),...D.byo.map(n=>[n,'byo'])].sort((a,b)=>a[0].localeCompare(b[0]));
 const rows=all.filter(([n])=>!f||norm(n).includes(f));
 const has=n=>G.find(g=>norm(g.dirName||g.name.split(' ')[0])===norm(n));
 $('#dirrows').innerHTML=rows.slice(0,80).map(([n,t])=>{const g=has(n);return `<div class="row"><span><b>${esc(n)}</b> <span class="tag ${t==='managed'?'verified':'inferred'}">${t==='managed'?'Composio managed':'bring your own'}</span></span>${g?`<button class="alt" data-open="${g.slug}">Open guide</button>`:`<button class="alt" data-gen="${esc(n)}">Generate</button>`}</div>`}).join('')+(rows.length>80?`<p class="muted">Showing 80 of ${rows.length}. Type to filter.</p>`:'')||'<p class="muted">No match.</p>';
 $('#dircount').textContent=`${rows.length} of ${all.length}`}
async function init(){
 [G,D]=await Promise.all([fetch('data/guides.json').then(r=>r.json()),fetch('data/directory.json').then(r=>r.json())]);
 D.checked=D.checked;
 $('#chips').innerHTML=G.map(g=>`<button data-s="${g.slug}">${esc(g.name)}</button>`).join('');
 $('#chips').onclick=e=>{const s=e.target.dataset.s;if(s)render(G.find(g=>g.slug===s))};
 $('#dirq').oninput=e=>dirList(e.target.value);dirList('');
 $('#dirrows').onclick=e=>{const o=e.target.dataset.open,n=e.target.dataset.gen;if(o){render(G.find(g=>g.slug===o))}else if(n){$('#q').value=n;$('#f').requestSubmit()}};
 $('#key').value=localStorage.gkey||'';$('#model').value=localStorage.gmodel||'gemini-3.1-flash-lite';
 $('#save').onclick=()=>{localStorage.gkey=$('#key').value.trim();localStorage.gmodel=$('#model').value.trim();$('#save').textContent='Saved'};
 $('#f').onsubmit=e=>{e.preventDefault();const q=$('#q').value.trim();if(!q)return;const g=findGuide(q);g?render(g):generate(q)};
 const h=location.hash.slice(1);
 if(h.startsWith('g=')){try{render(JSON.parse(decodeURIComponent(escape(atob(h.slice(2))))),true)}catch(e){}}
 else if(h){const g=G.find(x=>x.slug===h);if(g)render(g)}
 else $('#main').innerHTML=`<div class="card muted">Pick an app above or search for one. Library: ${G.length} researched guides. Composio's directory lists ${D.managed.length} managed OAuth apps and ${D.byo.length} bring-your-own apps; browse them below and generate a guide for any of them.</div>`}
init();
