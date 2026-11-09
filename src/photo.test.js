import test from 'node:test';import assert from 'node:assert/strict';
import {cameraPoint,boardCorners,rotatePoint} from './geometry.js';
import {treeExample,treeLayout,normalizePhotoDraft,photoQuestions,photoValidation,photoModel,photoDraftFile,solidIntersections} from './photo-model.js';
import {analysisRequest,analyzePhotos} from '../server/analysis.js';
import {photoSVG} from './photo-art.js';
const answered=()=>{const d=treeLayout(treeExample(),{width:60,thickness:18,angle:22.5,gap:220,baseLength:450});d.parts.forEach(p=>p.endCut='square');d.questions.forEach(q=>q.answer='Bestätigt am eigenen Entwurf; Originalrückseite unbekannt.');d.material='Trockenes Massivholz, Innenbereich';d.connection='Eigene Konstruktion. Verbindungen am Probebau prüfen; dieses Testmodell enthält keine ausgeführten Bohrungen.';d.geometryConfirmed=true;d.connectionConfirmed=true;return d;};
test('camera preserves lengths, orthogonality and true rectangles in front view',()=>{
 const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);for(const yaw of[-2,-.7,0,1.2])for(const pitch of[-.5,0,.6,Math.PI/2]){const axes=[[1,0,0],[0,1,0],[0,0,1]].map(p=>cameraPoint(p,yaw,pitch));for(const a of axes)assert.ok(Math.abs(dot(a,a)-1)<1e-12);for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert.ok(Math.abs(dot(axes[i],axes[j]))<1e-12);}
 assert.deepEqual(cameraPoint([200,60,18],0,0),[200,-60,18]);
 const p={size:[400,60,18],center:[0,0,0],rotationX:Math.PI/2,rotationY:Math.PI/2};const corners=boardCorners(p),edge=corners[1].map((v,i)=>v-corners[0][i]);assert.ok(Math.abs(Math.hypot(...edge)-400)<1e-9);assert.ok(Math.abs(edge[2]+400)<1e-9);
});
test('photo facts stay open until supplied and tree edits remain explicit proposals',()=>{
 const d=treeExample();assert.deepEqual(d.parts.map(p=>p.size[0]),[300,350,350,350,400,400]);assert.ok(d.parts.every(p=>p.size[1]===null));assert.ok(photoQuestions(d).length>6);assert.ok(photoValidation(d,{manual:true}).length>0);
 const t=answered();assert.equal(t.parts.length,9);assert.deepEqual(t.parts.slice(0,6).map(p=>p.size[0]),[300,350,350,350,400,400]);assert.equal(t.parts[8].confidence,'inferred');assert.ok(t.parts[6].center[1]>0);assert.deepEqual(solidIntersections(t),[]);assert.deepEqual(photoValidation(t,{manual:true}),[]);
 assert.ok(photoModel(t,{preview:false}).parts.every(p=>p.size.every(v=>v>0)));
 const round=normalizePhotoDraft(JSON.parse(photoDraftFile(t)));assert.deepEqual(round,t);assert.ok(!photoDraftFile(t).includes('data:image'));
});
test('oriented solid collision detects penetration but permits contact',()=>{
 const base={size:[200,60,18],center:[0,0,0],angles:[0,0,0],endCut:'square'};
 const make=center=>normalizePhotoDraft({parts:[{...base,id:'01'},{...base,id:'02',center}]});
 assert.deepEqual(solidIntersections(make([0,0,18])),[]);assert.deepEqual(solidIntersections(make([0,0,17.9])),[['01','02']]);assert.deepEqual(solidIntersections(make([201,0,0])),[]);
 const angled=make([0,0,0]);angled.parts[1].angles[2]=45;assert.equal(solidIntersections(angled).length,1);
});
test('hole coordinates and depths cannot become unsafe or out of bounds',()=>{
 const d=answered();d.parts[0].holes=[{id:'01.1',x:30,y:30,diameter:3,depth:12,through:false,side:'front'}];assert.deepEqual(photoValidation(d,{manual:true}),[]);
 const svg=photoSVG(d,{type:'bore',title:'Loch 01.1',part:d.parts[0],hole:d.parts[0].holes[0]},0,1);assert.ok(svg.includes('Lochmitte'));assert.ok(svg.includes('Ø 3'));assert.ok(svg.includes('Tiefe 12'));
 d.parts[0].holes[0].depth=16;assert.ok(photoValidation(d).some(s=>s.includes('Bohrtiefe')));d.parts[0].holes[0].x=0;assert.ok(photoValidation(d).some(s=>s.includes('Rand')));
 assert.throws(()=>normalizePhotoDraft({parts:[{id:'01',size:[NaN,60,18]}]}));
});
test('vision request carries all images, never pretends successful analysis and validates response',async()=>{
 const imgs=['data:image/jpeg;base64,YWJj','data:image/png;base64,YWJj'],request=analysisRequest(imgs,'Maß 400 mm','test-model');assert.equal(request.store,false);assert.equal(request.input[0].content.filter(c=>c.type==='input_image').length,2);assert.equal(request.text.format.strict,true);assert.ok(request.instructions.includes('Unbekannte Werte sind null'));
 assert.throws(()=>analysisRequest(['https://untrusted.test/image'],'','test'));assert.throws(()=>analysisRequest([],'','test'));
 const fake={status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(treeExample())}]}]};let call;
 const result=await analyzePhotos({images:imgs,context:'Test'},{key:'test-only',model:'test-model',fetchImpl:async(url,options)=>{call={url,options};return {ok:true,json:async()=>fake};}});assert.equal(result.source,'ai');assert.equal(result.geometryConfirmed,false);assert.equal(call.url,'https://api.openai.com/v1/responses');assert.ok(!photoDraftFile(result).includes('test-only'));
 await assert.rejects(()=>analyzePhotos({images:imgs},{key:'test',fetchImpl:async()=>({ok:false,status:401})}),/abgelehnt/);
});
