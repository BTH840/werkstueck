import {number,stepsFor,toolsFor} from './core.js';
import {workshopFor} from './workshop.js';
// All measurements and joinery come from the current model, not from static plan text.
export async function createPlan(model,{full=false,images=[],workshopImages=[],version='0.5.0'}={}){
 const pictureCourse=full?workshopFor(model):null;if(pictureCourse)return createPicturePlan(model,pictureCourse,workshopImages,version);
 const {PDFDocument,StandardFonts,rgb}=globalThis.PDFLib,doc=await PDFDocument.create();
 const font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold),serif=await doc.embedFont(StandardFonts.TimesRoman);
 const ink=rgb(.15,.24,.21),muted=rgb(.39,.43,.39),line=rgb(.83,.85,.81),accent=rgb(.67,.32,.18),M=40,W=595.28,H=841.89;let page,y;
 const clean=s=>String(s).replaceAll('↳','-').replaceAll('□','[ ]').replaceAll('→','>').replaceAll('✓','OK').replace(/[\u2010-\u2015]/g,'-').replace(/[\u2000-\u200b\u202f]/g,' ');
 const addPage=()=>{page=doc.addPage([W,H]);y=H-M;page.drawText('werkstück / '+model.project.number,{x:M,y:y-10,size:11,font:bold,color:ink});page.drawText(full?'SCHRITT-FÜR-SCHRITT-PLAN':'WERKSTATTPLAN',{x:320,y:y-10,size:8,font,color:muted});page.drawLine({start:{x:M,y:y-23},end:{x:W-M,y:y-23},color:line,thickness:.8});y-=50;};
 const room=h=>{if(y-h<58)addPage();};
 const text=(value,{size=10,width=W-M*2,color=ink,type=font,leading=size*1.5}={})=>{
  let row='';const rows=[];for(const word of clean(value).split(/\s+/)){if(type.widthOfTextAtSize(word,size)>width){if(row){rows.push(row);row='';}let chunk='';for(const c of word){if(type.widthOfTextAtSize(chunk+c,size)>width){rows.push(chunk);chunk='';}chunk+=c;}row=chunk;continue;}const candidate=row?row+' '+word:word;if(type.widthOfTextAtSize(candidate,size)>width&&row){rows.push(row);row=word;}else row=candidate;}if(row)rows.push(row);
  for(const row of rows){room(leading);page.drawText(row,{x:M,y:y-size,size,font:type,color});y-=leading;}
 };
 const heading=(s,size=19)=>{room(size*2+30);y-=8;text(s,{size,type:serif,leading:size*1.35});y-=5;};
 const image=async(src,height=150)=>{if(!src)return;const img=await doc.embedPng(src),fit=img.scaleToFit(W-M*2,height);room(fit.height+12);page.drawImage(img,{x:(W-fit.width)/2,y:y-fit.height,width:fit.width,height:fit.height});y-=fit.height+10;};
 const j=model.joinery,p=model.project;
 addPage();heading(p.short,29);text(`Außenmaße B × T × H: ${model.overall.map(n=>number(n/10,3)).join(' × ')} cm`,{size:10,type:bold});
 text(`${model.woodParts.length} Holzteile · Materialstärke ${number(model.dimensions.thickness)} mm · ${j.name}`,{size:9,color:muted});y-=8;
 text('ENTWURF - rechnerisch geprüft, noch nicht probegebaut. Keine bestätigte Tragfähigkeit.',{size:8,color:accent});y-=7;await image(images[0],130);
 heading('Zuschnittliste · alle Maße in mm',17);const cols=[M,M+36,M+192,M+400];
 const tableHead=()=>{room(45);page.drawRectangle({x:M,y:y-21,width:W-M*2,height:23,color:rgb(.93,.94,.91)});['TEIL','BEZEICHNUNG','LÄNGE × BREITE × STÄRKE','STÜCK'].forEach((s,i)=>page.drawText(s,{x:cols[i]+3,y:y-12,size:7,font:bold,color:ink}));y-=25;};tableHead();
 for(const part of model.woodParts){if(y<85){addPage();tableHead();}[part.id,part.name,part.cut.map(n=>number(n,3)).join(' × '),'1'].forEach((s,i)=>page.drawText(clean(s),{x:cols[i]+3,y:y-11,size:8,font,color:ink}));page.drawLine({start:{x:M,y:y-19},end:{x:W-M,y:y-19},color:line,thickness:.5});y-=23;}
 y-=10;text('Schnittbreite zusätzlich einplanen. '+p.note,{size:8,color:muted});for(const detail of model.details)text(detail,{size:8,color:muted});
 addPage();heading('Verbindung & Vorbereitung',25);heading(j.name,18);text(j.text,{size:11,type:bold});y-=7;text(j.machining,{size:10});
 if(j.rows.length){heading('Mittelpunkte entlang der Kontaktkante',16);text('Positionen jeweils ab der angegebenen Bezugskante; mittig zur Materialstärke. Gleiche Markierungen auf beide Verbindungspartner übertragen.',{size:9,color:muted});
  for(const row of j.rows){room(52);y-=6;text(`Teile ${row.parts} · ${row.count} Verbindungsmittel`,{size:9,type:bold});text(row.axis,{size:8,color:muted});text(row.positions.map(n=>number(n,3)).join(' / ')+' mm',{size:9});}}
 heading('Zusätzliches Material',16);for(const e of model.extras)text(`${number(e.quantity)} ${e.unit} · ${e.name}`,{size:9});if(!model.extras.length)text('Schleifmittel und Hilfsmittel passend zu Holz und Oberfläche.',{size:9});
 heading('Werkzeuge',16);text(toolsFor(model).join(' · '),{size:9});
 if(!full){addPage();heading('Die Montage im Überblick',25);for(const[i,s]of stepsFor(model).entries()){room(100);heading(`[ ] ${i+1}. ${s.title}`,16);text(s.text,{size:9.5});y-=4;text(s.check,{size:8.5,color:muted});y-=5;}}

 else{for(const[i,s]of stepsFor(model).entries()){addPage();text(`SCHRITT ${i+1} / ${stepsFor(model).length} · TEILE ${s.parts}`,{size:9,color:accent,type:bold});heading(s.title,27);y-=10;await image(images[i+1],245);y-=15;text(s.text,{size:12,leading:20});y-=15;heading('Vor dem nächsten Schritt prüfen',17);text(s.check,{size:10.5,leading:17});y-=18;text('[ ] Schritt erledigt',{size:11,type:bold});}}
 if(full)addPage();
 heading('Quelle und eigene Anpassung',15);text(p.source?.title||'Eigener Werkstück-Entwurf',{size:9,type:bold});if(p.source){text(p.source.url,{size:7,color:muted});text(p.source.facts,{size:8,color:muted});}text(p.adaptation,{size:8,color:muted});y-=10;text('Maßvarianten sind eigene Berechnungen. Die Referenzquellen sind überwiegend statisch; eine dynamische Maßgleichheit wird nicht zugesagt.',{size:8,color:muted});
 if(j.source){heading('Verbindungsquelle',15);text(model.project.outdoor?'Festool DOMINO-Handbuch: Sipo-Sortiment und Frästiefen der DF 500. Die asymmetrischen 12/20-mm-Taschen sind unsere Festlegung für diese Variante.':'Festool DOMINO-Handbuch: Beim 4-mm-Spezialfräser ergibt die Tiefeneinstellung 20 mm tatsächlich 10 mm Frästiefe.',{size:8,color:muted});text(j.source,{size:7,color:muted});}
 doc.getPages().forEach((p,i)=>{p.drawLine({start:{x:M,y:36},end:{x:W-M,y:36},color:line,thickness:.6});p.drawText(`${model.project.short} · v${version} · mm / cm`,{x:M,y:23,size:7,font,color:muted});p.drawText(`${i+1} / ${doc.getPageCount()}`,{x:W-M-25,y:23,size:7,font,color:muted});});
 doc.setTitle(`Werkstück - ${p.short} - ${full?'Schritt-für-Schritt':'Werkstattplan'}`);doc.setAuthor('Werkstück');doc.setSubject(`${j.name}; gemeinsame Modelldaten, metrisch`);return doc.save();
}

async function createPicturePlan(model,course,images,version){
 if(images.length!==course.steps.length)throw Error('Bildfolge unvollständig');
 const {PDFDocument,StandardFonts,rgb}=globalThis.PDFLib,doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica);
 for(let i=0;i<images.length;i++){
  const page=doc.addPage([841.89,595.28]),img=await doc.embedPng(images[i]),fit=img.scaleToFit(801.89,545.28);
  page.drawImage(img,{x:(841.89-fit.width)/2,y:(595.28-fit.height)/2+5,width:fit.width,height:fit.height});
  page.drawText(`${i+1} / ${images.length}`,{x:785,y:12,size:7,font,color:rgb(.4,.45,.4)});
 }
 doc.setTitle('Werkstück - Garderobe - Bildanleitung');doc.setAuthor('Werkstück');doc.setSubject(`v${version}; DF 500 Q; D 4; 10 Bildschritte; mm`);doc.setKeywords([...course.sources.map(s=>s.url),course.illustrationReference.url]);return doc.save();
}
