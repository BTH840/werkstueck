// Short, part-led sequence. Numbers and machining marks use the current model.
export const WORKSHOP_REVISION='df500-garderobe-v3';
export const WORKSHOP_SOURCES=[
 {title:'Festool DOMINO-Anwenderhandbuch',url:'https://www.festool.ch/-/media/tts/fcp/festool/knowledge/downloads-page/download-brochures/manual_domino/manual_domino_system.pdf',note:'DF 500 Q, D-4-Spezialfräser: Rastung 20 = real 10 mm. Eigene Zeichnungen und Arbeitsfolge.'},
 {title:'Festool Betriebsanleitung',url:'https://media.cdn.festool.io/productmedia/Images/attachment/d2e7333e-3714-11f0-8a62-005056b3ad01.pdf',note:'Betriebsanleitung der tatsächlich verwendeten Maschine beachten; sichere Aufspannung und Probe an Restholz.'}
];
export function workshopFor(m){
 if(m.project.id!=='garderobe'||m.connection!=='domino')return null;
 const d=m.dimensions,x=[...m.joinery.rows[0].positions],a=d.thickness/2;
 const step=(id,phase,title,figure,part)=>({id,phase,title,figure,part,caption:title,visual:{instruction:title,view:title}});
 return {revision:WORKSHOP_REVISION,title:'Garderobe · Bildanleitung',tool:'Festool DOMINO DF 500 Q',dimensions:d,positions:x,axis:a,pocketDepth:10,depthSetting:20,angle:90,dowels:x.length,rest:d.thickness-10,sources:WORKSHOP_SOURCES,
  illustrationReference:{title:'Bildaufbau: IKEA BEKVÄM',url:'https://www.ikea.com/de/de/assembly_instructions/bekvaem-tritthocker-akazie__AA-444158-11-2.pdf',note:'Nummerierte Bildschritte als Gestaltungsreferenz. Keine übernommenen Zeichnungen.'},
  steps:[
   step('zuschnitt-01','1 · Zuschnitt','Hakenbrett zuschneiden','cut-board','01'),
   step('zuschnitt-02','1 · Zuschnitt','Ablage zuschneiden','cut-shelf','02'),
   step('anriss-01','2 · Bohren & Fräsen','Hakenbrett anzeichnen','mark-edge','01'),
   step('anriss-02','2 · Bohren & Fräsen','Ablage anzeichnen','mark-face','02'),
   step('fraesen-01','2 · Bohren & Fräsen','Hakenbrett fräsen','route-edge','01'),
   step('fraesen-02','2 · Bohren & Fräsen','Ablage fräsen','route-face','02'),
   step('bohrpunkte','2 · Bohren & Fräsen','Bohrpunkte übertragen','drill-board','01'),
   step('duebel','3 · Zusammensetzen','Dübel und Leim','dowels','01 + 02'),
   step('fuegen','3 · Zusammensetzen','Zusammenfügen','join','01 + 02'),
   step('fertig','3 · Zusammensetzen','Haken befestigen','finished','01 + 02')
  ]};
}
