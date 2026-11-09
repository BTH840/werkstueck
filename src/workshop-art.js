// One projection and one set of visible faces for every board and assembly.
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const f=n=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:3}).format(n);
const ink='#26342e',accent='#ad512f',muted='#7c827c';
const txt=(x,y,s,size=24,color=ink,anchor='start')=>`<text x="${x}" y="${y}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" fill="${color}" text-anchor="${anchor}">${esc(s)}</text>`;
const ln=(a,b,{color=ink,dash=false,width=2,...attrs}={})=>`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${color}" stroke-width="${width}" ${dash?'stroke-dasharray="9 7"':''} ${Object.entries(attrs).map(([k,v])=>`${k}="${v}"`).join(' ')}/>`;
const pg=(ps,fill='#fff')=>`<polygon points="${ps.map(p=>p.join(',')).join(' ')}" fill="${fill}" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
const box2=(x,y,w,h,fill='#fff')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${fill}" stroke="#cdd3c8" stroke-width="1.5"/>`;
const arrow=(a,b)=>ln(a,b,{color:accent,width:3,'marker-end':'url(#move)'});
const mark=p=>`<g data-mark="center">${ln([p[0]-8,p[1]],[p[0]+8,p[1]],{color:accent})}${ln([p[0],p[1]-8],[p[0],p[1]+8],{color:accent})}<circle cx="${p[0]}" cy="${p[1]}" r="12" fill="none" stroke="${accent}" stroke-width="1.6"/></g>`;
const dim=(p,q,label,{x=(p[0]+q[0])/2,y=(p[1]+q[1])/2-13,size=24}={})=>ln(p,q,{width:1.4,'marker-start':'url(#dim)','marker-end':'url(#dim)'})+`<rect x="${x-label.length*size*.27-7}" y="${y-size}" width="${label.length*size*.54+14}" height="${size+6}" fill="#fff"/>`+txt(x,y,label,size,ink,'middle');
const dot=(x,y,s)=>`<circle cx="${x}" cy="${y}" r="22" fill="${ink}"/>`+txt(x,y+8,s,21,'#fff','middle');
export const partProjection=(x,y,z)=>[x+.42*y,.70*y-.90*z];
export function partBlockGeometry(w,d,t){
 // The viewing ray is (-.42, 1, .70/.90): left, front and top are visible.
 return [
  {face:'left',normal:[-1,0,0],points:[[0,0,t],[0,d,t],[0,d,0],[0,0,0]]},
  {face:'front',normal:[0,1,0],points:[[0,d,t],[w,d,t],[w,d,0],[0,d,0]]},
  {face:'top',normal:[0,0,1],points:[[0,0,t],[w,0,t],[w,d,t],[0,d,t]]}
 ];
}
function partBoard(w,d,t,{x=105,y=270,maxW=955,maxH=270}={}){
 const s=Math.min(maxW/(w+.42*d),maxH/(.7*d+.9*t));
 const p=(X,Y,Z=t)=>{const v=partProjection(X,Y,Z);return [x+s*v[0],y+s*v[1]];};
 const art=partBlockGeometry(w,d,t).map(({face,points})=>`<g data-face="${face}">${pg(points.map(q=>p(...q)),{left:'#e6e9e1',front:'#f0f2ec',top:'#fff'}[face])}</g>`).join('');
 return {w,d,t,s,p,art};
}
function dimensionRow(b,xs,{front=false}={}){
 const all=[0,...xs,b.w],edge=front?b.d:0,z=front?0:b.t,row=b.p(0,edge,z)[1]+(front?58:-55);let a='';
 for(const x of all){const q=b.p(x,edge,z);a+=ln(q,[q[0],row],{color:'#a9b2a5',width:1});}
 for(let i=1;i<all.length;i++){const p=b.p(all[i-1],edge,z),q=b.p(all[i],edge,z);a+=dim([p[0],row],[q[0],row],f(Math.round((all[i]-all[i-1])*1000)/1000),{size:23});}
 return a;
}
function pocket(b,x,y,z,wide=17,edge=false){
 const pts=[],r=2,half=(wide-4)/2;
 for(const side of[1,-1])for(let i=0;i<=12;i++){const angle=(side===1?-Math.PI/2:Math.PI/2)+Math.PI*i/12,dx=side*half+r*Math.cos(angle),dy=r*Math.sin(angle);pts.push(edge?b.p(x+dx,y,z+dy):b.p(x+dx,y+dy,z));}
 return `<g data-mark="pocket" data-x-mm="${x}" data-offset-mm="${edge?z:y}">${pg(pts,'#53624f')}</g>`;
}
// Baseline dimensions always start at a real edge, never at the previous hole.
function baselineDimensions(b,rows,{edge=false,top=200,yDimensions=false}={}){
 let out='';
 const point=r=>edge?b.p(r.x,b.d,r.y):b.p(r.x,r.y);
 const groups=new Map();
 for(const r of rows){const key=r.x+','+r.y;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
 [...groups.values()].sort((a,b)=>b[0].x-a[0].x||b[0].y-a[0].y).forEach((group,i)=>{
  const r=group[0],q=point(r),p=edge?b.p(0,b.d,r.y):b.p(0,r.y),row=top+i*35;
  out+=`<g data-dimension-axis="x" data-from-edge="left" data-hole-ids="${group.map(r=>r.id).join(' ')}" data-mm="${r.x}">`;
  for(const v of[p,...group.map(point)])out+=ln(v,[v[0],row-5],{color:'#b3bbb0',width:1});
  out+=dim([p[0],row],[q[0],row],group.map(r=>r.id).join('/')+' · '+f(r.x),{size:21,y:row-8})+'</g>';
 });
 if(yDimensions){
  const yGroups=new Map();for(const r of rows){if(!yGroups.has(r.y))yGroups.set(r.y,[]);yGroups.get(r.y).push(r);}
  [...yGroups.values()].sort((a,b)=>b[0].y-a[0].y).forEach((group,i)=>{
   const r=group[0],left=100+i*72,p=b.p(0,0),q=b.p(0,r.y),P=[left,p[1]],Q=[left+q[0]-p[0],q[1]];
   out+=`<g data-dimension-axis="y" data-from-edge="top" data-hole-ids="${group.map(r=>r.id).join(' ')}" data-mm="${r.y}">`;
   out+=ln(b.p(r.x,0),P,{color:'#b3bbb0',width:1});
   for(const v of group)out+=ln(point(v),Q,{color:'#b3bbb0',width:1});
   out+=dim(P,Q,f(r.y),{size:23,x:left-30,y:(P[1]+Q[1])/2+7})+'</g>';
  });
 }
 return out;
}
function axisDetail(c,face,rows){
 const t=c.dimensions.thickness,b=partBoard(65,30,t,{x:125,y:610,maxW:300,maxH:95}),ids=rows.map(r=>r.id).join(' ');
 let out=box2(60,505,420,200,'#fafbf7')+txt(80,534,'Detail · '+rows.map(r=>r.id).join(' / '),21)+b.art;
 const point=face?b.p(35,c.axis):b.p(35,b.d,c.axis),start=face?b.p(35,0):b.p(35,b.d,t);
 const P=face?[95,start[1]]:[point[0]+100,start[1]],Q=face?[95+point[0]-start[0],point[1]]:[point[0]+100,point[1]];
 out+=ln(face?b.p(0,c.axis):b.p(0,b.d,c.axis),face?b.p(65,c.axis):b.p(65,b.d,c.axis),{color:accent,dash:true})+mark(point);
 out+=`<g data-dimension-axis="offset" data-from-edge="${face?'rear-edge':'rear-face'}" data-hole-ids="${ids}" data-mm="${c.axis}">`+ln(start,P,{color:muted,width:1})+ln(point,Q,{color:muted,width:1})+dim(P,Q,f(c.axis),{x:face?80:P[0]+30,y:(P[1]+Q[1])/2+7,size:23})+'</g>';
 out+=txt(80,688,face?'ab Hinterkante':'ab Rückseite',20);
 // The reference line terminates on the actual datum edge/face of the enlarged board.
 out+=ln([250,680],start,{color:muted,width:1});return out;
}
function cutPart(c,shelf){
 const {width:w,height:h,depth:d,thickness:t}=c.dimensions,depth=shelf?d:h;
 const b=partBoard(w,depth,t,{y:300,maxH:300});let a=b.art+dimensionRow(b,[]);
 const p=b.p(w,0),q=b.p(w,depth);a+=ln(p,[p[0]+40,p[1]],{color:muted,width:1})+ln(q,[q[0]+40,q[1]],{color:muted,width:1})+dim([p[0]+40,p[1]],[q[0]+40,q[1]],f(depth),{x:(p[0]+q[0])/2+78,y:(p[1]+q[1])/2+8});
 const mid=b.p(w*.18,depth,0);a+=dim([mid[0]-28,mid[1]],[mid[0]-28,mid[1]-.9*t*b.s],f(t),{x:mid[0]-65,y:mid[1]-2,size:22});
 a+=dot(105,150,shelf?'02':'01')+txt(140,158,'1×',25)+txt(600,650,[w,depth,t].map(f).join(' × ')+' mm',34,ink,'middle');return a;
}
function pocketTable(c,face){
 const rows=c.pockets.filter(p=>p.part===(face?'02':'01'));let out=box2(505,505,635,200,'#fafbf7');
 const cols=[530,700,970];['ID','Schlitz','Tiefe'].forEach((v,i)=>out+=txt(cols[i],534,v,21,muted));
 rows.forEach((r,i)=>{const y=569+i*32;[r.id,f(r.width)+' × '+f(r.height),f(r.depth)].forEach((v,j)=>out+=txt(cols[j],y,v,24));});
 return out+txt(85,740,'DF 500 Q · D 4 · h '+f(c.axis)+' · 90° · 20 → 10 mm',23);
}
function millPart(c,face,finished){
 const {width:w,height:h,depth:d,thickness:t}=c.dimensions,depth=face?d:h,b=partBoard(w,depth,t,{x:160,y:345,maxW:890,maxH:135}),rows=c.pockets.filter(r=>r.part===(face?'02':'01'));let out=b.art;
 out+=ln(face?b.p(0,c.axis):b.p(0,depth,c.axis),face?b.p(w,c.axis):b.p(w,depth,c.axis),{color:accent,dash:true,width:2.5});
 for(const r of rows){const p=face?b.p(r.x,c.axis):b.p(r.x,depth,c.axis);out+=ln(b.p(r.x,0),b.p(r.x,depth),{color:muted,dash:true,width:1});if(!face)out+=ln(b.p(r.x,depth),b.p(r.x,depth,0),{color:muted,dash:true,width:1});out+=finished?pocket(b,r.x,face?c.axis:depth,face?t:c.axis,r.width,!face):mark(p);out+=txt(p[0]+14,p[1]+27,r.id,20,accent);}
 out+=baselineDimensions(b,rows,{edge:!face,top:190});
 out+=dot(105,140,face?'02':'01')+txt(145,148,face?'Unterseite':'Rückseite',28)+txt(138,b.p(0,0)[1]-10,'links',20,accent,'end')+axisDetail(c,face,rows)+pocketTable(c,face);return out;
}
function drillPart(c,hookIndex){
 const detail=hookIndex!==undefined,{width:w,height:h,thickness:t}=c.dimensions,b=partBoard(w,h,t,{x:250,y:305,maxW:800,maxH:140}),hookRows=detail?c.hookBores.filter(r=>r.hookIndex===hookIndex):c.hookBores,wallRows=detail?[]:c.boardBores;
 let out=b.art+dot(100,140,'01')+txt(150,148,detail?'Vorderseite · Haken '+(hookIndex+1):'Vorderseite',23);
 for(const row of new Set([...hookRows,...wallRows].map(r=>r.y)))out+=ln(b.p(0,row),b.p(w,row),{color:muted,dash:true,width:1});
 for(const r of wallRows){const p=b.p(r.x,r.y);out+=`<g data-mark="wall-point" data-x-mm="${r.x}" data-y-mm="${r.y}">${mark(p)}</g>`+txt(p[0]+15,p[1]+27,r.id+'/M'+r.id.slice(1),19,accent);}
 for(const r of hookRows){const p=b.p(r.x,r.y);out+=`<g data-mark="hook-bore" data-hole-id="${r.id}" data-x-mm="${r.x}" data-y-mm="${r.y}">${ln([p[0]-5,p[1]],[p[0]+5,p[1]],{color:accent})}${ln([p[0],p[1]-5],[p[0],p[1]+5],{color:accent})}<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="none" stroke="${accent}"/></g>`+txt(p[0]+13,p[1]+(r.patternIndex?23:-14),r.id,17,accent);}
 if(!c.hookBores.length)for(const r of c.hookCenters){const p=b.p(r.x,r.y);out+=ln([p[0],p[1]-5],[p[0],p[1]+5],{color:muted,width:2});}
 const measured=detail?hookRows:wallRows.map(r=>({...r,id:r.id+'/M'+r.id.slice(1)}));
 out+=baselineDimensions(b,measured,{top:200,yDimensions:true});
 out+=txt(235,b.p(0,0)[1]-12,'oben',19,accent)+txt(235,b.p(0,h)[1]+20,'links',19,accent,'end');
 out+=txt(70,463,detail?'Ab linker Kante / ab Oberkante → Lochmitte':c.hookBores.length?'Hakenmaße: nächste Bilder':'Haken: Lochbild offen',23,muted);
 const rows=detail?hookRows:[...c.hookBores,...c.boardBores,...c.wallBores],columns=rows.length>6?2:1,per=Math.ceil(rows.length/columns),cw=1080/columns;
 for(let col=0;col<columns;col++){
  const left=60+col*cw;out+=box2(left,495,cw-10,237,'#fafbf7');const offsets=columns===1?[20,200,420,650,850]:[12,87,192,302,405];
  ['ID','x','y','Ø','Tiefe'].forEach((v,j)=>out+=txt(left+offsets[j],525,v,21,muted));
  rows.slice(col*per,(col+1)*per).forEach((r,i)=>{const y=556+i*25;[r.id,f(r.x),f(r.y),r.diameter===null?'offen':f(r.diameter),r.through?'durch '+f(r.depth):r.depth===null?'offen':f(r.depth)].forEach((v,j)=>out+=txt(left+offsets[j],y,v,columns===1?25:20));});
 }
 return out;
}
function assembled(c,{lift=0,dowels=false,finished=false,labels=false,overview=false}={}){
 const {width:w,height:h,depth:d,thickness:t}=c.dimensions;
 const s=Math.min(880/(w+.42*d),420/(.9*(h+t+lift)+.7*d)),x0=(1200-s*(w+.42*d))/2,y0=550;
 const p=(X,Y,Z)=>{const q=partProjection(X,Y,Z);return [x0+s*q[0],y0+s*q[1]];};
 function block(X,Y,Z,W,D,H){return partBlockGeometry(W,D,H).map(({face,points})=>`<g data-face="${face}">${pg(points.map(([x,y,z])=>p(X+x,Y+y,Z+z)),{left:'#e6e9e1',front:'#f0f2ec',top:'#fff'}[face])}</g>`).join('');}
 let a=block(0,0,0,w,t,h);
 for(const x of c.positions){if(dowels)a+=block(x-8.5,t/2-2,h-10,17,4,20);if(lift)a+=ln(p(x,t/2,h+10),p(x,t/2,h+lift),{color:accent,dash:true});}
 a+=block(0,0,h+lift,w,d,t);
 if(lift)for(const x of[c.positions[0],c.positions.at(-1)])a+=arrow(p(x,t/2,h+lift-14),p(x,t/2,h+28));
 if(dowels&&!labels){a+=txt(100,655,c.dowels+'× DOMINO 4 × 20',30)+txt(1050,710,'Leim',26,accent,'end')+ln([970,690],p(w*.85,t/2,h),{color:accent,width:1.5});}
 if(finished){for(let i=0;i<5;i++){const x=w*(i+.5)/5,Y=t+(labels?95:0);if(labels)a+=ln(p(x,t,h/2),p(x,Y,h/2),{color:accent,dash:true,width:1.5});a+=block(x-7,Y,h/2-18,14,3,36)+block(x-3,Y+3,h/2-12,6,25,7)+block(x-3,Y+25,h/2-12,6,4,16);}if(!overview&&!labels)a+=txt(600,705,'5×',32,ink,'middle');}
 const id1=p(w*.13,t,h*.48),id2=p(w*.78,d*.55,h+t+lift);
 if(labels){
  a+=txt(70,190,'02 · Ablage',27)+ln([245,185],p(w*.12,d*.5,h+t+lift),{color:muted,width:1.4});
  a+=txt(70,590,'01 · Hakenbrett',27)+ln([290,582],p(w*.12,t,h*.4),{color:muted,width:1.4});
  a+=txt(70,690,'03 · DOMINO-Dübel · '+c.dowels+'×',25)+ln([330,665],p(c.positions[0],t/2,h+10),{color:muted,width:1.4});
  a+=txt(1120,690,'04 · Haken · 5×',25,ink,'end')+ln([1010,660],p(w*.9,t+95,h/2),{color:muted,width:1.4});
 }else if(!overview)a+=dot(id1[0],id1[1],'01')+dot(id2[0],id2[1],'02');
 if(overview)a+=txt(600,705,[w,d,h+t].map(f).join(' × ')+' mm',30,ink,'middle');
 return a;
}
export function workshopSVG(c,step){
 const i=c.steps.findIndex(s=>s.id===step.id)+1;let a='';
 switch(step.figure){
  case 'overview':a=assembled(c,{finished:true,overview:true});break;
  case 'exploded-names':a=assembled(c,{lift:Math.max(140,c.dimensions.depth*1.45),dowels:true,finished:true,labels:true});break;
  case 'cut-board':a=cutPart(c,false);break;
  case 'cut-shelf':a=cutPart(c,true);break;
  case 'mark-edge':a=millPart(c,false,false);break;
  case 'mark-face':a=millPart(c,true,false);break;
  case 'route-edge':a=millPart(c,false,true);break;
  case 'route-face':a=millPart(c,true,true);break;
  case 'drill-board':a=drillPart(c);break;
  case 'drill-hook':a=drillPart(c,step.hookIndex);break;
  case 'dowels':a=assembled(c,{lift:Math.max(140,c.dimensions.depth*1.45),dowels:true});break;
  case 'join':a=assembled(c);for(const X of[400,800])a+=arrow([X,210],[X,280]);a+=txt(600,705,'90° · bündig',30,ink,'middle');break;
  case 'finished':a=assembled(c,{finished:true});break;
  default:throw Error('Unbekannter Bildschritt: '+step.figure);
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" data-illustration="workpiece-only" data-projection="shared-oblique" aria-label="${esc(step.title)}"><title>${esc(step.title)}</title><defs><marker id="move" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${accent}"/></marker><marker id="dim" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M10 0L0 5L10 10" fill="none" stroke="${ink}" stroke-width="1.4"/></marker></defs><rect width="1200" height="800" fill="#fff"/>${txt(40,82,String(i).padStart(2,'0'),62)}${txt(140,79,step.title,33)}${txt(1160,44,step.phase,17,muted,'end')}${a}${ln([40,758],[1160,758],{color:'#dce0d6',width:1})}${txt(45,787,'mm',19,muted)}${txt(1155,787,'ENTWURF',15,muted,'end')}</svg>`;
}
export async function workshopPNG(course,step){
 const url=URL.createObjectURL(new Blob([workshopSVG(course,step)],{type:'image/svg+xml'}));
 try{const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=1200;canvas.getContext('2d').drawImage(img,0,0,1800,1200);return canvas.toDataURL('image/png');}finally{URL.revokeObjectURL(url);}
}
