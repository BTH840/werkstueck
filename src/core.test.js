import test from 'node:test';import assert from 'node:assert/strict';
import {createModel,validateDimensions,DEFAULTS,estimate,parseProject,projectFile,cutCSV,stepsFor} from './core.js';
test('default geometry closes without overlaps and uses real material thickness',()=>{
 const m=createModel();assert.deepEqual(m.overall,[600,360,218]);
 assert.deepEqual(m.parts.map(p=>p.cut),[[600,360,18],[600,200,18],[324,200,18],[324,200,18],[600,200,18]]);
 const back=m.parts[1],left=m.parts[2],front=m.parts[4];
 assert.equal(back.center[2]+back.size[2]/2,left.center[2]-left.size[2]/2);
 assert.equal(front.center[2]-front.size[2]/2,left.center[2]+left.size[2]/2);
 for(const p of m.parts.slice(1))assert.equal(p.center[1]-p.size[1]/2,18);
 assert.ok(Math.abs(m.area-.5856)<1e-10);
});
test('decimal centimetre dimensions do not snap to a fixed grid',()=>{
 const m=createModel({width:613.7,depth:367.3,height:207.9,thickness:17.2});
 assert.equal(m.dimensions.width,613.7);assert.ok(Math.abs(m.parts[2].cut[0]-332.9)<1e-10);assert.ok(Math.abs(m.overall[2]-225.1)<1e-10);
});
test('limits reject NaN, infinite, missing, string and physically invalid dimensions',()=>{
 for(const n of[NaN,Infinity,0,-100,299.9,1000.1,'600'])assert.throws(()=>validateDimensions({...DEFAULTS,width:n}));
 assert.throws(()=>validateDimensions({}));
});
test('quantity and reserve scale material cost and reject invalid quantities',()=>{
 const m=createModel(),a=estimate(m,1,35,4),b=estimate(m,3,35,4);assert.ok(Math.abs(b.total-a.total*3)<1e-10);
 assert.ok(Math.abs(a.area-m.area*1.15)<1e-10);assert.ok(Math.abs(a.total-27.5704)<1e-8);
 for(const q of[0,1.5,101,NaN])assert.throws(()=>estimate(m,q,35,4));assert.throws(()=>estimate(m,1,-1,4));
});
test('project export round-trips and rejects foreign schemas and malicious values',()=>{
 assert.deepEqual(parseProject(projectFile(DEFAULTS)),DEFAULTS);
 assert.throws(()=>parseProject('{"schema":"other"}'));
 assert.throws(()=>parseProject(JSON.stringify({schema:'werkstueck/v1',project:'werkstattkiste',dimensions:{...DEFAULTS,width:'<script>'}})));
});
test('CSV has five consistent parts and instructions reflect custom dimensions',()=>{
 const m=createModel({...DEFAULTS,width:720,depth:425});const csv=cutCSV(m);assert.equal(csv.split('\r\n').length,6);
 assert.ok(csv.startsWith('\ufeff'));assert.ok(csv.includes('"389"'));assert.ok(stepsFor(m)[0].text.includes('720 × 425'));
});
