import {number,stepsFor,tools} from './core.js';
// PDF generation is entirely in the browser; project data is never uploaded.
export async function createPlan(model,{full=false,images=[],version='0.1.0'}={}) {
 const {PDFDocument,StandardFonts,rgb}=globalThis.PDFLib;
 const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold),serif=await doc.embedFont(StandardFonts.TimesRoman);
 const ink=rgb(.15,.24,.21),muted=rgb(.39,.43,.39),line=rgb(.83,.85,.81),accent=rgb(.67,.32,.18);
 const M=40,W=595.28,H=841.89;let page,y;
 const clean=s=>String(s).replaceAll('↳','-').replaceAll('□','[ ]').replaceAll('→','>').replace(/[\u2010-\u2015]/g,'-');
 const addPage=()=>{page=doc.addPage([W,H]);y=H-M;page.drawText('werkstück / 001',{x:M,y:y-10,size:11,font:bold,color:ink});page.drawText(full?'SCHRITT-FÜR-SCHRITT-PLAN':'WERKSTATTPLAN',{x:320,y:y-10,size:8,font,color:muted});page.drawLine({start:{x:M,y:y-23},end:{x:W-M,y:y-23},color:line,thickness:.8});y-=50;};
 const text=(value,{size=10,width=W-M*2,color=ink,type=font,leading=size*1.5}={})=>{
  const words=clean(value).split(/\s+/);let row='';const rows=[];
  for(const word of words){const candidate=row?row+' '+word:word;if(type.widthOfTextAtSize(candidate,size)>width&&row){rows.push(row);row=word;}else row=candidate;}if(row)rows.push(row);
  for(const row of rows){if(y<M+25)addPage();page.drawText(row,{x:M,y:y-size,size,font:type,color});y-=leading;}return rows.length;
 };
 const heading=(s,size=19)=>{y-=8;text(s,{size,type:serif,leading:size*1.35});y-=5;};
 const image=async(src,height=160)=>{if(!src)return;const img=await doc.embedPng(src),fit=img.scaleToFit(W-M*2,height);page.drawImage(img,{x:(W-fit.width)/2,y:y-fit.height,width:fit.width,height:fit.height});y-=fit.height+10;};
 const footer=()=>{doc.getPages().forEach((p,i)=>{p.drawLine({start:{x:M,y:36},end:{x:W-M,y:36},color:line,thickness:.6});p.drawText(`Werkstattkiste · v${version} · Maße in mm / cm`,{x:M,y:23,size:7,font,color:muted});p.drawText(`${i+1} / ${doc.getPageCount()}`,{x:W-M-25,y:23,size:7,font,color:muted});});};
 addPage();heading('Die Werkstattkiste',31);
 text(`Außenmaße B × T × H: ${model.overall.map(n=>number(n/10,3)).join(' × ')} cm`,{size:11,type:bold});
 text(`Materialstärke: ${number(model.dimensions.thickness)} mm · Fünf Bauteile · Einfacher Holzbau`,{size:9,color:muted});y-=9;
 text('ENTWURF - nicht probegebaut. Maße und Verbindungen vor dem Zuschnitt prüfen.',{size:8,color:accent});y-=8;
 await image(images[0],full?170:145);
 heading('Zuschnittliste',18);
 const cols=[M,M+40,M+171,M+380];
 page.drawRectangle({x:M,y:y-21,width:W-M*2,height:23,color:rgb(.93,.94,.91)});
 ['TEIL','BEZEICHNUNG','LÄNGE × BREITE × STÄRKE','STÜCK'].forEach((s,i)=>page.drawText(s,{x:cols[i]+3,y:y-12,size:7,font:bold,color:ink}));y-=25;
 for(const p of model.parts){[p.id,p.name,p.cut.map(n=>number(n,3)).join(' × ')+' mm','1'].forEach((s,i)=>page.drawText(s,{x:cols[i]+3,y:y-11,size:8,font,color:ink}));page.drawLine({start:{x:M,y:y-19},end:{x:W-M,y:y-19},color:line,thickness:.5});y-=23;}
 y-=8;text('Schnittbreite der Säge zusätzlich einplanen. Der Boden liegt unter den Wänden. Die Stirnwände sitzen zwischen den Längswänden.',{size:8,color:muted});
 heading('Werkzeug & Material',17);text(tools.join(' · '),{size:9});y-=6;
 text('Etwa 20 passende Holzschrauben und geeigneter Holzleim. Für 18-mm-Material ist 4 × 40 mm ein Ausgangspunkt; bei anderen Stärken neu prüfen. Randabstände und Vorbohrung passend zum tatsächlichen Holz festlegen.',{size:9});
 if(!full){
  addPage();heading('Die Montage im Überblick',26);
  for(const [i,s] of stepsFor(model).entries()){heading(`[ ] ${i+1}. ${s.title}`,16);text(s.text,{size:9.5});y-=4;text(s.check,{size:8.5,color:muted});y-=5;}
 }else{
  for(const [i,s] of stepsFor(model).entries()){
   addPage();text(`SCHRITT ${i+1} / 5 · TEILE ${s.parts}`,{size:9,color:accent,type:bold});heading(s.title,28);y-=10;
   await image(images[i+1],280);y-=15;text(s.text,{size:13,leading:21});y-=20;
   heading('Vor dem nächsten Schritt prüfen',17);text(s.check,{size:11,leading:18});y-=20;
   text('[ ] Schritt erledigt',{size:11,type:bold});
  }
 }
 y-=12;text('Nur für leichte Gegenstände geplant, kein Sitzmöbel. Tragfähigkeit ist nicht bestätigt. Vor Benutzung Probebau und Verbindungen prüfen.',{size:8,color:accent});
 footer();doc.setTitle(`Werkstück - Werkstattkiste - ${full?'Schritt-für-Schritt':'Werkstattplan'}`);doc.setAuthor('Werkstück');doc.setSubject('Metrischer Kistenentwurf mit gemeinsamen Modelldaten');
 return doc.save();
}
