import test from 'node:test';import assert from 'node:assert/strict';
import {createModel,PROJECTS} from './core.js';
import {workshopFor} from './workshop.js';import {workshopSVG} from './workshop-art.js';
const defaults=PROJECTS.find(p=>p.id==='garderobe').defaults;
test('DF500 example uses independent practical reference positions and correct face/edge geometry',()=>{
 const m=createModel(defaults,'garderobe','domino'),c=workshopFor(m);
 assert.deepEqual(c.positions,[100,300,500]);assert.equal(c.dowels,3);assert.equal(c.axis,9);assert.equal(c.pocketDepth,10);assert.equal(c.depthSetting,20);assert.equal(c.rest,8);assert.equal(c.angle,90);
 assert.equal(m.parts[0].center[1]+m.parts[0].size[1]/2,m.parts[1].center[1]-m.parts[1].size[1]/2);
 assert.equal(m.parts[0].center[2]-m.parts[0].size[2]/2,m.parts[1].center[2]-m.parts[1].size[2]/2);
 const shelfDepth=m.parts[1].size[2],back=-shelfDepth/2;
 assert.equal(back+c.axis,m.parts[0].center[2]);
});
test('course marks, count, settings and real face remainder follow free dimensions',()=>{
 for(const width of[400,613.7,760,1000])for(const thickness of[16,17.2,18,24]){
  const m=createModel({...defaults,width,thickness},'garderobe','domino'),c=workshopFor(m);
  assert.deepEqual(c.positions,m.joinery.rows[0].positions);assert.equal(c.dowels,m.joinery.count);assert.equal(c.axis,thickness/2);assert.equal(c.rest,thickness-10);assert.ok(c.rest>=6);
  assert.ok(c.positions.every(x=>x-12>=37&&x+12<=width-37));
  const text=c.steps.map(s=>s.setting+' '+s.reference+' '+s.actions.join(' ')+' '+s.check).join(' ');
  assert.ok(text.includes(new Intl.NumberFormat('de-DE',{maximumFractionDigits:3}).format(thickness/2)+' mm'));
 }
});
test('full 24-step course includes marking, physical setup, trial, both plunges, assembly and hardware',()=>{
 const c=workshopFor(createModel(defaults,'garderobe','domino'));assert.equal(c.steps.length,24);assert.equal(new Set(c.steps.map(s=>s.id)).size,24);
 for(const s of c.steps){assert.equal(s.actions.length,3);for(const key of['setting','reference','check','caption'])assert.ok(s[key].length>30);const svg=workshopSVG(c,s);assert.ok(svg.startsWith('<svg'));assert.ok(svg.includes('<title>'));assert.ok(!/NaN|undefined/.test(svg));assert.ok(!/https?:/.test(svg.replace('http://www.w3.org/2000/svg','')));}
 const by=id=>c.steps.find(s=>s.id===id);
 assert.ok(by('probe').actions.some(s=>s.includes('Winkel')));assert.ok(by('ablage-ansetzen').reference.includes('U zeigt zu dir'));assert.ok(by('lochbreite').actions.some(s=>s.includes('laufendem Motor')));assert.ok(by('wand').check.includes('Ohne')||by('wand').check.includes('ohne'));
 assert.ok(c.steps.findIndex(s=>s.id==='probe')<c.steps.findIndex(s=>s.id==='brett-fraesen'));
 assert.ok(c.steps.findIndex(s=>s.id==='trocken')<c.steps.findIndex(s=>s.id==='leim'));
});
test('illustrated course stays specific to the chosen construction and connection',()=>{
 for(const p of PROJECTS)for(const type of p.connections){const m=createModel(p.defaults,p.id,type);assert.equal(Boolean(workshopFor(m)),p.id==='garderobe'&&type==='domino');}
});

test('picture instructions project every mark from the current part and never draw a machine',()=>{
 for(const thickness of[16,18,24])for(const width of[400,600,1000]){
  const c=workshopFor(createModel({...defaults,width,thickness},'garderobe','domino'));
  for(const s of c.steps){const svg=workshopSVG(c,s);assert.match(svg,/data-illustration="workpiece-only"/);assert.ok(s.visual.instruction.length>30);assert.ok(s.visual.view.length>30);assert.ok(!/Schraubzwinge|Sägeblatt|Maschinengehäuse|<image/.test(svg));}
  for(const id of['achse-ablage','ablage-fraesen']){const svg=workshopSVG(c,c.steps.find(s=>s.id===id));for(const x of c.positions){if(id==='ablage-fraesen')assert.ok(svg.includes(`data-x-mm="${x}" data-offset-mm="${thickness/2}"`));}assert.ok(svg.includes('stroke-dasharray'));
  }
  const svg=workshopSVG(c,c.steps.find(s=>s.id==='wand'));assert.ok(svg.includes(`data-x-mm="50" data-y-mm="${defaults.height/4}"`));assert.ok(svg.includes(`data-x-mm="${width-50}"`));
 }
});
