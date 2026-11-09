import {DEFAULTS,tools,createModel,stepsFor,number,money,estimate,parseProject,projectFile,cutCSV} from './core.js';
import {Viewer} from './viewer.js';
import {createPlan} from './pdf.js';
const $=id=>document.getElementById(id), config=window.WERKSTUECK_CONFIG;
const key='werkstueck:v1:'+config.environment;let stored={};
try{stored=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{}
let model;try{model=createModel(stored.dimensions||DEFAULTS);}catch{model=createModel();}
let checks=Array.isArray(stored.tools)?stored.tools:[],done=Array.isArray(stored.done)?stored.done:[],step=0,timer=null;
const save=()=>{try{localStorage.setItem(key,JSON.stringify({dimensions:model.dimensions,tools:checks,done}));}catch{$('import-status').textContent='Browserspeicher nicht verfügbar. Du kannst deinen Entwurf als Datei speichern.';}};
if(config.environment!=='production'){$('environment').hidden=false;$('environment').textContent=config.environment==='test'?'TESTUMGEBUNG · Hier prüfen wir neue Funktionen und Baupläne.':'LOKALE VORSCHAU · Dein Werkstück entsteht.';}
$('version-label').textContent=`${config.environment==='production'?'Live':config.environment==='test'?'Test':'Entwicklung'} · v${config.version} · ${config.sourceSha.slice(0,7)}`;
let selectPart=p=>{view.selected=p.id;view.draw();$('part-info').textContent=`${p.id} · ${p.name} · ${p.cut.map(n=>number(n)).join(' × ')} mm`;$('part-buttons').querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b.dataset.id===p.id);b.setAttribute('aria-pressed',String(b.dataset.id===p.id));});};
const hero=new Viewer($('hero-canvas'),model,{dimensions:true});
const card=new Viewer($('card-canvas'),model,{interactive:false});
const view=new Viewer($('model-canvas'),model,{dimensions:true,onSelect:p=>selectPart(p)});
const assembly=new Viewer($('step-canvas'),model,{labels:true});
const viewers=[hero,card,view,assembly];
function populateForm(){for(const [k,v] of Object.entries(model.dimensions))$('dimensions').elements[k].value=Number((k==='thickness'?v:v/10).toFixed(6));}
function tableRows(){return model.parts.map(p=>`<tr><td><span class="part-id">${p.id}</span></td><th scope="row">${p.name}</th><td class="mono">${p.cut.map(n=>number(n,3)).join(' × ')} <span class="muted">mm</span></td><td>1</td><td>${p.note}</td></tr>`).join('');}
function render(){
 $('overall-size').textContent=model.overall.map(n=>number(n/10,3)).join(' × ')+' cm';
 $('cut-list').innerHTML=tableRows();
 $('part-buttons').replaceChildren(...model.parts.map(p=>{const b=document.createElement('button');b.type='button';b.dataset.id=p.id;b.textContent=`${p.id} ${p.name}`;b.setAttribute('aria-pressed','false');b.onclick=()=>selectPart(p);return b;}));
 $('part-info').textContent='Bauteil auswählen oder Modell drehen';view.selected=null;
 viewers.forEach(v=>v.update(model));renderStep();renderCost();
}
function renderCost(){
 try{const q=$('quantity').valueAsNumber,p=$('wood-price').valueAsNumber,h=$('hardware-price').valueAsNumber,cost=estimate(model,q,p,h);$('cost-total').textContent=money(cost.total);$('cost-detail').textContent=`${number(cost.area)} m² inklusive Flächenreserve · ${q} ${q===1?'Kiste':'Kisten'} · ${q*20} Schrauben (Entwurfsmenge)`;}
 catch{$('cost-total').textContent='—';$('cost-detail').textContent='Bitte gültige Preise und eine ganze Stückzahl von 1 bis 100 eingeben.';}
}
function renderStep(){
 const steps=stepsFor(model),s=steps[step];assembly.stage=step;assembly.selected=null;assembly.draw();
 $('step-tabs').replaceChildren(...steps.map((s,i)=>{const b=document.createElement('button');b.type='button';b.textContent=String(i+1).padStart(2,'0');b.className=i===step?'active':'';b.setAttribute('aria-label',`Schritt ${i+1}: ${s.title}`);b.setAttribute('aria-pressed',String(i===step));b.onclick=()=>{stopPlay();step=i;renderStep();};return b;}));
 $('step-body').innerHTML=`<span class="eyebrow">SCHRITT ${step+1} / ${steps.length} · TEILE ${s.parts}</span><h3>${s.title}</h3><p>${s.text}</p><div class="step-tip"><span>↳ GUT ZU WISSEN</span><p>${s.check}</p></div>`;
 $('step-caption').textContent=`${String(step+1).padStart(2,'0')} / ${s.title}`;
 $('previous').disabled=step===0;$('next').disabled=step===steps.length-1;
 $('step-done').checked=Boolean(done[step]);$('progress-text').textContent=`${done.filter(Boolean).length} von ${steps.length} Schritten erledigt`;
}
function stopPlay(){clearInterval(timer);timer=null;$('play').textContent='▷ Aufbau abspielen';$('play').setAttribute('aria-pressed','false');}
$('play').onclick=()=>{if(timer){stopPlay();return;}if(step===4)step=0;renderStep();$('play').textContent='Ⅱ Aufbau pausieren';$('play').setAttribute('aria-pressed','true');timer=setInterval(()=>{if(step<4){step++;renderStep();}else stopPlay();},4500);};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlay();});
$('previous').onclick=()=>{stopPlay();step=Math.max(0,step-1);renderStep();};$('next').onclick=()=>{stopPlay();step=Math.min(4,step+1);renderStep();};
$('step-done').onchange=e=>{done[step]=e.target.checked;save();renderStep();};
$('tools').replaceChildren(...tools.map((tool,i)=>{const label=document.createElement('label'),input=document.createElement('input'),span=document.createElement('span');input.type='checkbox';input.checked=Boolean(checks[i]);span.textContent=tool;input.onchange=()=>{checks[i]=input.checked;save();};label.append(input,span);return label;}));
$('dimensions').onsubmit=e=>{e.preventDefault();try{const values={};for(const k of Object.keys(DEFAULTS))values[k]=$('dimensions').elements[k].valueAsNumber*(k==='thickness'?1:10);const next=createModel(values);if(next.fingerprint!==model.fingerprint){done=[];stopPlay();step=0;}model=next;$('dimension-error').hidden=true;save();render();}catch(err){$('dimension-error').textContent=err.message;$('dimension-error').hidden=false;}};
for(const id of['quantity','wood-price','hardware-price'])$(id).addEventListener('input',renderCost);
function setExplode(value){view.explode=value;view.draw();$('assembled').classList.toggle('active',!value);$('exploded').classList.toggle('active',Boolean(value));$('assembled').setAttribute('aria-pressed',String(!value));$('exploded').setAttribute('aria-pressed',String(Boolean(value)));}
$('assembled').onclick=()=>setExplode(0);$('exploded').onclick=()=>setExplode(1);
$('zoom-in').onclick=()=>view.changeZoom(.15);$('zoom-out').onclick=()=>view.changeZoom(-.15);$('reset-view').onclick=()=>view.reset();
function download(content,name,type){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('csv').onclick=()=>download(cutCSV(model),'werkstattkiste-zuschnitt.csv','text/csv;charset=utf-8');
$('export-project').onclick=()=>download(projectFile(model.dimensions),'werkstattkiste-entwurf.json','application/json');
$('import-project').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>100000)throw new Error('Diese Datei ist zu groß. Bitte eine gespeicherte Werkstück-Projektdatei wählen.');const dimensions=parseProject(await file.text());model=createModel(dimensions);done=[];step=0;stopPlay();populateForm();save();render();$('import-status').textContent='Entwurf geöffnet. Modell und Listen sind aktualisiert.';}catch(err){$('import-status').textContent='Entwurf konnte nicht geöffnet werden: '+err.message;}e.target.value='';};
function filter(){const term=$('search').value.trim().toLocaleLowerCase('de-DE');const match='werkstattkiste kiste werkstatt ordnung holz einfach'.includes(term);$('project-card').hidden=!match;$('empty-search').hidden=match;}
for(const id of['search','category','difficulty'])$(id).addEventListener('input',filter);
$('storage-reset').onclick=()=>$('reset-dialog').showModal();$('cancel-reset').onclick=()=>$('reset-dialog').close();$('confirm-reset').onclick=()=>{checks=[];done=[];save();$('tools').querySelectorAll('input').forEach(i=>i.checked=false);renderStep();$('reset-dialog').close();};
$('print-full').onclick=()=>downloadPlan(true);$('print-quick').onclick=()=>downloadPlan(false);
for(const id of ['print-full','print-quick'])$(id).querySelector('b').textContent='PDF herunterladen ↓';
async function downloadPlan(full){
 const button=$(full?'print-full':'print-quick');button.disabled=true;stopPlay();
 const before={stage:assembly.stage,selected:assembly.selected};
 try{const images=[];assembly.selected=null;assembly.stage=4;assembly.draw();images.push(assembly.canvas.toDataURL('image/png'));
 if(full)for(let i=0;i<5;i++){assembly.stage=i;assembly.draw();images.push(assembly.canvas.toDataURL('image/png'));}
 const bytes=await createPlan(model,{full,images,version:config.version});download(bytes,full?'werkstattkiste-schritt-fuer-schritt.pdf':'werkstattkiste-werkstattplan.pdf','application/pdf');$('download-status').textContent='Dein PDF wurde erstellt.';
 }catch(err){$('import-status').textContent='PDF konnte nicht erstellt werden. Bitte erneut versuchen.';console.error(err);}
 finally{assembly.stage=before.stage;assembly.selected=before.selected;assembly.draw();button.disabled=false;}
}
populateForm();render();
