// Original vector teaching diagrams. They show contact geometry, not exact control locations.
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const f=n=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:3}).format(n);
const ink='#263e36',accent='#ad512f',red='#b74535',wood='#ead2a5',soft='#e9ede2';
const text=(x,y,s,size=23,color=ink,anchor='start')=>`<text x="${x}" y="${y}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" fill="${color}" text-anchor="${anchor}">${esc(s)}</text>`;
const rect=(x,y,w,h,fill=wood,stroke=ink,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="2" ${extra}/>`;
const ln=(x1,y1,x2,y2,color=ink,dash='',extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="3" ${dash?'stroke-dasharray="'+dash+'"':''} ${extra}/>`;
const arrow=(x1,y1,x2,y2,color=accent)=>ln(x1,y1,x2,y2,color,'','marker-end="url(#arrow)"');
const dim=(x1,y1,x2,y2,label)=>ln(x1,y1,x2,y2,ink,'','marker-start="url(#dim)" marker-end="url(#dim)"')+text((x1+x2)/2,(y1+y2)/2-12,label,23,ink,'middle');
const cross=(x,y)=>ln(x-9,y,x+9,y,red)+ln(x,y-9,x,y+9,red);
const pill=(x,y,s)=>rect(x,y,Math.max(70,s.length*13+24),39,soft,'none')+text(x+12,y+27,s,20);
const clamp=(x,y)=>`<path d="M${x} ${y}h65v88h-65" fill="none" stroke="#66766b" stroke-width="10"/>`+ln(x+8,y+62,x+65,y+62)+rect(x+1,y+47,15,30,accent,'none');
const slot=(x,y,w=30)=>rect(x-w/2,y-5,w,10,'#66766b',ink);
const machine=(x,y)=>rect(x,y,170,85,'#56695e')+rect(x+145,y-12,28,112,'#cdd5cb')+rect(x+173,y-12,100,14,'#8fb477')+rect(x+25,y-29,75,26,'#53665a')+text(x+15,y+51,'DF 500',23,'#fffefa')+ln(x+173,y+42,x+202,y+42,accent,'5 5');
const leader=(x1,y1,x2,y2,label,tx=x2,ty=y2-12)=>ln(x1,y1,x2,y2,accent)+text(tx,ty,label,21,accent);
export function workshopSVG(course,step){
 const {width:w,depth:d,height:h,thickness:t}=course.dimensions,a=course.axis,xs=course.positions;
 const px=x=>130+940*x/w;let art='';
 switch(step.figure){
 case 'plan':
  art=rect(350,210,90,320)+rect(350,150,550,60)+rect(387,180,16,75,accent,accent)+ln(350,150,350,530,accent)+text(190,340,'R / WAND',24,accent)+ln(310,330,350,330,accent)+text(490,370,'01 · Hakenbrett')+text(580,130,'02 · Ablage')+dim(350,90,900,90,f(d)+' mm')+dim(440,590,900,590,'90°-Ecke')+text(462,255,'DOMINO 4 × 20')+text(462,292,'10 mm je Partner',22)+text(356,570,f(t)+' mm',20)+`<path d="M440 245h35v-35" fill="none" stroke="${ink}" stroke-width="3"/>`;
  break;
 case 'measure':
  art=rect(280,250,640,110)+rect(220,180,680,35,'#d7ddd5')+rect(260,180,22,180,'#66766b')+rect(280,338,180,22,'#66766b')+rect(280,212,180,22,'#66766b')+rect(590,155,180,68,ink)+text(680,200,f(t)+' mm',30,'#fffefa','middle')+ln(300,305,900,305,red,'10 6')+dim(970,250,970,360,f(t)+' mm')+text(350,430,'Messflächen sauber und ohne Druck anlegen',25)+text(350,475,'Fräsachse: '+f(t)+' ÷ 2 = '+f(a)+' mm',25,accent);
  break;
 case 'cutmark':case 'sawcut':
  art=rect(110,210,960,260)+rect(850,210,220,260,'url(#hatch)')+ln(850,190,850,490,red,'8 5')+dim(130,150,850,150,f(w)+' mm ab linker Nullkante')+dim(75,210,75,470,f(h)+' mm')+text(150,280,'01 · GUTTEIL',26)+text(900,345,'X',55,accent)+text(898,395,'Abfall',23,accent)+text(150,580,'Die Sägefuge liegt rechts von der fertigen Maßlinie.',24);
  if(step.figure==='cutmark')art+=rect(380,400,300,23,'#bfc9bd')+rect(380,270,22,153,'#bfc9bd')+ln(420,280,570,150,accent)+text(460,245,'Winkel',23);
  else art+=rect(730,185,110,310,'#bcc6b8')+rect(715,300,120,110,ink)+arrow(775,290,775,220)+pill(140,385,'Schiene auf dem Gutteil')+clamp(160,440)+clamp(570,440);
  break;
 case 'sawset':
  art=rect(170,390,860,100,'#d9ddd4')+rect(170,300,860,90)+rect(230,270,600,30,'#bec9b9')+rect(380,150,350,120,ink)+`<circle cx="550" cy="305" r="100" fill="#d5dcd1" stroke="${ink}" stroke-width="3"/>`+ln(550,205,550,405,red,'8 5')+dim(950,300,950,390,f(t)+' mm Holz')+leader(560,405,760,535,'ca. 2 mm in die Opferplatte',540,567)+text(190,592,'Schienenversatz nach Sägenanleitung berücksichtigen.',23)+pill(220,105,'Schnittwinkel 90°');
  break;
 case 'reference':
  art=rect(150,160,850,145)+ln(150,160,1000,160,accent)+pill(175,185,'01 · R / breite Rückseite')+pill(165,262,'L')+rect(150,370,850,165)+ln(150,370,1000,370,accent)+pill(175,440,'02 · U / Unterseite')+text(650,410,'R / hintere Schmalkante',22,accent)+pill(165,492,'L')+arrow(1060,200,1060,370);
  break;
 case 'positions':case 'boardaxis':case 'shelfaxis':
  if(step.figure==='boardaxis'){
   art=rect(130,235,940,145)+ln(130,235,1070,235,accent)+ln(130,307,1070,307,red,'10 6')+text(140,205,'R / Rückseite oben',23,accent)+text(140,430,'Obere Kontaktkante des Hakenbretts',25)+text(140,475,'Die Taschen laufen längs der Brettkante.',24)+dim(1130,235,1130,307,f(a));
   xs.forEach((x,i)=>{art+=ln(px(x),215,px(x),397,red,'6 5')+slot(px(x),307,48)+cross(px(x),307)+text(px(x),175,String(i+1),22,ink,'middle');});
  }else{
   const y0=step.figure==='positions'?175:200,second=step.figure==='positions';
   art=rect(130,y0,940,second?105:280)+rect(130,y0,940,48,'url(#hatch)')+ln(130,y0,1070,y0,accent)+ln(130,y0+24,1070,y0+24,red,'10 6')+text(130,y0-25,'R / hintere Bezugskante',23,accent);
   if(second)art+=rect(130,330,940,110)+ln(130,330,1070,330,accent)+ln(130,385,1070,385,red,'10 6')+text(140,480,'02 · Unterseite oben / 01 · Rückseite oben',22);
   else art+=text(460,385,'02 · U / UNTERSEITE',26)+text(145,540,'Schraffur = Kontaktstreifen, '+f(t)+' mm breit',23)+dim(1130,y0,1130,y0+24,f(a));
   xs.forEach((x,i)=>{art+=ln(px(x),y0-10,px(x),second?450:y0+85,red,'6 5')+cross(px(x),y0+24)+text(px(x),second?535:580,f(x),22,ink,'middle')+text(px(x),y0+110,String(i+1),20,accent,'middle');if(second)art+=cross(px(x),385);});
   art+=text(130,second?590:625,'Alle Positionsmaße in mm, einzeln ab L gemessen.',22)+pill(70,y0+65,'L');
  }
  break;
 case 'cutter':
  art=rect(180,235,380,65,'#bfc9bd')+rect(560,250,155,35,'#849779')+ln(585,250,615,285)+ln(620,250,650,285)+ln(655,250,685,285)+text(180,185,'D 4-NL 11 HW-DF 500',30)+text(180,360,'Kurzer Spezialfräser · Ø 4 mm',24)+rect(780,230,190,70,wood)+dim(780,195,970,195,'20 mm')+text(780,360,'DOMINO',25)+text(780,400,'4 × 20 mm',25)+pill(180,470,'Netzstecker gezogen')+text(180,555,'Fräser nur mit verriegeltem Führungsgestell betreiben.',23);
  break;
 case 'depth':
  art=rect(170,225,360,200)+rect(560,225,360,200)+rect(440,310,90,36,'#66766b')+rect(560,310,90,36,'#66766b')+rect(440,316,210,24,accent)+dim(440,280,530,280,'10 mm')+dim(560,280,650,280,'10 mm')+text(170,190,'Partner 01',24)+text(560,190,'Partner 02',24)+pill(170,490,'Tiefenrastung 20 mm')+text(170,580,'Nur mit dem verkürzten D-4-Spezialfräser: real 10 + 10 mm.',23)+pill(720,490,'Winkel 90°');
  break;
 case 'height':
  art=rect(485,290,510,170)+rect(450,255,410,35,'#98b080')+rect(450,255,35,200,'#bdc9b7')+ln(390,375,1040,375,red,'10 6')+slot(486,375,26)+dim(1070,290,1070,375,'h = '+f(a)+' mm')+text(495,225,'Unterseite des 90°-Anschlags',24)+text(625,420,'Fräsermitte',24,red)+text(170,520,'Freie Höhenskala: '+f(a)+' mm',30)+text(170,570,'Materialstärken-Vorwahl nach hinten außer Eingriff.',23)+pill(170,125,'Maschine stromlos einrichten');
  break;
 case 'width':
  art=rect(130,180,940,115)+rect(130,395,940,115)+text(140,150,'01 · Hakenbrett / alle eng',24)+text(140,365,'02 · Ablage / erstes eng, weitere mit Spiel',24);
  xs.forEach((x,i)=>{art+=slot(px(x),237,40)+slot(px(x),452,i?72:40)+ln(px(x),215,px(x),475,red,'6 6')+text(px(x),552,String(i+1),24,ink,'middle');});
  art+=text(140,610,'Mehrbreite wirkt nur entlang der Brettlänge.',24);
  break;
 case 'test':case 'dryfit':
  art=rect(320,260,82,250)+rect(320,200,520,60)+rect(352,230,16,65,accent)+text(320,160,step.figure==='test'?'PROBE AUS GLEICH DICKEM RESTHOLZ':'TROCKENPROBE OHNE LEIM',25)+ln(320,200,320,510,accent)+`<path d="M403 305h45v-45" fill="none" stroke="${ink}" stroke-width="4"/>`+leader(320,390,175,390,'R bündig',105,360)+text(510,340,'90° kontrollieren',25)+text(510,385,'Stirnenden bündig',25)+text(510,430,'Fuge geschlossen',25)+pill(510,495,'Keine Gewalt');
  break;
 case 'boardsetup':case 'boardroute':
  art=rect(390,370,690,145)+rect(440,275,600,95)+ln(440,275,1040,275,accent)+machine(267,287)+arrow(200,329,410,329)+text(640,255,'R / breite Rückseite oben',24,accent)+text(675,420,'01 / flach gespannt',25)+text(130,185,'IN DIE OBERE SCHMALE KANTE FRÄSEN',25)+clamp(770,298)+clamp(930,298)+leader(467,340,520,565,'Fräsfront an der Kontaktkante',420,600)+text(130,545,step.figure==='boardroute'?'Motor vor → ganz zurück → abheben':'Anschlag liegt vollflächig auf R',23);
  if(step.figure==='boardroute')art+=arrow(411,360,200,360);
  break;
 case 'shelfsetup':case 'shelfroute':
  art=rect(480,265,85,300)+rect(565,265,345,300,'#d5ddce')+ln(480,265,910,265,accent)+machine(307,277)+rect(480,312,47,14,'#66766b')+arrow(230,320,465,320)+text(150,165,'IN DIE BREITE UNTERSEITE U FRÄSEN',25)+text(628,430,'Stützklotz',25)+text(628,470,'fest mitspannen',22)+text(493,500,'02',24)+`<path d="M450 465v135h480v-135" fill="none" stroke="#66766b" stroke-width="9"/>`+rect(456,465,23,60,accent,'none')+rect(910,465,18,60,accent,'none')+leader(490,417,255,510,'U zum Bediener',140,550)+text(590,235,'R oben, Klotz fluchtet',23,accent)+dim(482,610,565,610,f(t)+' mm')+text(625,660,'Restholz: '+f(t-10)+' mm',23);
  if(step.figure==='shelfroute')art+=arrow(470,360,250,360)+pill(650,125,'1 eng · weitere mittel');
  break;
 case 'sand':
  art=rect(150,260,900,230)+rect(430,225,250,90,'#c5ccbe')+rect(430,315,250,10,accent)+arrow(360,375,790,375)+ln(150,260,1050,260,accent)+text(160,190,'Kontaktkante eben und rechtwinklig lassen',25)+text(160,555,'120 → 180 · gleichmäßig in Faserrichtung',27)+text(160,605,'Leimflächen bleiben ohne Öl, Wachs oder Lack.',23);
  break;
 case 'glue':
  art=rect(320,345,80,220)+rect(320,180,520,60)+rect(350,300,18,80,accent)+rect(320,335,80,10,'#ded69c')+rect(320,240,80,10,'#ded69c')+arrow(550,270,550,360)+text(470,420,'Dünner Film auf den Kontaktflächen',24)+text(470,465,'Leim an den Dübelkontaktflächen',24)+text(470,510,'Keine gefüllte Leimpfütze in der Tasche',22)+pill(180,110,'Offene Leimzeit beachten');
  break;
 case 'clamp':
  art=rect(390,240,80,290)+rect(390,180,520,60)+`<path d="M340 140h-50v440h210v-50" fill="none" stroke="#66766b" stroke-width="13"/>`+rect(355,145,120,30,'#c5b79a')+rect(370,530,120,30,'#c5b79a')+arrow(420,105,420,180)+arrow(420,620,420,565)+`<path d="M470 240h105l-105 105z" fill="${soft}" stroke="${ink}" stroke-width="3"/>`+text(620,345,'Winkelhilfe hält 90°',25)+text(620,390,'Zulagen schützen Holz',24)+text(620,440,'Zwei Zwingen entlang',23)+text(620,475,'der Brettlänge verteilen',23)+text(120,665,'Press- und Aushärtezeit: Angaben auf dem Leimgebinde.',24);
  break;
 case 'hooks':
  art=rect(130,190,940,300)+ln(130,340,1070,340,red,'10 6')+text(130,145,'VORDERANSICHT · obere Hakenbrettkante als Bezug',24)+dim(1130,190,1130,340,f(h/2));
  for(let i=0;i<5;i++){const x=px(w*(i+.5)/5);art+=cross(x,340)+rect(x-20,315,40,50,'#c0c9bb')+`<circle cx="${x}" cy="326" r="4" fill="${ink}"/><circle cx="${x}" cy="355" r="4" fill="${ink}"/>`+text(x,550,f(w*(i+.5)/5),22,ink,'middle');}
  art+=text(130,605,'Schraubenlöcher vom echten Haken übertragen.',25)+text(130,645,'Gezeigtes Bohrbild ist schematisch, keine Bohrschablone.',21,accent);
  break;
 case 'wall':
  art=rect(130,230,940,290)+rect(205,150,790,50,'#b2c79e')+`<circle cx="600" cy="175" r="13" fill="#fffefa" stroke="${ink}"/>`+text(215,135,'Mit Wasserwaage ausrichten',24)+text(155,610,'x = 50 / '+f(w-50)+' mm · y = '+f(h/4)+' mm ab Brettoberkante',25)+text(155,655,'Dübel und Bohrwerte erst nach Klärung des Wandaufbaus.',22,accent);
  for(const x of[50,w-50])art+=`<circle cx="${px(x)}" cy="302" r="13" fill="none" stroke="${red}" stroke-width="4"/>`+ln(px(x),200,px(x),540,red,'8 5');
  break;
 default:throw Error('Unbekannte Werkstattskizze: '+step.figure);
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720" role="img" aria-label="${esc(step.title+'. '+step.caption)}"><title>${esc(step.title)}</title><desc>${esc(step.caption)}</desc><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${accent}"/></marker><marker id="dim" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M10 0L0 5L10 10" fill="none" stroke="${ink}" stroke-width="2"/></marker><pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#eee3cc"/><path d="M0 14L14 0" stroke="#bba986" stroke-width="1"/></pattern></defs><rect width="1200" height="720" fill="#f5f4ec"/>${text(40,48,'WERKSTÜCK / '+step.phase.toLocaleUpperCase('de-DE'),18)}${text(1160,48,'EIGENE FUNKTIONSSKIZZE · NICHT MASSSTÄBLICH',15,'#6d746c','end')}${art}</svg>`;
}
export async function workshopPNG(course,step){
 const svg=workshopSVG(course,step),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
 try{const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=960;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,1600,960);return canvas.toDataURL('image/png');}finally{URL.revokeObjectURL(url);}
}
