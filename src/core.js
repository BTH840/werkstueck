import {PROJECTS,CONNECTIONS,getProject} from './projects.js';
export const DEFAULTS=Object.freeze({...getProject().defaults});
export const LIMITS=Object.freeze({...getProject().limits});
export const tools=['Maßband, Bleistift und Winkel','Säge mit Führung und passendem Sägeblatt','Bohrschrauber, Holzbohrer und Senker','Zwingen und rechtwinklige Montagehilfe','Schleifpapier und Schleifklotz','Schutzbrille, Gehörschutz und passende Staubabsaugung'];
export const number=(n,digits=2)=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:digits}).format(n);
export const money=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(n);
export function validateDimensions(input,projectId='werkstattkiste'){
 const p=getProject(projectId),d={};
 for(const [key,[min,max]] of Object.entries(p.limits)){
  if(typeof input[key]!=='number'||!Number.isFinite(input[key])||input[key]<min||input[key]>max)throw Error(`${p.labels[key]||'Materialstärke'}: erlaubt sind ${number(min/(key==='thickness'?1:10))}–${number(max/(key==='thickness'?1:10))} ${key==='thickness'?'mm':'cm'}.`);
  d[key]=Math.round(input[key]*1000)/1000;
 }
 if(projectId==='nistkasten'&&(d.width-2*d.thickness<140||d.depth-2*d.thickness<140))throw Error('Der Innenboden des Nistkastens muss mindestens 140 × 140 mm groß bleiben.');
 if(projectId==='utensilo'&&d.height-9*d.depth<8*25)throw Error('Zwischen den neun Latten müssen mindestens 25 mm frei bleiben.');
 return d;
}
function board(id,name,size,center,cut,stage,explode,note='Alle Kanten rechtwinklig',extra={}){return {id,name,size,center,cut,stage,explode,note,...extra};}
function accessory(id,name,size,center,stage,color='#66756c',extra={}){return board(id,name,size,center,null,stage,[0,50,50],'Zukaufteil, schematisch',{color,...extra});}
function ropePart(id,from,to){const dx=to[0]-from[0],dy=to[1]-from[1],len=Math.hypot(dx,dy);return accessory(id,'Seil',[4,len,4],[(from[0]+to[0])/2,(from[1]+to[1])/2,14],3,'#9d8252',{rotationZ:-Math.atan2(dx,dy)});}
function boxParts(d){const {width:w,depth:z,height:h,thickness:t}=d;return [
 board('01','Boden',[w,t,z],[0,t/2,0],[w,z,t],0,[0,-80,0]),
 board('02','Rückwand',[w,h,t],[0,t+h/2,-z/2+t/2],[w,h,t],1,[0,20,-140],'Steht auf dem Boden'),
 board('03','Stirnwand links',[t,h,z-2*t],[-w/2+t/2,t+h/2,0],[z-2*t,h,t],2,[-140,20,0],'Zwischen den Längswänden'),
 board('04','Stirnwand rechts',[t,h,z-2*t],[w/2-t/2,t+h/2,0],[z-2*t,h,t],2,[140,20,0],'Zwischen den Längswänden'),
 board('05','Vorderwand',[w,h,t],[0,t+h/2,z/2-t/2],[w,h,t],3,[0,20,140],'Steht auf dem Boden')];}
