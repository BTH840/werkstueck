// Part-led picture plan. All pockets and bores share one measurement model.
export const WORKSHOP_REVISION='df500-garderobe-v4';
export const WORKSHOP_SOURCES=[
 {title:'Festool DOMINO-Anwenderhandbuch',url:'https://www.festool.ch/-/media/tts/fcp/festool/knowledge/downloads-page/download-brochures/manual_domino/manual_domino_system.pdf',note:'DF 500 Q, D-4-Spezialfräser: Rastung 20 = real 10 mm. Eigene Zeichnungen und Arbeitsfolge.'},
 {title:'Festool Betriebsanleitung',url:'https://media.cdn.festool.io/productmedia/Images/attachment/d2e7333e-3714-11f0-8a62-005056b3ad01.pdf',note:'Betriebsanleitung der verwendeten Maschine beachten; sichere Aufspannung und Probe an Restholz.'}
];
export function normalizeWorkshopHardware(value={},dimensions){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Ungültige Beschlagdaten.');
 const read=(v,label,min,max)=>{if(v===undefined||v===null||v==='')return null;if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw Error(`${label}: ${min} bis ${max} mm.`);return Math.round(v*1000)/1000;};
 const count=value.hookCount??0;if(!Number.isInteger(count)||count<0||count>2)throw Error('Pro Haken sind hier ein oder zwei Löcher vorgesehen.');
 const hookHoles=Array.from({length:count},(_,i)=>{const p=value.hookHoles?.[i]||{};return {dx:read(p.dx,'Lochabstand x',-100,100),dy:read(p.dy,'Lochabstand y',-100,100),diameter:read(p.diameter,'Hakenbohrung Ø',.5,12),depth:read(p.depth,'Hakenbohrtiefe',.5,dimensions?dimensions.thickness-3:50)};});
 const config={hookCount:count,hookHoles,boardDiameter:read(value.boardDiameter,'Holzdurchgang Ø',1,20),wallDiameter:read(value.wallDiameter,'Wandbohrung Ø',1,30),wallDepth:read(value.wallDepth,'Wandbohrtiefe',1,200)};
 if(dimensions)for(let i=0;i<5;i++)for(const hole of hookHoles){if(hole.dx===null||hole.dy===null)continue;const x=dimensions.width*(i+.5)/5+hole.dx,y=dimensions.height/2+hole.dy,r=(hole.diameter||0)/2;if(x-r<=0||x+r>=dimensions.width||y-r<=0||y+r>=dimensions.height)throw Error('Eine Hakenbohrung liegt außerhalb des Bretts.');}
 return config;
}
export function workshopFor(m){
 if(m.project.id!=='garderobe'||m.connection!=='domino')return null;
 const d=m.dimensions,x=[...m.joinery.rows[0].positions],a=d.thickness/2,hardware=normalizeWorkshopHardware(m.workshopHardware||{},d);
 const hookCenters=Array.from({length:5},(_,i)=>({x:d.width*(i+.5)/5,y:d.height/2}));
 const hookBores=[];let no=1;
 for(const [hookIndex,center]of hookCenters.entries())for(const [patternIndex,p]of hardware.hookHoles.entries()){
  if(p.dx===null||p.dy===null)continue;
  hookBores.push({id:'H'+no++,kind:'hook',hookIndex,patternIndex,x:Math.round((center.x+p.dx)*1000)/1000,y:Math.round((center.y+p.dy)*1000)/1000,diameter:p.diameter,depth:p.depth,through:false});
 }
 const boardBores=[50,d.width-50].map((x,i)=>({id:'W'+(i+1),kind:'board',x,y:d.height/4,diameter:hardware.boardDiameter,depth:d.thickness,through:true}));
 const wallBores=boardBores.map((p,i)=>({...p,id:'M'+(i+1),kind:'wall',diameter:hardware.wallDiameter,depth:hardware.wallDepth,through:false}));
 const pockets=[...x.map((at,i)=>({id:'F'+(i+1),part:'01',x:at,y:a,width:17,height:4,depth:10})),...x.map((at,i)=>({id:'F'+(x.length+i+1),part:'02',x:at,y:a,width:i?23:17,height:4,depth:10}))];
 const step=(id,phase,title,figure,part)=>({id,phase,title,figure,part,caption:title,visual:{instruction:title,view:title}});
 return {revision:WORKSHOP_REVISION,title:'Garderobe · Bildanleitung',tool:'Festool DOMINO DF 500 Q',dimensions:d,positions:x,axis:a,pocketDepth:10,depthSetting:20,angle:90,dowels:x.length,rest:d.thickness-10,sources:WORKSHOP_SOURCES,hardware,hookCenters,hookBores,boardBores,wallBores,pockets,
  illustrationReference:{title:'Bildaufbau: IKEA BEKVÄM',url:'https://www.ikea.com/de/de/assembly_instructions/bekvaem-tritthocker-akazie__AA-444158-11-2.pdf',note:'Nummerierte Bildschritte als Gestaltungsreferenz. Keine übernommenen Zeichnungen.'},
  steps:[
   step('ueberblick','Überblick','Die fertige Garderobe','overview','ALLE'),
   step('bauteile','Überblick','Bauteile','exploded-names','ALLE'),
   step('zuschnitt-01','Zuschnitt','Hakenbrett zuschneiden','cut-board','01'),
   step('zuschnitt-02','Zuschnitt','Ablage zuschneiden','cut-shelf','02'),
   step('anriss-01','Bohren & Fräsen','Hakenbrett anzeichnen','mark-edge','01'),
   step('anriss-02','Bohren & Fräsen','Ablage anzeichnen','mark-face','02'),
   step('fraesen-01','Bohren & Fräsen','Hakenbrett fräsen','route-edge','01'),
   step('fraesen-02','Bohren & Fräsen','Ablage fräsen','route-face','02'),
   step('bohrpunkte','Bohren & Fräsen','Bohrpunkte · jedes Loch einzeln','drill-board','01'),
   step('duebel','Zusammensetzen','Dübel und Leim','dowels','01 + 02'),
   step('fuegen','Zusammensetzen','Zusammenfügen','join','01 + 02'),
   step('fertig','Zusammensetzen','Haken befestigen','finished','01 + 02')
  ]};
}
