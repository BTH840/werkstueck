const pe=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const pf=n=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:3}).format(n),pi='#263e36',pa='#ad512f';
const pt=(x,y,s,size=24,anchor='start')=>`<text x="${x}" y="${y}" fill="${pi}" font-family="Arial,sans-serif" font-size="${size}" text-anchor="${anchor}">${pe(s)}</text>`;
const pl=(x1,y1,x2,y2,attrs='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${pi}" stroke-width="1.5" ${attrs}/>`;
const pd=(a,b,label,x,y)=>pl(...a,...b,'marker-start="url(#pd)" marker-end="url(#pd)"')+`<rect x="${x-label.length*6.5-6}" y="${y-23}" width="${label.length*13+12}" height="29" fill="white"/>`+pt(x,y,label,23,'middle');
export function photoSteps(d,shots){
 const s=[{type:'scene',title:'Dein Werkstück',image:shots.overview},{type:'scene',title:'Bauteile · auseinandergezogen',image:shots.exploded}];
 for(const p of d.parts)s.push({type:'cut',title:p.id+' · Zuschnitt',part:p});
 for(const p of d.parts)for(const h of p.holes)s.push({type:'bore',title:p.id+' · Loch '+h.id,part:p,hole:h});
 s.push({type:'layout',title:'Trocken auslegen · Lage prüfen',image:shots.front});
 for(const [i,id] of d.assemblyOrder.entries()){const p=d.parts.find(p=>p.id===id);s.push({type:'assembly',title:p.id+' · '+p.name+' hinzufügen',image:shots.assembly[i],part:p});}
 s.push({type:'join',title:'Verbindung · dein bestätigter Ablauf',image:shots.overview});
 return s;
}
export function photoSVG(d,step,index,total){
 let body='';const top=pt(40,70,String(index+1).padStart(2,'0'),52)+pt(140,65,step.title,28);
 if(step.type==='cut'||step.type==='bore'){
  const p=step.part,[L,W,T]=p.size,scale=Math.min(800/L,300/W),x=230,y=260,w=L*scale,h=W*scale;
  body=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f9faf5" stroke="${pi}" stroke-width="2.5"/>`;
  for(const [cx,cy,sx,sy]of[[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]])body+=pl(cx+sx*15,cy,cx+sx*15,cy+sy*15)+pl(cx,cy+sy*15,cx+sx*15,cy+sy*15);
  body+=pt(x,step.type==='bore'?135:y-85,p.id+' · '+p.name,26)+pt(60,690,'Rechtwinklige Brettenden · Maße in mm',20);
  if(step.type==='cut'){
   body+=pl(x,y,x,y-45)+pl(x+w,y,x+w,y-45)+pd([x,y-40],[x+w,y-40],pf(L),x+w/2,y-50);
   body+=pl(x,y,x-60,y)+pl(x,y+h,x-60,y+h)+pd([x-50,y],[x-50,y+h],pf(W),x-85,y+h/2+8);
   body+=pt(600,630,[L,W,T].map(pf).join(' × ')+' mm · 1×',31,'middle');
   body+=pt(60,735,'Säge: 0° Gehrung / 0° Blattneigung · Schnitt auf Abfallseite · Schnittfuge zusätzlich einplanen',19);
  }else{
   const b=step.hole,xx=x+b.x*scale,yy=y+b.y*scale;
   body+=pt(x,158,b.side==='back'?'Rückseite · Blick senkrecht auf das Brett':'Vorderseite · Blick senkrecht auf das Brett',21);
   body+=pl(x,y-30,x,y+h+10,'stroke-dasharray="7 5"')+pl(x-20,y,x+w+10,y,'stroke-dasharray="7 5"');
   body+=pl(xx,y-10,xx,yy+15,'stroke-dasharray="7 5"')+pl(x-10,yy,xx+15,yy,'stroke-dasharray="7 5"');
   body+=pl(x,y,x,190)+pl(xx,yy,xx,190)+pd([x,195],[xx,195],pf(b.x),x+(xx-x)/2,185);
   body+=pl(x,y,120,y)+pl(xx,yy,120,yy)+pd([130,y],[130,yy],pf(b.y),95,y+(yy-y)/2+8);
   body+=`<circle cx="${xx}" cy="${yy}" r="10" fill="white" stroke="${pa}" stroke-width="2"/>`+pl(xx-16,yy,xx+16,yy)+pl(xx,yy-16,xx,yy+16)+pt(xx+20,yy+8,b.id,23);
   body+=pt(600,630,'Ø '+pf(b.diameter)+' · '+(b.through?'durch '+pf(T):'Tiefe '+pf(b.depth)+' inkl. Bohrerspitze'),30,'middle');
   body+=pt(60,735,'Maßbeginn: linke Kante / obere Kante der bezeichneten Seite → Lochmitte',20);
  }
 }else{
  body=`<image href="${step.image}" x="50" y="105" width="1100" height="470" preserveAspectRatio="xMidYMid meet"/>`;
  if(step.type==='scene'&&index===1){const labels=d.parts.map(p=>p.id+' '+p.name);for(let i=0;i<labels.length;i++)body+=pt(60+(i%4)*290,590+Math.floor(i/4)*25,labels[i].slice(0,31),16);}
  if(step.type==='layout')body+=pt(600,640,'Einbauwinkel und Lage am Original / Trockenaufbau vergleichen',24,'middle')+pt(600,680,'Einbauwinkel sind keine Säge-Gehrungswinkel.',21,'middle');
  if(step.type==='assembly')body+=pt(600,640,'Neu: Teil '+step.part.id+' · orange markiert',26,'middle');
  if(step.type==='join'){const words=d.connection.split(/\s+/);let line='',row=0;for(const word of words){if((line+' '+word).length>105){body+=pt(60,605+row*27,line,19);line=word;row++;}else line+=(line?' ':'')+word;if(row===4)break;}if(row<4)body+=pt(60,605+row*27,line,19);}
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-label="${pe(step.title)}"><defs><marker id="pd" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M10 0L0 5L10 10" fill="none" stroke="${pi}" stroke-width="1.4"/></marker></defs><rect width="1200" height="800" fill="white"/>${top}${body}${pl(40,760,1160,760)}${pt(40,788,'Fotorekonstruktion · Entwurf · Probebau offen',17)}${pt(1160,788,(index+1)+' / '+total,17,'end')}</svg>`;
}
export async function photoPNG(svg){const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));try{const image=new Image();image.src=url;await image.decode();const c=document.createElement('canvas');c.width=1800;c.height=1200;c.getContext('2d').drawImage(image,0,0,1800,1200);return c.toDataURL('image/png');}finally{URL.revokeObjectURL(url);}}
export async function photoPDF(d,steps){const {PDFDocument,StandardFonts,rgb}=window.PDFLib,doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica);for(let i=0;i<steps.length;i++){const page=doc.addPage([841.89,595.28]),im=await doc.embedPng(await photoPNG(photoSVG(d,steps[i],i,steps.length))),fit=im.scaleToFit(801,550);page.drawImage(im,{x:(841.89-fit.width)/2,y:(595.28-fit.height)/2,width:fit.width,height:fit.height});page.drawText('mm | '+(i+1)+'/'+steps.length,{x:755,y:10,font,size:7,color:rgb(.3,.4,.3)});}doc.setTitle('Werkstück - Fotorekonstruktion - '+d.title);doc.setSubject('Vom Nutzer bestätigte Brettdaten; Entwurf, kein Probebau. Material: '+d.material);return doc.save();}
