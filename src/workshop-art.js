// Original part-only illustrations. All marks are projected from model measurements.
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const f=n=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:3}).format(n);
const ink='#26342e',accent='#ad512f',muted='#7c827c';
const txt=(x,y,s,size=23,color=ink,anchor='start')=>`<text x="${x}" y="${y}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" fill="${color}" text-anchor="${anchor}">${esc(s)}</text>`;
const line=(a,b,{color=ink,dash=false,width=2,...extra}={})=>`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${color}" stroke-width="${width}" ${dash?'stroke-dasharray="9 7"':''} ${Object.entries(extra).map(([k,v])=>`${k}="${v}"`).join(' ')}/>`;
const poly=(ps,fill='#fff',color=ink)=>`<polygon points="${ps.map(p=>p.join(',')).join(' ')}" fill="${fill}" stroke="${color}" stroke-width="2.3" stroke-linejoin="round"/>`;
const rect=(x,y,w,h,fill='#fff',color=ink)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${fill}" stroke="${color}" stroke-width="2"/>`;
const arrow=(a,b)=>line(a,b,{color:accent,width:3,'marker-end':'url(#move)'});
const cross=p=>`<g data-mark="center">${line([p[0]-9,p[1]],[p[0]+9,p[1]],{color:accent,width:2.5})}${line([p[0],p[1]-9],[p[0],p[1]+9],{color:accent,width:2.5})}<circle cx="${p[0]}" cy="${p[1]}" r="13" fill="none" stroke="${accent}" stroke-width="1.5"/></g>`;
const dim=(a,b,label,{labelX=(a[0]+b[0])/2,labelY=(a[1]+b[1])/2-12,size=23}={})=>line(a,b,{'marker-start':'url(#dim)','marker-end':'url(#dim)',width:1.4})+rect(labelX-label.length*size*.27-8,labelY-size+1,label.length*size*.54+16,size+8,'#fff','none')+txt(labelX,labelY,label,size,ink,'middle');
const tag=(x,y,id,label)=>`<circle cx="${x}" cy="${y}" r="22" fill="${ink}"/>`+txt(x,y+8,id,21,'#fff','middle')+txt(x+35,y+8,label,24);
function drawingBoard(w,d,t,{x=120,y=235,maxW=940,maxH=275}={}){
 const s=Math.min(maxW/(w+.42*d),maxH/(.7*d+.9*t));
 const p=(X,Y,Z=t)=>[x+(X+.42*Y)*s,y+(.7*Y-.9*Z)*s];
 const art=poly([p(0,d),p(w,d),p(w,d,0),p(0,d,0)],'#eaece7')+poly([p(w,0),p(w,d),p(w,d,0),p(w,0,0)],'#f1f2ef')+poly([p(0,0),p(w,0),p(w,d),p(0,d)],'#fff');
 return {w,d,t,p,s,art};
}
function base(b,edge='rear'){
 const y=edge==='front'?b.d:0,z=edge==='front'?b.t:undefined;
 return line(b.p(0,y,z),b.p(b.w,y,z),{color:accent,width:4});
}
function leaders(b,ys,positions){let a='';for(const x of positions){a+=line(b.p(x,0),b.p(x,b.d),{color:muted,dash:true,width:1.5});if(ys===null)a+=line(b.p(x,b.d),b.p(x,b.d,0),{color:muted,dash:true,width:1.5});}return a;}
function positions(b,xs,{front=false,y=0}={}){
 const z=front?0:b.t,edge=front?b.d:y,pts=[0,...xs,b.w];let a='';
 const row=b.p(0,front?b.d:0,z)[1]+(front?63:-60);
 for(const x of pts){const q=b.p(x,edge,z);a+=line(q,[q[0],row+(front?-8:8)],{color:'#9caaa0',width:1});}
 for(let i=1;i<pts.length;i++){const q1=b.p(pts[i-1],edge,z),q2=b.p(pts[i],edge,z);a+=dim([q1[0],row],[q2[0],row],f(Math.round((pts[i]-pts[i-1])*1000)/1000),{size:22});}
 return `<g data-mark="position-dimensions">${a}</g>`;
}
function slot(b,x,y,z,wide=17,plane='top'){
 const points=[],r=2,half=(wide-4)/2;
 for(let k=0;k<=12;k++){const q=-Math.PI/2+Math.PI*k/12;const dx=half+r*Math.cos(q),dy=r*Math.sin(q);points.push(plane==='edge'?b.p(x+dx,y,z+dy):b.p(x+dx,y+dy,z));}
 for(let k=0;k<=12;k++){const q=Math.PI/2+Math.PI*k/12;const dx=-half+r*Math.cos(q),dy=r*Math.sin(q);points.push(plane==='edge'?b.p(x+dx,y,z+dy):b.p(x+dx,y+dy,z));}
 return `<g data-mark="pocket" data-x-mm="${x}" data-offset-mm="${plane==='edge'?z:y}">${poly(points,'#555f55',ink)}</g>`;
}
function axisDetail(c,{face=false}={}){
 const t=c.dimensions.thickness,a=c.axis;let out=rect(55,570,510,176,'#fbfbf8','#c7ccc3')+txt(78,604,face?'DETAIL · UNTERSEITE U':'DETAIL · OBERE KONTAKTKANTE',19);
 if(face){
  out+=rect(95,630,350,78,'#fff')+line([95,630],[445,630],{color:accent,width:4})+line([95,655],[445,655],{color:accent,dash:true})+cross([270,655])+dim([484,630],[484,655],f(a)+' mm',{labelX:509,labelY:648,size:19})+txt(105,732,'Abstand ab R / hinterer Kante',18);
 }else{
  out+=rect(95,630,350,78,'#fff')+line([95,630],[445,630],{color:accent,width:4})+line([95,669],[445,669],{color:accent,dash:true})+cross([270,669])+dim([486,630],[486,669],f(a)+' mm',{labelX:509,labelY:655,size:19})+txt(105,732,'Gesamte Materialstärke: '+f(t)+' mm',18);
 }
 return out;
}
function depthDetail(c){
 const t=c.dimensions.thickness;
 return rect(615,570,530,176,'#fbfbf8','#c7ccc3')+txt(638,604,'SCHNITT DURCH EINE TASCHE',19)+rect(670,630,390,80,'#fff')+rect(807,630,34,80*10/t,'#d5d9d0')+line([824,620],[824,722],{color:accent,dash:true})+dim([730,630],[730,630+80*10/t],'10 mm',{labelX:690,labelY:661,size:19})+txt(865,660,'Restholz',18)+txt(865,690,f(t-10)+' mm',21)+txt(650,733,'D-4-Fräser: Rastung 20 → real 10 mm',18);
}
function edgeView(c,mode){
 const {width:w,height:h,thickness:t}=c.dimensions,b=drawingBoard(w,h,t,{y:230,maxH:245}),axis=c.axis,after=mode==='route';let a=b.art+base(b,'front')+leaders(b,null,c.positions);
 a+=line(b.p(0,h,axis),b.p(w,h,axis),{color:accent,dash:true,width:2.5});
 for(const x of c.positions)a+=(after?slot(b,x,h,axis,17,'edge'):'')+cross(b.p(x,h,axis));
 a+=positions(b,c.positions,{front:true})+txt(b.p(0,h,0)[0]-28,b.p(0,h,0)[1]+7,'L',24,accent)+txt(...b.p(w*.5,h*.4),'R',30,accent)+tag(105,140,'01','Hakenbrett · Rückseite R oben')+txt(105,515,'Fräspunkte ab L: '+c.positions.map(f).join(' / ')+' mm',24)+axisDetail(c)+depthDetail(c);
 return a;
}
function shelfView(c,mode){
 const {width:w,depth:d,thickness:t}=c.dimensions,b=drawingBoard(w,d,t,{y:285,maxH:195}),axis=c.axis;let a=b.art+base(b)+leaders(b,axis,c.positions);
 a+=line(b.p(0,axis),b.p(w,axis),{color:accent,dash:true,width:2.5});
 c.positions.forEach((x,i)=>{const p=b.p(x,axis);a+=(mode==='route'?slot(b,x,axis,t,i?23:17):'')+cross(p);if(mode==='approach')a+=arrow([p[0],p[1]-65],[p[0],p[1]-16]);});
 a+=positions(b,c.positions)+txt(b.p(0,0)[0]-28,b.p(0,0)[1]+8,'L',24,accent)+txt(b.p(w,0)[0]+20,b.p(w,0)[1]+8,'R',24,accent)+tag(105,140,'02','Ablage · Unterseite U sichtbar')+txt(105,475,'Von R nach vorn: '+f(axis)+' mm',25,accent)+txt(105,515,'Ab L: '+c.positions.map(f).join(' / ')+' mm',24)+axisDetail(c,{face:true})+depthDetail(c);
 return a;
}
function drawingAssembly(c,{exploded=false,glue=false,pressure=false}={}){
 const {width:w,height:h,depth:d,thickness:t}=c.dimensions;
 const s=Math.min(740/(w+.4*d),360/(h+t+.32*d)),x0=135,y0=555;
 const p=(X,Y,Z)=>[x0+s*(X+.4*Z),y0-s*(Y+.32*Z)];
 function box(X,Y,Z,W,H,D){const q=(x,y,z)=>p(X+x,Y+y,Z+z);return poly([q(0,0,0),q(W,0,0),q(W,H,0),q(0,H,0)],'#fff')+poly([q(W,0,0),q(W,0,D),q(W,H,D),q(W,H,0)],'#eaece7')+poly([q(0,H,0),q(W,H,0),q(W,H,D),q(0,H,D)],'#f5f6f2');}
 const lift=exploded?65:0;let a=box(0,0,0,w,h,t);
 for(const x of c.positions){a+=line(p(x,h,t/2),p(x,h+t+lift,t/2),{color:accent,dash:true,width:2});if(exploded)a+=box(x-8.5,h-10,t/2-2,17,20,4);}
 a+=box(0,h+lift,0,w,t,d);
 if(glue){a+=line(p(0,h,t/2),p(w,h,t/2),{color:accent,width:6});a+=txt(100,692,'Leim dünn auf die Kontaktflächen.',25);}
 if(pressure){for(const x of[w*.2,w*.8]){const q=p(x,h+t,0);a+=arrow([q[0],q[1]-75],[q[0],q[1]-5]);}a+=txt(100,692,'Fuge geschlossen · Rückseiten bündig · 90°',25);}
 if(exploded){const q=p(w*.75,h+t+lift,d*.7);a+=arrow([q[0],q[1]+15],[q[0],q[1]+65]);}
 a+=tag(100,145,'01','Hakenbrett')+tag(715,145,'02','Ablage')+txt(105,626,exploded?'Teile entlang der Dübelachsen zusammenführen.':'Beide Rückseiten bilden eine gemeinsame Wandebene.',23);
 return a;
}
function cutting(c,mode){
 const {width:w,height:h,depth:d,thickness:t}=c.dimensions;let a='';
 for(const [index,depth,y] of[[1,h,240],[2,d,500]]){
  const extra=60,b=drawingBoard(w+extra,depth,t,{x:140,y,maxW:875,maxH:150});a+=b.art;
  const q1=b.p(w,0),q2=b.p(w,depth);a+=line(q1,q2,{color:accent,dash:true,width:3})+line(b.p(0,depth),b.p(w,depth),{color:accent,dash:true,width:2});
  const top=b.p(0,0)[1]-32;a+=dim([b.p(0,0)[0],top],[q1[0],top],f(w)+' mm')+txt(70,y+18,String(index).padStart(2,'0'),26)+txt(105,y+165,'Breite '+f(depth)+' mm · Stärke '+f(t)+' mm',22)+txt(...b.p(w+30,depth/2),'×',34,accent);
 }
 a+=txt(130,744,mode==='cut'?'An der Linie trennen. Die Fuge liegt im Abfall.':'Gestrichelte Linie = fertiges Maß. × = Abfall.',24);
 return a;
}
function holePlan(c,wall=false){
 const {width:w,height:h,thickness:t}=c.dimensions,b=drawingBoard(w,h,t,{y:290,maxH:210}),row=wall?h/4:h/2,xs=wall?[50,w-50]:Array.from({length:5},(_,i)=>w*(i+.5)/5);let a=b.art+base(b)+leaders(b,row,xs);
 a+=line(b.p(0,row),b.p(w,row),{color:accent,dash:true,width:2.5});
 xs.forEach(x=>{const p=b.p(x,row);a+=`<g data-mark="${wall?'wall-point':'hook-center'}" data-x-mm="${x}" data-y-mm="${row}">${cross(p)}</g>`;});
 a+=positions(b,xs)+txt(b.p(0,0)[0]-28,b.p(0,0)[1]+8,'L',24,accent)+tag(105,140,'01','Hakenbrett · Vorderseite sichtbar');
 const q=b.p(w,row),r=b.p(w,0);a+=line(r,[r[0]+45,r[1]],{color:muted,width:1})+line(q,[q[0]+45,q[1]],{color:muted,width:1})+dim([r[0]+40,r[1]],[q[0]+40,q[1]],f(row)+' mm',{labelX:1090,labelY:(r[1]+q[1])/2+8,size:22});
 a+=txt(105,590,'Ab vorn links: '+xs.map(f).join(' / ')+' mm',25)+txt(105,635,'Unter der oberen Brettkante: '+f(row)+' mm',24);
 if(wall)a+=txt(105,701,'Bohrdurchmesser und Tiefe passend zum Wandsystem wählen.',23);
 else a+=txt(105,701,'Kreuze = Hakenmitten. Schraubenlöcher vom Beschlag übertragen.',22,accent);
 return a;
}
export function workshopSVG(c,step){
 const {width:w,depth:d,height:h,thickness:t}=c.dimensions,index=c.steps.findIndex(s=>s.id===step.id)+1;let a='';
 switch(step.figure){
 case 'plan':a=drawingAssembly(c,{exploded:true});break;
 case 'reference':{
  const b=drawingBoard(w,h,t,{x:140,y:245,maxW:870,maxH:170}),s=drawingBoard(w,d,t,{x:140,y:485,maxW:870,maxH:130});a=b.art+base(b)+s.art+base(s)+tag(100,157,'01','Rückseite R')+tag(100,420,'02','Unterseite U / hintere Kante R')+txt(...b.p(0,0),'L',28,accent)+txt(...s.p(0,0),'L',28,accent)+txt(130,725,'L kennzeichnet an beiden Teilen dieselbe linke Stirnkante.',24);break;
 }
 case 'measure':case 'sawset':{
  const b=drawingBoard(w,h,t,{y:245,maxH:210});a=b.art+base(b)+tag(100,150,'01','Brett auf Maß prüfen');
  for(const x of[w*.1,w*.5,w*.9])a+=cross(b.p(x,h,t/2));
  a+=txt(110,505,'Materialstärke an mehreren Stellen: '+f(t)+' mm',25)+axisDetail(c)+rect(615,570,530,176,'#fbfbf8','#c7ccc3')+txt(640,613,step.figure==='measure'?'BEIDE BRETTER GLEICH STARK':'RECHTWINKLIGER ZUSCHNITT',20)+txt(640,662,step.figure==='measure'?'Fräsmitte = Stärke ÷ 2':'Schnittwinkel 90°',26)+txt(640,712,step.figure==='measure'?f(t)+' ÷ 2 = '+f(c.axis)+' mm':'Sägetiefe: Brett + ca. 2 mm Austritt',21);break;
 }
 case 'cutmark':a=cutting(c,'mark');break;
 case 'sawcut':a=cutting(c,'cut');break;
 case 'positions':{
  const b=drawingBoard(w,h,t,{y:285,maxH:210});a=b.art+base(b)+leaders(b,null,c.positions)+positions(b,c.positions);
  c.positions.forEach(x=>a+=cross(b.p(x,h,t/2)));a+=tag(100,140,'01','Positionsstriche übertragen')+txt(105,565,'Jedes Maß einzeln ab L: '+c.positions.map(f).join(' / ')+' mm',25)+txt(105,625,'Die gleichen Positionsstriche auf Teil 02 übertragen.',24)+txt(105,690,'L',30,accent)+line([140,682],[1080,682],{color:accent,dash:true});break;
 }
 case 'boardaxis':case 'height':case 'boardsetup':a=edgeView(c,'mark');break;
 case 'boardroute':a=edgeView(c,'route');break;
 case 'shelfaxis':a=shelfView(c,'mark');break;
 case 'shelfsetup':a=shelfView(c,'approach');break;
 case 'shelfroute':a=shelfView(c,'route');break;
 case 'cutter':case 'depth':a=shelfView(c,'route');break;
 case 'width':{
  for(const [num,Y,depth]of[[1,250,h],[2,480,d]]){const b=drawingBoard(w,depth,t,{y:Y,maxH:135,maxW:875}),offset=num===1?depth:c.axis;a+=b.art+(num===1?base(b,'front'):base(b))+tag(90,Y-75,String(num).padStart(2,'0'),num===1?'Hakenbrett · alle Taschen eng':'Ablage · erstes eng, weitere mit Spiel');c.positions.forEach((x,i)=>a+=slot(b,x,offset,num===1?c.axis:t,num===2&&i?23:17,num===1?'edge':'top'));}
  a+=txt(120,730,'Tasche 1 legt die Position fest. Mehrbreite wirkt nur längs.',24);break;
 }
 case 'test':case 'dryfit':a=drawingAssembly(c)+txt(105,700,step.figure==='test'?'Zuerst dieselbe Ecke an Restholz herstellen.':'Ohne Leim prüfen. Die Fuge muss ohne Gewalt schließen.',24);break;
 case 'sand':{
  const b=drawingBoard(w,h,t,{y:280,maxH:245});a=b.art+base(b)+tag(105,145,'01','Sichtflächen glätten');for(const y of[h*.35,h*.65])a+=arrow(b.p(w*.2,y),b.p(w*.8,y));a+=txt(105,620,'In Faserrichtung arbeiten · 120 → 180',27)+txt(105,685,'Kontaktkante gerade lassen. Nur freie Kanten leicht brechen.',23);break;
 }
 case 'glue':a=drawingAssembly(c,{exploded:true,glue:true});break;
 case 'clamp':a=drawingAssembly(c,{pressure:true});break;
 case 'hooks':a=holePlan(c);break;
 case 'wall':a=holePlan(c,true);break;
 default:throw Error('Unbekannte Werkstückansicht: '+step.figure);
 }
 const caption=step.visual?.view||step.caption;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="820" viewBox="0 0 1200 820" role="img" data-illustration="workpiece-only" aria-label="${esc(step.title+'. '+caption)}"><title>${esc(step.title)}</title><desc>${esc(caption)}</desc><defs><marker id="move" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${accent}"/></marker><marker id="dim" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M10 0L0 5L10 10" fill="none" stroke="${ink}" stroke-width="1.5"/></marker></defs><rect width="1200" height="820" fill="#fff"/>${txt(40,82,String(index).padStart(2,'0'),60)}${txt(1160,55,'WERKSTÜCK / '+step.phase.toLocaleUpperCase('de-DE'),17,muted,'end')}${txt(1160,86,'ALLE MASSE IN mm · NICHT ALS BOHRSCHABLONE VERWENDEN',14,muted,'end')}${a}${line([40,779],[1160,779],{color:'#dce0d6',width:1})}${line([55,801],[105,801],{color:accent,dash:true})}${txt(118,807,'Anriss',17)}${cross([300,801])}${txt(322,807,'Mittelpunkt',17)}${line([530,801],[580,801],{'marker-start':'url(#dim)','marker-end':'url(#dim)',width:1})}${txt(595,807,'Abstand',17)}${txt(1155,807,'Ansicht schematisch · Maßzahlen sind verbindlich',15,muted,'end')}</svg>`;
}
export async function workshopPNG(course,step){
 const url=URL.createObjectURL(new Blob([workshopSVG(course,step)],{type:'image/svg+xml'}));
 try{const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=1230;canvas.getContext('2d').drawImage(img,0,0,1800,1230);return canvas.toDataURL('image/png');}finally{URL.revokeObjectURL(url);}
}
