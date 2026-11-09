import test from 'node:test';import assert from 'node:assert/strict';
import {createModel,PROJECTS} from './core.js';
import {workshopFor} from './workshop.js';import {workshopSVG,partBlockGeometry,partProjection} from './workshop-art.js';
const defaults=PROJECTS.find(p=>p.id==='garderobe').defaults;
test('DF500 example keeps validated default marks and face material',()=>{
 const m=createModel(defaults,'garderobe','domino'),c=workshopFor(m);
 assert.deepEqual(c.positions,[100,300,500]);assert.equal(c.dowels,3);assert.equal(c.axis,9);assert.equal(c.pocketDepth,10);assert.equal(c.depthSetting,20);assert.equal(c.rest,8);assert.equal(c.angle,90);
 assert.equal(m.parts[0].center[1]+m.parts[0].size[1]/2,m.parts[1].center[1]-m.parts[1].size[1]/2);
 assert.equal(m.parts[0].center[2]-m.parts[0].size[2]/2,m.parts[1].center[2]-m.parts[1].size[2]/2);
});
test('ten picture steps start with individual cuts, then machining, then assembly',()=>{
 const c=workshopFor(createModel(defaults,'garderobe','domino'));
 assert.equal(c.steps.length,10);assert.deepEqual(c.steps.slice(0,2).map(s=>s.figure),['cut-board','cut-shelf']);
 assert.deepEqual(c.steps.map(s=>s.phase),[...Array(2).fill('1 · Zuschnitt'),...Array(5).fill('2 · Bohren & Fräsen'),...Array(3).fill('3 · Zusammensetzen')]);
 assert.equal(new Set(c.steps.map(s=>s.id)).size,10);
});
test('every mark follows free dimensions; numeric settings stay consistent',()=>{
 for(const thickness of[16,17.2,18,24])for(const width of[400,613.7,1000]){
  const m=createModel({...defaults,width,thickness},'garderobe','domino'),c=workshopFor(m);
  assert.deepEqual(c.positions,m.joinery.rows[0].positions);assert.equal(c.axis,thickness/2);assert.equal(c.rest,thickness-10);
  for(const s of c.steps){const svg=workshopSVG(c,s);assert.match(svg,/data-illustration="workpiece-only"/);assert.ok(!/NaN|undefined|<image|Maschinengehäuse|Schraubzwinge/.test(svg));}
  const route=workshopSVG(c,c.steps[5]);for(const x of c.positions)assert.ok(route.includes(`data-x-mm="${x}" data-offset-mm="${thickness/2}"`));
  const drill=workshopSVG(c,c.steps[6]);assert.ok(drill.includes(`data-x-mm="50" data-y-mm="50"`));assert.ok(drill.includes(`data-x-mm="${width-50}"`));
 }
});
test('board projection uses the visible left face, without an impossible right-face triangle',()=>{
 const faces=partBlockGeometry(600,120,18),ray=[-.42,1,.70/.90];
 assert.deepEqual(faces.map(f=>f.face),['left','front','top']);
 for(const face of faces){assert.equal(face.points.length,4);assert.ok(face.normal.reduce((s,n,i)=>s+n*ray[i],0)>0);}
 assert.deepEqual(partProjection(0,120,0),[50.4,84]);
 const top=partProjection(0,120,18),bottom=partProjection(0,120,0);assert.equal(top[0],bottom[0]);assert.ok(Math.abs(bottom[1]-top[1]-16.2)<1e-9);
 const front=faces.find(f=>f.face==='front').points,left=faces.find(f=>f.face==='left').points;
 assert.deepEqual(front[0],left[1]);assert.deepEqual(front[3],left[2]);
});
test('course remains specific to the DOMINO coat-rack construction',()=>{
 for(const p of PROJECTS)for(const connection of p.connections)assert.equal(Boolean(workshopFor(createModel(p.defaults,p.id,connection))),p.id==='garderobe'&&connection==='domino');
});
