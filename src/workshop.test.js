import test from 'node:test';import assert from 'node:assert/strict';
import {createModel,PROJECTS,projectFile,parseProject} from './core.js';
import {workshopFor} from './workshop.js';import {workshopSVG,partBlockGeometry,partProjection} from './workshop-art.js';
const defaults=PROJECTS.find(p=>p.id==='garderobe').defaults;
const hardware={hookCount:2,hookHoles:[{dx:0,dy:-10,diameter:2,depth:12},{dx:0,dy:10,diameter:2,depth:12}],boardDiameter:5,wallDiameter:8,wallDepth:50};
test('picture sequence begins with finished piece and named exploded view',()=>{
 const c=workshopFor(createModel(defaults,'garderobe','domino'));assert.equal(c.steps.length,12);assert.deepEqual(c.steps.slice(0,4).map(s=>s.figure),['overview','exploded-names','cut-board','cut-shelf']);
 assert.deepEqual([...new Set(c.steps.map(s=>s.phase))],['Überblick','Zuschnitt','Bohren & Fräsen','Zusammensetzen']);
 const svg=workshopSVG(c,c.steps[1]);for(const name of['Hakenbrett','Ablage','DOMINO-Dübel','Haken'])assert.ok(svg.includes(name));
});
test('each milling pocket has unique ID and absolute coordinates for both partners',()=>{
 const c=workshopFor(createModel(defaults,'garderobe','domino'));assert.equal(c.axis,9);assert.equal(c.rest,8);
 assert.deepEqual(c.pockets.map(p=>[p.id,p.part,p.x,p.y,p.width,p.height,p.depth]),[
 ['F1','01',100,9,17,4,10],['F2','01',300,9,17,4,10],['F3','01',500,9,17,4,10],
 ['F4','02',100,9,17,4,10],['F5','02',300,9,23,4,10],['F6','02',500,9,23,4,10]]);
 assert.ok(workshopSVG(c,c.steps.find(s=>s.figure==='route-face')).includes('F6'));
});
test('open hardware never becomes an invented drilling pattern or diameter',()=>{
 const c=workshopFor(createModel(defaults,'garderobe','domino'));assert.equal(c.hookBores.length,0);assert.equal(c.hookCenters.length,5);
 assert.deepEqual(c.boardBores.map(p=>[p.x,p.y,p.diameter,p.depth]),[[50,50,null,18],[550,50,null,18]]);
 assert.ok(c.wallBores.every(p=>p.diameter===null&&p.depth===null));const svg=workshopSVG(c,c.steps.find(s=>s.figure==='drill-board'));assert.ok(svg.includes('Lochbild offen'));assert.ok(!svg.includes('data-mark="hook-bore"'));
});
test('actual two-hole hook pattern produces ten individually identified bores',()=>{
 const c=workshopFor(createModel(defaults,'garderobe','domino',hardware));assert.equal(c.hookBores.length,10);
 assert.deepEqual(c.hookBores.map(p=>[p.x,p.y]),[[60,90],[60,110],[180,90],[180,110],[300,90],[300,110],[420,90],[420,110],[540,90],[540,110]]);
 assert.deepEqual(c.hookBores.map(p=>p.id),Array.from({length:10},(_,i)=>'H'+(i+1)));assert.ok(c.hookBores.every(p=>p.diameter===2&&p.depth===12));
 assert.ok(c.wallBores.every(p=>p.diameter===8&&p.depth===50));
});
test('hardware data round-trips through project files and validates before use',()=>{
 const file=projectFile(defaults,'garderobe','domino',hardware),p=parseProject(file);assert.deepEqual(p.hardware,hardware);
 assert.throws(()=>createModel(defaults,'garderobe','domino',{...hardware,hookHoles:[{dx:0,dy:0,diameter:2,depth:16}]}));
 assert.throws(()=>createModel(defaults,'garderobe','domino',{...hardware,hookHoles:[{dx:-80,dy:0,diameter:2,depth:12}]}));
 assert.throws(()=>createModel(defaults,'garderobe','domino',{hookCount:3}));assert.throws(()=>createModel(defaults,'garderobe','domino',{wallDepth:NaN}));
});
test('every pocket and supplied bore follows free dimensions',()=>{
 for(const thickness of[16,17.2,18,24])for(const width of[400,613.7,1000]){
  const m=createModel({...defaults,width,thickness},'garderobe','domino',hardware),c=workshopFor(m);
  assert.deepEqual(c.positions,m.joinery.rows[0].positions);assert.ok(c.pockets.every(p=>p.y===thickness/2));assert.equal(c.boardBores[1].x,width-50);assert.equal(c.hookBores[0].x,Math.round(width*.1*1000)/1000);
  for(const s of c.steps){const svg=workshopSVG(c,s);assert.match(svg,/data-illustration="workpiece-only"/);assert.ok(!/NaN|undefined|<image/.test(svg));}
 }
});
test('all boards share the visible faces and project shared edges consistently',()=>{
 const faces=partBlockGeometry(600,120,18),ray=[-.42,1,.70/.90];assert.deepEqual(faces.map(f=>f.face),['left','front','top']);
 for(const face of faces){assert.equal(face.points.length,4);assert.ok(face.normal.reduce((s,n,i)=>s+n*ray[i],0)>0);}
 assert.deepEqual(partProjection(0,120,0),[50.4,84]);const top=partProjection(0,120,18),bottom=partProjection(0,120,0);assert.ok(Math.abs(bottom[1]-top[1]-16.2)<1e-9);
});
test('course remains limited to the DOMINO coat-rack construction',()=>{
 for(const p of PROJECTS)for(const connection of p.connections)assert.equal(Boolean(workshopFor(createModel(p.defaults,p.id,connection))),p.id==='garderobe'&&connection==='domino');
});