function jointsFor(id,d){const {width:w,depth:z,height:h,thickness:t}=d;
 if(id==='garderobe')return [{parts:'01 / 02',length:w,axis:'An der langen Kontaktkante der Ablage; ab linker Stirnkante'}];
 if(['werkstattkiste','pflanzkasten'].includes(id))return [
 ...['02','05'].map(part=>({parts:`01 / ${part}`,length:w,axis:'Boden/Längswand: entlang der Breite ab linker Stirnkante'})),
 ...['03','04'].map(part=>({parts:`01 / ${part}`,length:z-2*t,axis:'Ab hinterer Stirnkante der Stirnwand; auf dem Boden + Materialstärke'})),
 ...['02 / 03','02 / 04','05 / 03','05 / 04'].map(parts=>({parts,length:h,axis:'Wandecke: von der unteren Wandkante aufwärts'}))];
 return [];
}
export function createModel(input=DEFAULTS,projectId='werkstattkiste',connectionId){
 const project=getProject(projectId),d=validateDimensions(input,projectId),{width:w,depth:z,height:h,thickness:t}=d;
 const connection=connectionId||project.connections[0];
 if(!project.connections.includes(connection))throw Error('Diese Verbindung passt nicht zu diesem Projekt.');
 if(['domino','round'].includes(connection)&&t<16)throw Error('Für die hier geplanten Dübelverbindungen sind mindestens 16 mm Materialstärke vorgesehen.');
 let parts=[],extras=[],details=[];
 if(['werkstattkiste','pflanzkasten'].includes(projectId)){parts=boxParts(d);if(projectId==='pflanzkasten'){details.push('Vier Entwässerungsbohrungen Ø 8 mm im Boden; Auskleidung an diesen Stellen öffnen.');parts[0].note='Vier Ablauflöcher Ø 8 mm; Holzauflager zusätzlich prüfen';extras.push({name:'Auskleidung mit geöffnetem Wasserablauf',quantity:1,unit:'Zuschnitt'});}}
 if(projectId==='nistkasten'){
  parts=[board('01','Innenboden',[w-2*t,t,z-2*t],[0,t/2,0],[w-2*t,z-2*t,t],0,[0,-70,0],'Vier Ablauflöcher Ø 5 mm'),
   board('02','Rückwand',[w,h,t],[0,h/2,-z/2+t/2],[w,h,t],1,[0,10,-90]),
   board('03','Seitenwand links',[t,h,z-2*t],[-w/2+t/2,h/2,0],[z-2*t,h,t],1,[-80,10,0]),
   board('04','Seitenwand rechts',[t,h,z-2*t],[w/2-t/2,h/2,0],[z-2*t,h,t],1,[80,10,0]),
   board('05','Reinigungsfront',[w,h,t],[0,h/2,z/2-t/2],[w,h,t],2,[0,10,90],'Einflugloch Ø 32 mm; Lochmitte 200 mm über Innenboden',{holes:[{x:0,y:t+200-h/2,r:16}]}),
   board('06','Dach',[w+40,t,z+80],[0,h+t/2,20],[w+40,z+80,t],3,[0,90,20],'Vorne 60 mm, hinten und seitlich 20 mm Überstand')];
  extras=[{name:'Rostfreie Schrauben für Korpus und lösbare Front',quantity:20,unit:'Stück'},{name:'Wetterfeste Dachabdeckung',quantity:1,unit:'Zuschnitt'},{name:'Baumschonende Aufhängung',quantity:1,unit:'Satz'}];
  details=[`Innenboden: ${number(w-2*t)} × ${number(z-2*t)} mm. Einflugloch Ø 32 mm, Lochunterkante 184 mm über Innenboden.`,`Dachüberstand vorn 60 mm; Außenhöhe ${number(h+t)} mm. Front lösbar, kein Leim und keine Ansitzstange.`];
 }
 if(projectId==='seilbaum'){
  const ls=[w,.75*w,.5*w];parts=ls.map((len,i)=>board(String(i+1).padStart(2,'0'),['Untere Latte','Mittlere Latte','Obere Latte'][i],[len,z,t],[0,z/2+i*h,0],[len,z,t],i,[0,i*30,80],`Zwei Löcher Ø 6 mm, jeweils 50 mm vom Ende`,{holes:[{x:-len/2+50,y:0,r:3},{x:len/2-50,y:0,r:3}]}));
  for(const sign of[-1,1]){for(let i=0;i<2;i++)parts.push(ropePart('S'+sign+i,[sign*(ls[i]/2-50),z/2+i*h],[sign*(ls[i+1]/2-50),z/2+(i+1)*h]));parts.push(ropePart('S'+sign+'top',[sign*(ls[2]/2-50),z/2+2*h],[0,2*h+z+250]));}
  const ropeLength=2*(2*Math.hypot(w*.125,h)+Math.hypot(w*.25-50,250+z/2))+600;
  extras=[{name:'Naturfaserseil Ø 4 mm, inklusive Knotenreserve',quantity:Math.ceil(ropeLength/100)*100,unit:'mm'},{name:'Passender Aufhängehaken',quantity:1,unit:'Stück'}];
  details=[`Lattenlängen ${ls.map(n=>number(n)).join(' / ')} mm. Sechs Bohrungen Ø 6 mm, Randabstand 50 mm.`,`Mittenabstand ${number(h)} mm; die Knotenpositionen am aufgelegten Werkstück abstimmen. Die obere Schlaufe ist schematisch.`];
 }
 if(projectId==='garderobe'){
  parts=[board('01','Hakenbrett',[w,h,t],[0,h/2,-z/2+t/2],[w,h,t],0,[0,0,-70]),board('02','Ablage',[w,t,z],[0,h+t/2,0],[w,z,t],1,[0,70,0],'Liegt auf der Oberkante des Hakenbretts')];
  for(let i=0;i<5;i++){const x=-w/2+w*(i+.5)/5;parts.push(accessory('H'+i+'a','Hakenfuß',[16,40,4],[x,h*.5,-z/2+t+2],2),accessory('H'+i+'b','Haken',[8,8,30],[x,h*.5-12,-z/2+t+19],3));}
  extras=[{name:'Mantelhaken mit passenden Befestigungsschrauben',quantity:5,unit:'Stück'},{name:'Befestigungssatz passend zur Wand',quantity:2,unit:'Sätze'}];details=[`Fünf Haken mit ${number(w/5)} mm Teilung; Positionen von links: ${Array.from({length:5},(_,i)=>number(w*(i+.5)/5)).join(' / ')} mm.`,`Wandbefestigung 50 mm von beiden Brettenden; die Holzverbindung ersetzt niemals Wanddübel oder Hakenschrauben.`];
 }
 if(projectId==='utensilo'){
  const gap=(h-9*z)/8;parts=Array.from({length:9},(_,i)=>board(String(i+1).padStart(2,'0'),'Latte '+(i+1),[w,z,t],[0,z/2+i*(z+gap),0],[w,z,t],Math.floor(i/3),[0,0,80],'Rechtwinklig; Bandlinie 70 mm vom Ende'));
  for(const sign of[-1,1])parts.push(accessory('B'+sign,'Tragband',[25,h,2],[sign*(w/2-70),h/2,-t/2-1],3,'#7b7d6c'));
  extras=[{name:'Tragband, Länge einschließlich 80 mm Zugabe',quantity:2,unit:`× ${number(h+80)} mm`},{name:'Passende Tackerklammern (3 je Band/Latte)',quantity:54,unit:'Stück'},{name:'Geeignete Wand- oder Türhaken',quantity:2,unit:'Stück'}];details=[`Neun Latten; freier Abstand ${number(gap)} mm. Bänder je ${number(h+80)} mm; Befestigungslinien 70 mm vom Rand.`,`Bänder sind biegsam, keine starren Holzverbindungen. Nicht für DOMINO- oder Runddübel geeignet.`];
 }
 const woodParts=parts.filter(p=>p.cut),area=woodParts.reduce((a,p)=>a+p.cut[0]*p.cut[1]/1e6,0);
 const bounds=[0,1,2].map(axis=>[Math.min(...parts.map(p=>p.center[axis]-p.size[axis]/2)),Math.max(...parts.map(p=>p.center[axis]+p.size[axis]/2))]);
 // Rope prisms are rotated. Explicit bounds describe the hanging silhouette, not their unrotated boxes.
 let overall=[bounds[0][1]-bounds[0][0],bounds[2][1]-bounds[2][0],bounds[1][1]-bounds[1][0]];
 if(projectId==='seilbaum')overall=[w,Math.max(t,16),2*h+z+250];
 const model={project,dimensions:d,connection,parts,woodParts,area,overall,extras,details,joints:jointsFor(projectId,d),fingerprint:JSON.stringify({projectId,d,connection})};
 model.joinery=joineryFor(model);return model;
}
export function joineryFor(model){
 const type=model.connection,t=model.dimensions.thickness;
 const rows=model.joints.map(j=>{const count=Math.max(2,Math.ceil(j.length/250)+1),edge=37;return {...j,positions:Array.from({length:count},(_,i)=>Math.round((edge+(j.length-2*edge)*i/(count-1))*1000)/1000),count};});
 const count=rows.reduce((a,j)=>a+j.count,0),base={type,name:CONNECTIONS[type].name,rows,count,unit:CONNECTIONS[type].unit};
 if(type==='domino'&&model.project.outdoor)return {...base,size:'5 × 30 mm',text:`${count} DOMINO-Dübel 5 × 30 mm aus Sipo mit geeignetem Außenleim.`,machining:`Mittig bei ${number(t/2)} mm; 5-mm-Fräser, Flächentasche 12 mm und Stirntasche 20 mm tief, enges Langloch 18 × 5 mm. Zusammen 32 mm Taschen für 30 mm Dübellänge; Restmaterial auf der Flächenseite ${number(t-12)} mm.`,tools:['DOMINO DF 500 mit 5-mm-Fräser, Anschlag und Absaugung','Für außen geeigneter Leim, Zulagen und Zwingen'],source:'https://www.festool.ch/-/media/tts/fcp/festool/knowledge/downloads-page/download-brochures/manual_domino/manual_domino_system.pdf'};
 if(type==='domino')return {...base,size:'4 × 20 mm',text:`${count} DOMINO-Dübel 4 × 20 mm, ${model.project.outdoor?'Sipo für außen':'Buche für innen'}, mit geeignetem Leim.`,machining:`Mittig bei ${number(t/2)} mm; tatsächliche Taschen 10 mm tief je Partner, enges Langloch 17 × 4 mm. DF 500 mit Spezialfräser D 4: Tiefeneinstellung 20 mm ergibt real 10 mm.`,tools:['DOMINO DF 500 mit passendem 4-mm-Spezialfräser, Anschlag und Absaugung','Geeigneter Holzleim, Zulagen und Zwingen'],source:'https://www.festool.ch/-/media/tts/fcp/festool/knowledge/downloads-page/download-brochures/manual_domino/manual_domino_system.pdf'};
 if(type==='round')return {...base,size:'6 × 30 mm',text:`${count} Runddübel 6 × 30 mm mit geeignetem Holzleim${model.project.outdoor?'; nur für den Außeneinsatz geeignetes Dübelsystem verwenden':''}.`,machining:`Bohrachse mittig bei ${number(t/2)} mm. Ø 6 mm; Flächenbohrung 10,5 mm, Stirnbohrung 20,5 mm. Mit Tiefenanschlag arbeiten und Restmaterial prüfen.`,tools:['Dübellehre, Ø-6-mm-Holzbohrer und Tiefenanschlag','Geeigneter Holzleim, Zulagen und Zwingen']};
 if(type==='screws')return {...base,size:'projektabhängig',count:count||20,text:count?`${count} passende Holzschrauben; Durchmesser und Länge an Material und Schraubrichtung abstimmen.`:'Rostfreie Schrauben; Front und Dach bleiben für Wartung lösbar.',machining:`Schrauben mittig zur ${number(t)}-mm-Materialkante anzeichnen, vorbohren und senken. Keine pauschale Schraubenlänge bei frei gewählter Stärke.`,tools:[]};
 if(type==='rope')return {...base,count:6,text:'Seil Ø 4 mm durch sechs Bohrungen Ø 6 mm führen und unter jeder Latte verknoten.',machining:'Bohrungen mittig in der Lattenbreite, 50 mm vom jeweiligen Stirnende. Knoten am Werkstück ausrichten.',tools:['Ø-6-mm-Holzbohrer und Seil Ø 4 mm']};
 return {...base,count:54,text:'Zwei durchgehende Tragbänder und 54 passende Tackerklammern; keine Holz-Dübelverbindung.',machining:'Bandlinien 70 mm von beiden Stirnenden. Je Latte und Band drei Klammern, ohne die Vorderseite zu durchstoßen.',tools:['Tacker mit zum Holz passenden Klammern','Zwei geeignete Tragbänder']};
}
export function toolsFor(model){return [...tools,...model.joinery.tools,...(model.project.id==='nistkasten'?['Ø-32-mm-Forstnerbohrer und Ø-5-mm-Holzbohrer']:[])];}
export function stepsFor(m){const d=m.dimensions,p=m.project.id,n=number,j=m.joinery;
 let a;
 if(['werkstattkiste','pflanzkasten'].includes(p))a=[['Boden vorbereiten','01',`Schneide fünf Bretter zu; Boden ${n(d.width)} × ${n(d.depth)} mm. Nummern übertragen und Schnittkanten glätten.`,'Materialstärke und Sägezugabe prüfen.'],['Rückwand ausrichten','01 + 02','Rückwand bündig auf die hintere Bodenkante stellen und rechtwinklig fixieren.','Verbindungsmittelpunkte aus der Verbindungsliste auf beide Partner übertragen.'],['Stirnwände einsetzen','03 + 04',`Beide Stirnwände sind ${n(d.depth-2*d.thickness)} mm lang und stehen zwischen den Längswänden.`,'Trocken zusammenstellen; Innenmaß und rechte Winkel kontrollieren.'],['Vorderwand schließen','05','Vorderwand bündig anlegen und Diagonalen vergleichen. Nach der trockenen Passprobe die Teile wieder auseinandernehmen.',j.text],['Verbinden & fertigstellen','ALLE',j.text+' '+j.machining+' Am zerlegten Werkstück vorbereiten, danach ausrichten und zusammenfügen.',p==='pflanzkasten'?'Vier Bodenabläufe Ø 8 mm bohren; Auskleidung mit freiem Wasserablauf einpassen. Vor Befüllung Boden und Verbindungen prüfen.':'Leim nach Herstellerangabe aushärten lassen, Kanten glätten und den Probebau prüfen.']];
 if(p==='nistkasten')a=[['Innenboden vorbereiten','01',`Innenboden ${n(d.width-2*d.thickness)} × ${n(d.depth-2*d.thickness)} mm zuschneiden. Vier Abläufe Ø 5 mm bohren.`,'Massivholz naturbelassen; Innenflächen rau lassen.'],['Wände verschrauben','02 + 03 + 04','Rückwand und Seiten bündig um den Innenboden stellen, vorbohren und verschrauben.','Keine Nägel. Die Front wird später von vorn verschraubt und bleibt abnehmbar.'],['Reinigungsfront einpassen','05','Einflugloch Ø 32 mm mit Mittelpunkt 200 mm über dem Innenboden bohren. Front mit vier rostfreien Schrauben von vorn lösbar befestigen; zur Reinigung vollständig abnehmen.','Lochunterkante bleibt 184 mm über dem Innenboden. Keine Ansitzstange.'],['Dach aufsetzen','06','Dach seitlich und hinten 20 mm, vorne 60 mm überstehen lassen. Lösbar befestigen und wetterfest abdecken.','Die vier Frontschrauben müssen für die Reinigung zugänglich bleiben.'],['Aufhängen & reinigen','ALLE','Baumschonende Befestigung vorsehen; Kasten leicht nach vorn geneigt und geschützt aufhängen.','Konstruktion und Aufhängung vor Ort prüfen; nach der Brutsaison kontrollieren.']];
 if(p==='seilbaum')a=[['Untere Latte zuschneiden','01',`Die untere Latte auf ${n(d.width)} mm sägen und Kanten glätten.`,'Beide Enden rechtwinklig.'],['Mittlere Latte ergänzen','02',`Mittlere Latte auf ${n(d.width*.75)} mm ablängen.`,'Proportion 3/4 der unteren Latte.'],['Obere Latte ergänzen','03',`Obere Latte auf ${n(d.width*.5)} mm ablängen.`,'Proportion 1/2 der unteren Latte.'],['Bohren & auffädeln','ALLE',j.text,`Bohrungen 50 mm vom Ende; zwischen den Lattenmitten ${n(d.height)} mm einstellen.`],['Schlaufe & Dekoration','ALLE','Obere Schlaufe knoten, alle Latten waagerecht ausrichten und mit leichter Dekoration bestücken.','Aufhängung am tatsächlichen Gewicht prüfen. Knotenabstände sind nicht automatisch Mittenabstände.']];
 if(p==='garderobe')a=[['Hakenbrett vorbereiten','01',`Brett auf ${n(d.width)} × ${n(d.height)} mm zuschneiden; zwei Wandbohrungen jeweils 50 mm vom Rand markieren.`,'Wandbeschaffenheit und verdeckte Leitungen vor dem Bohren klären.'],['Ablage verbinden','02',`Ablage ${n(d.width)} × ${n(d.depth)} mm auf die Oberkante setzen. ${j.text}`,j.machining],['Fünf Haken anzeichnen','HAKEN',`Fünf Mittelpunkte mit ${n(d.width/5)} mm Teilung übertragen.`,'Befestigungsbild der tatsächlich gekauften Haken verwenden.'],['Haken anschrauben','HAKEN','Haken vorbohren und mit den dafür passenden Schrauben befestigen.','Die Wahl DOMINO oder Runddübel betrifft ausschließlich die Holzablage.'],['An der Wand montieren','ALLE','Mit Wasserwaage ausrichten und an geeigneten Wanddübeln verschrauben.','Aufhängung und Belastbarkeit vor Nutzung prüfen.']];
 if(p==='utensilo')a=[['Erste Latten vorbereiten','01–03',`Neun Latten auf ${n(d.width)} × ${n(d.depth)} × ${n(d.thickness)} mm sägen und schleifen.`,'Alle Latten gleich lang.'],['Mittlere Latten auslegen','04–06',`Freien Abstand ${(n((d.height-9*d.depth)/8))} mm mit Distanzstücken einstellen.`,'Die Gesamthöhe wird aus neun Latten und acht Zwischenräumen gebildet.'],['Obere Latten ausrichten','07–09','Alle neun Latten rechtwinklig auf der Unterlage ausrichten.','Gesamthöhe und parallele Enden kontrollieren.'],['Bänder befestigen','BÄNDER',j.text,j.machining],['Aufhängen & bestücken','ALLE','Tragbänder und geeignete Wand- oder Türhaken verbinden. Erst danach leichte Behälter ergänzen.','Tackerklammern dürfen vorn nicht austreten; kein Dübelersatz für flexible Bänder.']];
 return a.map(([title,parts,text,check])=>({title,parts,text,check}));
}
export function estimate(model,quantity,woodPrice,hardwarePrice){if(!Number.isInteger(quantity)||quantity<1||quantity>100||![woodPrice,hardwarePrice].every(n=>Number.isFinite(n)&&n>=0&&n<=10000))throw Error('Bitte gültige Stückzahl und Preise eingeben.');const area=model.area*1.15*quantity;return {area,total:area*woodPrice+quantity*hardwarePrice};}
export function projectFile(dimensions,project='werkstattkiste',connection){const m=createModel(dimensions,project,connection);return JSON.stringify({schema:'werkstueck/v2',project,connection:m.connection,units:'mm',dimensions:m.dimensions},null,2);}
export function parseProject(raw){const p=JSON.parse(raw);if(!p||typeof p!=='object'||!['werkstueck/v1','werkstueck/v2'].includes(p.schema))throw Error('Unbekanntes Werkstück-Dateiformat.');if(p.units&&p.units!=='mm')throw Error('Die Projektdatei muss Millimeter verwenden.');const m=createModel(p.dimensions,p.project,p.connection);return {project:m.project.id,dimensions:m.dimensions,connection:m.connection};}
export function cutCSV(model){return '\ufeff'+[['Projekt',model.project.short,'Verbindung',model.joinery.name],['Teil','Bezeichnung','Länge (mm)','Breite (mm)','Stärke (mm)','Anzahl','Hinweis'],...model.woodParts.map(p=>[p.id,p.name,...p.cut.map(n=>number(n,3)),1,p.note])].map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(';')).join('\r\n');}
export function auditModel(m){const d=m.dimensions,id=m.project.id,tests=[{name:'Positive Zuschnittmaße',pass:m.woodParts.every(p=>p.cut.every(n=>Number.isFinite(n)&&n>0))},{name:'Materialstärke in allen Holzteilen',pass:m.woodParts.every(p=>p.cut[2]===d.thickness)}];
 if(m.joinery.rows.length)tests.push({name:'Verbindungsmittel liegen innerhalb der Kontaktkante',pass:m.joinery.rows.every(r=>r.positions.every(x=>x>=37&&x<=r.length-37))});
 if(['werkstattkiste','pflanzkasten'].includes(id))tests.push({name:'Stirnwand + 2 Materialstärken = Außentiefe',pass:Math.abs(m.parts[2].cut[0]+2*d.thickness-d.depth)<.0001});
 if(id==='nistkasten')tests.push({name:'Innenboden mindestens 140 × 140 mm, Lochunterkante ≥ 170 mm',pass:d.width-2*d.thickness>=140&&d.depth-2*d.thickness>=140&&184>=170});
 if(id==='seilbaum')tests.push({name:'Lattenproportionen 1 / 0,75 / 0,5; Ø 6 mm bleibt fest',pass:m.woodParts.every((p,i)=>p.cut[0]===[1,.75,.5][i]*d.width&&p.holes.every(h=>h.r===3))});
 if(id==='garderobe')tests.push({name:'Fünf gleichmäßig verteilte Haken',pass:m.parts.filter(p=>p.id.startsWith('H')&&p.id.endsWith('a')).length===5});
 if(id==='utensilo')tests.push({name:'9 Latten + 8 Zwischenräume = Gesamthöhe',pass:Math.abs(9*d.depth+8*((d.height-9*d.depth)/8)-d.height)<.0001});
 return tests;
}
export {PROJECTS,CONNECTIONS,getProject};
