import {partBounds,rotatePoint} from './geometry.js';
export const PHOTO_SCHEMA='werkstueck/photo-v1';
const safeText=(v,max=240)=>String(v??'').slice(0,max);
const nullable=(v,min,max,label)=>{if(v===null||v===undefined||v==='')return null;if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw Error(label+': ungültiger Wert.');return Math.round(v*1000)/1000;};
export function normalizePhotoDraft(raw){
 if(!raw||typeof raw!=='object'||!Array.isArray(raw.parts)||!raw.parts.length||raw.parts.length>24)throw Error('Ein Entwurf benötigt 1 bis 24 Holzteile.');
 if(raw.questions!==undefined&&(!Array.isArray(raw.questions)||raw.questions.length>12))throw Error('Höchstens zwölf offene Rückfragen.');
 const ids=new Set();const parts=raw.parts.map((p,i)=>{const id=String(p.id||String(i+1).padStart(2,'0'));if(!/^[A-Za-z0-9_-]{1,12}$/.test(id)||ids.has(id))throw Error('Bauteilnummern müssen eindeutig sein.');ids.add(id);
  if(p.holes!==undefined&&(!Array.isArray(p.holes)||p.holes.length>16))throw Error('Höchstens 16 Bohrungen je Brett.');
  const vec=(v,min,max,label)=>{if(v!==undefined&&(!Array.isArray(v)||v.length!==3))throw Error(label+': drei Werte erforderlich.');return Array.from({length:3},(_,i)=>nullable(v?.[i],min,max,label));};
  return {id,name:safeText(p.name||'Brett '+id,80),size:vec(p.size,.5,5000,'Zuschnitt'),center:vec(p.center,-10000,10000,'Position'),angles:vec(p.angles,-360,360,'Winkel'),evidence:safeText(p.evidence),confidence:['observed','inferred','unknown'].includes(p.confidence)?p.confidence:'unknown',endCut:p.endCut==='square'?'square':'unknown',holes:(p.holes||[]).slice(0,16).map((h,j)=>({id:id+'.'+(j+1),x:nullable(h.x,0,5000,'Loch x'),y:nullable(h.y,0,5000,'Loch y'),diameter:nullable(h.diameter,.5,40,'Bohrdurchmesser'),depth:nullable(h.depth,.5,500,'Bohrtiefe'),side:h.side==='back'?'back':'front',through:Boolean(h.through)}))};});
 const questions=(raw.questions||[]).slice(0,12).map((q,i)=>({id:'q'+i,question:safeText(q.question,400),why:safeText(q.why),answer:safeText(q.answer,1000)}));
 return {schema:PHOTO_SCHEMA,assemblyOrder:[...new Set([...(Array.isArray(raw.assemblyOrder)?raw.assemblyOrder:[]).filter(id=>ids.has(id)),...parts.map(p=>p.id)])],title:safeText(raw.title||'Mein Fotoprojekt',100),kind:raw.kind==='tree'?'tree':'boards',source:['ai','example','manual'].includes(raw.source)?raw.source:'manual',observations:(raw.observations||[]).slice(0,12).map(s=>safeText(s,400)),questions,parts,reference:safeText(raw.reference,200),material:safeText(raw.material,120),connection:safeText(raw.connection,1200),geometryConfirmed:raw.geometryConfirmed===true,connectionConfirmed:raw.connectionConfirmed===true,tree:raw.tree&&typeof raw.tree==='object'?{width:nullable(raw.tree.width,20,200,'Brettbreite'),thickness:nullable(raw.tree.thickness,8,60,'Stärke'),angle:nullable(raw.tree.angle,5,45,'Neigung'),gap:nullable(raw.tree.gap,100,400,'Abstand der Ebenen'),baseLength:nullable(raw.tree.baseLength,200,1200,'Fußlänge')}:null};
}
export function photoQuestions(d){
 const out=[];if(!d.reference.trim())out.push('Ein echtes Kontrollmaß mit Bezugspunkten fehlt.');
 for(const p of d.parts){if(p.size.some(v=>v===null))out.push(p.id+': Zuschnittmaße fehlen.');if(p.center.some(v=>v===null)||p.angles.some(v=>v===null))out.push(p.id+': Lage oder Neigung fehlt.');if(p.endCut!=='square')out.push(p.id+': Schnittform klären; unterstützt sind rechtwinklige Brettenden.');}
 for(const q of d.questions)if(!q.answer.trim())out.push(q.question);
 return out;
}
export function solidIntersections(d){
 const parts=d.parts.filter(p=>[...p.size,...p.center,...p.angles].every(v=>v!==null)).map(p=>({...p,rotationX:p.angles[0]*Math.PI/180,rotationY:p.angles[1]*Math.PI/180,rotationZ:p.angles[2]*Math.PI/180})),hits=[];
 const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],units=[[1,0,0],[0,1,0],[0,0,1]];
 for(let i=0;i<parts.length;i++)for(let j=i+1;j<parts.length;j++){
  const a=parts[i],b=parts[j],aa=units.map(v=>rotatePoint(v,a)),bb=units.map(v=>rotatePoint(v,b)),axes=[...aa,...bb,...aa.flatMap(u=>bb.map(v=>cross(u,v)))],delta=b.center.map((v,k)=>v-a.center[k]);
  const separates=axes.some(axis=>{const norm=Math.hypot(...axis);if(norm<1e-8)return false;const u=axis.map(v=>v/norm),ra=aa.reduce((s,v,k)=>s+Math.abs(dot(u,v))*a.size[k]/2,0),rb=bb.reduce((s,v,k)=>s+Math.abs(dot(u,v))*b.size[k]/2,0);return Math.abs(dot(delta,u))>=ra+rb-1e-5;});
  if(!separates)hits.push([a.id,b.id]);
 }
 return hits;
}
export function photoValidation(d,{manual=false}={}){
 const errors=photoQuestions(d);for(const pair of solidIntersections(d))errors.push(pair.join(' / ')+': Holzkörper überschneiden sich. Lage oder Verbindungskonstruktion klären.');
 for(const p of d.parts)for(const h of p.holes){if([h.x,h.y,h.diameter,h.depth].some(v=>v===null)){errors.push(p.id+': Bohrmaße vervollständigen.');continue;}const r=h.diameter/2;if(p.size.some(v=>v===null))continue;if(h.x-r<=0||h.x+r>=p.size[0]||h.y-r<=0||h.y+r>=p.size[1])errors.push(h.id+': Loch liegt am Rand oder außerhalb.');if(h.through?h.depth!==p.size[2]:h.depth>p.size[2]-3)errors.push(h.id+': Bohrtiefe passt nicht zur Brettstärke (blind inkl. Spitze).');}
 if(manual){if(d.connection.length>400)errors.push('Verbindungsablauf auf höchstens 400 Zeichen kürzen.');if(!d.geometryConfirmed)errors.push('Maße, Schnittform und Lage am Modell bestätigen.');if(!d.connection.trim()||!d.connectionConfirmed)errors.push('Verbindung, Bohrbild und Montagefolge bestätigen.');if(!d.material.trim())errors.push('Material festlegen.');}
 return [...new Set(errors)];
}
export function photoModel(d,{preview=true}={}){
 const parts=d.parts.map((p,i)=>{const missing=p.size.some(v=>v===null)||p.center.some(v=>v===null)||p.angles.some(v=>v===null);if(missing&&!preview)throw Error('Modell enthält offene Maße.');const size=p.size.map((v,j)=>v??[300,60,18][j]),angles=p.angles.map(v=>(v??0)*Math.PI/180);return {id:p.id,name:p.name,size,center:p.center.map((v,j)=>v??(j===1?i*80:0)),rotationX:angles[0],rotationY:angles[1],rotationZ:angles[2],explode:[(i%2?1:-1)*90,20,70+i*12],cut:size,stage:0,note:missing?'Platzhalter · Maße offen':p.evidence,color:missing?'#c9cfc8':undefined};});
 const bounds=partBounds(parts),overall=[bounds[0][1]-bounds[0][0],bounds[2][1]-bounds[2][0],bounds[1][1]-bounds[1][0]];
 return {parts,woodParts:parts,overall,dimensions:{width:overall[0],depth:overall[1],height:overall[2],thickness:parts[0].size[2]},project:{short:d.title}};
}
export function treeLayout(d,tree){
 const {width,thickness,angle,gap,baseLength}=tree;if([width,thickness,angle,gap,baseLength].some(v=>v===null))return d;
 const a=angle*Math.PI/180,l=d.parts.slice(0,6).map(p=>p.size[0]);if(l.some(v=>v===null))return d;
 const lowest=Math.max(l[4],l[5])*Math.cos(a)+width/2+2*thickness,top=lowest+2*gap;
 const parts=d.parts.slice(0,6).map((p,i)=>{const right=i%2===1,theta=(-90+(right?angle:-angle))*Math.PI/180,apex=top-Math.floor(i/2)*gap,L=l[i];return {...p,size:[L,width,thickness],center:[Math.cos(theta)*L/2,apex+Math.sin(theta)*L/2,(right?1.5:.5)*thickness],angles:[0,0,theta*180/Math.PI]};});
 parts.push({id:'07',name:'Rückenleiste · Vorschlag',size:[top-2*thickness,width,thickness],center:[0,(top+2*thickness)/2,-thickness/2],angles:[0,0,90],confidence:'inferred',endCut:'square',evidence:'Eigener Konstruktionsvorschlag; Rückseite auf Foto nicht sichtbar.',holes:[]});
 parts.push({id:'08',name:'Querfuß · Vorschlag',size:[baseLength,width,thickness],center:[0,thickness/2,0],angles:[90,0,0],confidence:'inferred',endCut:'square',evidence:'Eigener Vorschlag; Stand und Befestigung am Probebau prüfen.',holes:[]});
 parts.push({id:'09',name:'Längsfuß · Vorschlag',size:[baseLength,width,thickness],center:[0,1.5*thickness,0],angles:[90,90,0],confidence:'inferred',endCut:'square',evidence:'Eigene Ergänzung für einen Kreuzfuß; Stand und Befestigung am Probebau prüfen.',holes:[]});
 return normalizePhotoDraft({...d,tree,parts,assemblyOrder:['08','09','07','05','06','03','04','01','02'],geometryConfirmed:false,connectionConfirmed:false});
}
export function treeExample(){
 const lengths=[300,350,350,350,400,400];
 return normalizePhotoDraft({title:'Deko-Holzbaum · Fotorekonstruktion',kind:'tree',source:'example',reference:'Fotoaufschrift: obere linke Leiste 300 mm; Bezug/Längenmaß noch prüfen',observations:['Sechs schräge Holzleisten sind sichtbar.','Aufschriften: oben links 30 cm, oben rechts 35 cm; Mitte 35 cm; unten 40 cm. Alle Angaben müssen am Original geprüft werden.','Brettbreite, Stärke, exakte Neigung und Rückseite sind nicht eindeutig erkennbar.'],parts:lengths.map((L,i)=>({id:String(i+1).padStart(2,'0'),name:['Oben links','Oben rechts','Mitte links','Mitte rechts','Unten links','Unten rechts'][i],size:[L,null,null],center:[null,null,null],angles:[0,0,null],confidence:'observed',endCut:'unknown',evidence:'Längenaufschrift im bereitgestellten Foto; kein Nachweis eines bestimmten Zuschnittbezuges.',holes:[]})),questions:[{question:'Meinen die Foto-Längen die ganze Leiste zwischen den äußersten Enden?',why:'Eine sichtbare Kantenlänge ist nicht automatisch das Zuschnittmaß.'},{question:'Wie sind die Leisten hinten verbunden und wie soll der Baum stehen oder aufgehängt werden?',why:'Rückseite und Standfuß sind verdeckt. Rückenleiste und Querfuß wären eigene Ergänzungen.'}],tree:{width:null,thickness:null,angle:null,gap:null,baseLength:null}});
}
export function photoDraftFile(d){return JSON.stringify(normalizePhotoDraft(d),null,2);}
