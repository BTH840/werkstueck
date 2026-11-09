import {workshopFor,WORKSHOP_REVISION} from './workshop.js';
import {workshopSVG} from './workshop-art.js';
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export class WorkshopView{
 constructor(root,{onActivate,download,storageKey}){
  this.root=root;this.download=download;this.storageKey=storageKey;this.index=0;this.done=[];
  root.innerHTML=`<div class="workshop-intro"><h2>Garderobe · Bildanleitung</h2></div><div class="workshop-invite"><button class="button primary" data-course="activate">DOMINO-Beispiel öffnen ↗</button></div><div class="workshop-content" hidden><div class="picture-toolbar"><div class="course-phases" role="group" aria-label="Abschnitt auswählen"></div><button class="button secondary" data-course="pdf">PDF ↓</button></div><div class="picture-step-list" role="group" aria-label="Bildschritt auswählen"></div><div class="course-layout"><h3 class="sr-only" tabindex="-1" data-course="title"></h3><figure class="course-figure"><div data-course="art"></div><button class="button secondary" data-course="zoom">Vergrößern ⤢</button></figure></div><div class="course-footer"><button class="button secondary" data-course="previous">← Zurück</button><span data-course="counter"></span><button class="button primary" data-course="next">Weiter →</button></div><div class="picture-bottom"><label><input type="checkbox" data-course="done"> Erledigt</label><details class="course-sources"><summary>Quellen & Hinweise</summary><div data-course="sources"></div></details></div></div><dialog class="course-dialog" aria-label="Vergrößerte Werkstückzeichnung"><div class="course-dialog-top"><strong></strong><button class="button secondary" data-course="close">Schließen ×</button></div><div class="course-zoom-art"></div></dialog>`;
  this.q=name=>root.querySelector(`[data-course="${name}"]`);
  this.q('activate').onclick=onActivate;
  this.q('previous').onclick=()=>this.go(this.index-1);this.q('next').onclick=()=>this.go(this.index+1);
  this.q('done').onchange=e=>{this.done[this.index]=e.target.checked;this.persist();this.renderProgress();};this.q('pdf').onclick=()=>download();
  this.q('zoom').onclick=()=>{const dlg=root.querySelector('dialog');dlg.querySelector('strong').textContent=this.course.steps[this.index].title;dlg.querySelector('.course-zoom-art').innerHTML=workshopSVG(this.course,this.course.steps[this.index]);dlg.showModal();};this.q('close').onclick=()=>root.querySelector('dialog').close();
 }
 update(model){
  this.root.hidden=model.project.id!=='garderobe';if(this.root.hidden)return;
  this.course=workshopFor(model);this.root.querySelector('.workshop-invite').hidden=Boolean(this.course);this.root.querySelector('.workshop-content').hidden=!this.course;if(!this.course)return;
  const identity=WORKSHOP_REVISION+model.fingerprint;
  if(identity!==this.identity){this.identity=identity;this.index=0;this.done=[];try{const s=JSON.parse(localStorage.getItem(this.storageKey)||'null');if(s?.identity===identity){this.index=Math.max(0,Math.min(this.course.steps.length-1,Number(s.index)||0));this.done=Array.isArray(s.done)?s.done:[];}}catch{}}
  const c=this.course,phases=[...new Set(c.steps.map(s=>s.phase))];
  this.root.querySelector('.course-phases').replaceChildren(...phases.map(phase=>{const b=document.createElement('button');b.type='button';b.textContent=phase;b.dataset.phase=phase;b.onclick=()=>this.go(c.steps.findIndex(s=>s.phase===phase));return b;}));
  this.root.querySelector('.picture-step-list').replaceChildren(...c.steps.map((s,i)=>{const b=document.createElement('button');b.type='button';b.textContent=String(i+1).padStart(2,'0');b.setAttribute('aria-label',`Bildschritt ${i+1}: ${s.title}`);b.dataset.pictureStep=i;b.onclick=()=>this.go(i);return b;}));
  this.q('sources').innerHTML=[...c.sources,c.illustrationReference].map(s=>`<p><a href="${escape(s.url)}" target="_blank" rel="noopener">${escape(s.title)} ↗</a><br>${escape(s.note)}</p>`).join('');this.render();
 }
 go(index){this.index=Math.max(0,Math.min(this.course.steps.length-1,index));this.render();this.persist();this.q('title').focus({preventScroll:true});if(this.root.querySelector('.course-layout').getBoundingClientRect().top<0)this.root.querySelector('.course-layout').scrollIntoView({block:'start',behavior:'instant'});}
 render(){const s=this.course.steps[this.index];this.q('title').textContent=s.title;this.q('art').innerHTML=workshopSVG(this.course,s);this.q('counter').textContent=`${this.index+1} / ${this.course.steps.length}`;this.q('previous').disabled=this.index===0;this.q('next').disabled=this.index===this.course.steps.length-1;this.q('done').checked=Boolean(this.done[this.index]);this.root.querySelectorAll('[data-phase]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.phase===s.phase)));this.renderProgress();}
 renderProgress(){this.root.querySelectorAll('[data-picture-step]').forEach(b=>{const i=Number(b.dataset.pictureStep);b.setAttribute('aria-pressed',String(i===this.index));b.classList.toggle('picture-complete',Boolean(this.done[i]));});}
 reset(){if(!this.course)return;this.index=0;this.done=[];this.persist();this.render();}
 persist(){try{localStorage.setItem(this.storageKey,JSON.stringify({identity:this.identity,index:this.index,done:this.done}));}catch{}}
}
