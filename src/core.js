export const DEFAULTS = Object.freeze({width:600, depth:360, height:200, thickness:18});
export const LIMITS = Object.freeze({width:[300,1000],depth:[200,700],height:[100,400],thickness:[12,24]});
export const tools = ['Maßband, Bleistift und Winkel','Säge mit Führung und passendem Sägeblatt','Bohrschrauber, Holzbohrer und Senker','Zwingen und rechtwinklige Montagehilfe','Schleifpapier und Schleifklotz','Schutzbrille, Gehörschutz und passende Staubabsaugung'];
export const number = (n, digits=2) => new Intl.NumberFormat('de-DE',{maximumFractionDigits:digits}).format(n);
export const money = n => new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(n);
export function validateDimensions(input) {
  const d = {};
  for (const [key,[min,max]] of Object.entries(LIMITS)) {
    if (typeof input[key] !== 'number' || !Number.isFinite(input[key]) || input[key]<min || input[key]>max) throw new Error(`Ungültiges Maß: ${key}. Bitte die angegebenen Eingabebereiche einhalten.`);
    d[key] = Math.round(input[key]*1000)/1000;
  }
  return d;
}
export function createModel(input=DEFAULTS) {
  const d = validateDimensions(input), {width:w,depth:z,height:h,thickness:t}=d;
  const parts = [
    {id:'01',name:'Boden',size:[w,t,z],center:[0,t/2,0],cut:[w,z,t],stage:0,explode:[0,-80,0],note:'Alle Kanten rechtwinklig'},
    {id:'02',name:'Rückwand',size:[w,h,t],center:[0,t+h/2,-z/2+t/2],cut:[w,h,t],stage:1,explode:[0,20,-140],note:'Steht auf dem Boden'},
    {id:'03',name:'Stirnwand links',size:[t,h,z-2*t],center:[-w/2+t/2,t+h/2,0],cut:[z-2*t,h,t],stage:2,explode:[-140,20,0],note:'Zwischen den Längswänden'},
    {id:'04',name:'Stirnwand rechts',size:[t,h,z-2*t],center:[w/2-t/2,t+h/2,0],cut:[z-2*t,h,t],stage:2,explode:[140,20,0],note:'Zwischen den Längswänden'},
    {id:'05',name:'Vorderwand',size:[w,h,t],center:[0,t+h/2,z/2-t/2],cut:[w,h,t],stage:3,explode:[0,20,140],note:'Steht auf dem Boden'}
  ];
  const area = parts.reduce((a,p)=>a+p.cut[0]*p.cut[1]/1e6,0);
  return {dimensions:d,parts,area,overall:[w,z,h+t],fingerprint:JSON.stringify(d)};
}
export function stepsFor(model) {
 const {width:w,depth:d,height:h,thickness:t}=model.dimensions;
 return [
  {title:'Boden vorbereiten',parts:'01',text:`Schneide alle fünf Bauteile nach der Liste zu. Schleife die Schnittkanten. Lege den Boden (${number(w)} × ${number(d)} mm) auf eine ebene Unterlage.`,check:'Maße kontrollieren und die Bauteilnummern auf das Holz übertragen.'},
  {title:'Rückwand ausrichten',parts:'01 + 02',text:`Stelle die Rückwand bündig auf die hintere Bodenkante. Die Wandhöhe beträgt ${number(h)} mm. Fixiere die Teile rechtwinklig mit Zwingen.`,check:'Zunächst nur ausrichten. Die Verbindung wird nach dem trockenen Zusammenstellen gebohrt.'},
  {title:'Stirnwände einsetzen',parts:'03 + 04',text:`Setze beide ${number(d-2*t)} mm langen Stirnwände zwischen die Längswände. Ihre Außenkanten schließen mit dem Boden ab.`,check:'Mit dem Winkel prüfen. Die Materialstärke von '+number(t)+' mm ist bereits eingerechnet.'},
  {title:'Vorderwand schließen',parts:'05',text:'Richte die Vorderwand bündig aus und zwinge den Kasten vorsichtig zusammen. Prüfe rechte Winkel und vergleiche die beiden Diagonalen.',check:'Beide Diagonalen müssen gleich lang sein. Alle Teile sollen ohne Verspannung anliegen.'},
  {title:'Verbinden & fertigstellen',parts:'ALLE BAUTEILE',text:'Für den Entwurf sind etwa 20 Holzschrauben und geeigneter Holzleim vorgesehen: 12 Schrauben durch den Boden in die Wände und 8 durch die Längswände in die Stirnwände. Vorbohren und vorsichtig senken.',check:'Schraubenlänge, Randabstände und Bohrung passend zum tatsächlichen Holz festlegen. Für 18-mm-Material ist 4 × 40 mm ein Ausgangspunkt. Für andere Stärken neu prüfen. Leim nach Herstellerangabe aushärten lassen; Kanten schleifen.'}
 ];
}
export function estimate(model,quantity,woodPrice,hardwarePrice) {
 if (!Number.isInteger(quantity)||quantity<1||quantity>100||![woodPrice,hardwarePrice].every(n=>Number.isFinite(n)&&n>=0&&n<=10000)) throw new Error('Bitte gültige Stückzahl und Preise eingeben.');
 const area=model.area*1.15*quantity;
 return {area,total:area*woodPrice+quantity*hardwarePrice};
}
export function parseProject(raw) {
 const p=JSON.parse(raw);
 if(p.schema!=='werkstueck/v1'||p.project!=='werkstattkiste') throw new Error('Diese Datei ist kein unterstützter Werkstück-Entwurf.');
 return validateDimensions(p.dimensions);
}
export function projectFile(dimensions) {return JSON.stringify({schema:'werkstueck/v1',project:'werkstattkiste',units:'mm',dimensions:validateDimensions(dimensions)},null,2);}
export function cutCSV(model) {
 return '\ufeff'+[['Teil','Bezeichnung','Länge (mm)','Breite (mm)','Stärke (mm)','Anzahl','Hinweis'],...model.parts.map(p=>[p.id,p.name,...p.cut.map(n=>number(n,3)),1,p.note])].map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(';')).join('\r\n');
}
