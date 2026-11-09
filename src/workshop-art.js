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
function millingValues(c,edge){
 return box2(60,625,1080,100,'#f6f7f2')+txt(85,665,`DF 500 Q · D 4 · h ${f(c.axis)} · 90° · 20 → 10 mm`,25)+txt(85,705,edge?'01: eng':'02: 1 eng · weitere mittel',23)+txt(1115,705,'Probe: Restholz',20,accent,'end');
}
function smallAxis(c,face=false){
 let a=box2(60,520,465,135)+txt(80,549,face?'U · R → '+f(c.axis)+' mm':'R → '+f(c.axis)+' mm',21);
 // Detail retains the same projection and all visible thickness faces.
 const b=partBoard(75,face?22:c.dimensions.height/6,c.dimensions.thickness,{x:90,y:580,maxW:300,maxH:65});a+=b.art;
 const p=face?b.p(37.5,c.axis):b.p(37.5,b.d,c.axis);
 a+=ln(face?b.p(0,c.axis):b.p(0,b.d,c.axis),face?b.p(75,c.axis):b.p(75,b.d,c.axis),{color:accent,dash:true})+mark(p)+txt(465,610,f(c.axis)+' mm',21,accent,'end');
 return a;
}
function depthSection(c){
 const t=c.dimensions.thickness;
 return box2(575,500,565,105)+txt(595,525,'SCHNITT',18)+box2(650,545,360,40)+`<rect x="800" y="545" width="25" height="${40*10/t}" fill="#c1cbbb"/>`+dim([625,545],[625,545+40*10/t],'10',{x:603,y:565,size:20})+txt(1050,580,f(t-10)+' mm',20,ink,'middle');
}
function cutPart(c,shelf){
 const {width:w,height:h,depth:d,thickness:t}=c.dimensions,depth=shelf?d:h;
 const b=partBoard(w,depth,t,{y:300,maxH:300});let a=b.art+dimensionRow(b,[]);
 const p=b.p(w,0),q=b.p(w,depth);a+=ln(p,[p[0]+40,p[1]],{color:muted,width:1})+ln(q,[q[0]+40,q[1]],{color:muted,width:1})+dim([p[0]+40,p[1]],[q[0]+40,q[1]],f(depth),{x:(p[0]+q[0])/2+78,y:(p[1]+q[1])/2+8});
 const mid=b.p(w*.18,depth,0);a+=dim([mid[0]-28,mid[1]],[mid[0]-28,mid[1]-.9*t*b.s],f(t),{x:mid[0]-65,y:mid[1]-2,size:22});
 a+=dot(105,150,shelf?'02':'01')+txt(140,158,'1×',25)+txt(600,650,[w,depth,t].map(f).join(' × ')+' mm',34,ink,'middle');return a;
}
function millPart(c,face,finished){
 const {width:w,height:h,depth:d,thickness:t}=c.dimensions,depth=face?d:h,b=partBoard(w,depth,t,{y:280,maxH:185});let a=b.art;
 const p=(x)=>face?b.p(x,c.axis):b.p(x,depth,c.axis);
 a+=ln(face?b.p(0,c.axis):b.p(0,depth,c.axis),face?b.p(w,c.axis):b.p(w,depth,c.axis),{color:accent,dash:true,width:2.5});
 for(const [i,x]of c.positions.entries()){
  a+=ln(b.p(x,0),b.p(x,depth),{color:muted,dash:true,width:1});
  if(!face)a+=ln(b.p(x,depth),b.p(x,depth,0),{color:muted,dash:true,width:1});
  a+=finished?pocket(b,x,face?c.axis:depth,face?t:c.axis,face&&i?23:17,!face):mark(p(x));
 }
 a+=dimensionRow(b,c.positions,{front:!face})+dot(105,140,face?'02':'01')+txt(145,148,face?'U':'R',28)+txt(77,b.p(0,0)[1],'L',24,accent)+txt(1110,b.p(w,0)[1],'R',24,accent);
 if(finished)a+=millingValues(c,!face);
 else a+=smallAxis(c,face)+box2(575,520,565,135,'#f6f7f2')+txt(600,575,'L → '+c.positions.map(f).join(' / ')+' mm',25)+txt(600,620,'R → '+f(c.axis)+' mm',25,accent);
 if(finished)a+=depthSection(c);
 return a;
}
function drillPart(c){
 const {width:w,height:h,thickness:t}=c.dimensions,b=partBoard(w,h,t,{y:295,maxH:240}),wall=[50,w-50],hooks=Array.from({length:5},(_,i)=>w*(i+.5)/5);let a=b.art+dot(100,140,'01');
 for(const [xs,y,color,kind]of[[wall,h/4,accent,'wall-point'],[hooks,h/2,muted,'hook-center']]){
  a+=ln(b.p(0,y),b.p(w,y),{color,dash:true});
  for(const x of xs){const q=b.p(x,y);a+=`<g data-mark="${kind}" data-x-mm="${x}" data-y-mm="${y}">${mark(q)}</g>`;}
 }
 a+=dimensionRow(b,wall)+txt(90,560,'Wand: 50 / '+f(w-50)+' · ↓ '+f(h/4)+' mm',26,accent)+txt(90,608,'Haken: '+hooks.map(f).join(' / ')+' · ↓ '+f(h/2)+' mm',24)+txt(90,678,'Ø / Tiefe: Beschlag + Wand',24)+txt(90,719,'Haken: Bohrbild vom Beschlag',22,muted);return a;
}
function assembled(c,{lift=0,dowels=false,finished=false}={}){
 const {width:w,height:h,depth:d,thickness:t}=c.dimensions;
 const s=Math.min(880/(w+.42*d),420/(.9*(h+t+lift)+.7*d)),x0=(1200-s*(w+.42*d))/2,y0=550;
 const p=(X,Y,Z)=>{const q=partProjection(X,Y,Z);return [x0+s*q[0],y0+s*q[1]];};
 function block(X,Y,Z,W,D,H){return partBlockGeometry(W,D,H).map(({face,points})=>`<g data-face="${face}">${pg(points.map(([x,y,z])=>p(X+x,Y+y,Z+z)),{left:'#e6e9e1',front:'#f0f2ec',top:'#fff'}[face])}</g>`).join('');}
 let a=block(0,0,0,w,t,h);
 for(const x of c.positions){if(dowels)a+=block(x-8.5,t/2-2,h-10,17,4,20);if(lift)a+=ln(p(x,t/2,h+10),p(x,t/2,h+lift),{color:accent,dash:true});}
 a+=block(0,0,h+lift,w,d,t);
 if(lift)for(const x of[c.positions[0],c.positions.at(-1)])a+=arrow(p(x,t/2,h+lift-14),p(x,t/2,h+28));
 if(dowels){a+=txt(100,655,c.dowels+'× DOMINO 4 × 20',30)+txt(1050,710,'Leim',26,accent,'end')+ln([970,690],p(w*.85,t/2,h),{color:accent,width:1.5});}
 if(finished){for(let i=0;i<5;i++){const x=w*(i+.5)/5;a+=block(x-7,t,h/2-18,14,3,36)+block(x-3,t+3,h/2-12,6,25,7)+block(x-3,t+25,h/2-12,6,4,16);}a+=txt(600,705,'5×',32,ink,'middle');}
 const id1=p(w*.13,t,h*.48),id2=p(w*.78,d*.55,h+t+lift);a+=dot(id1[0],id1[1],'01')+dot(id2[0],id2[1],'02');return a;
}
export function workshopSVG(c,step){
 const i=c.steps.findIndex(s=>s.id===step.id)+1;let a='';
 switch(step.figure){
  case 'cut-board':a=cutPart(c,false);break;
  case 'cut-shelf':a=cutPart(c,true);break;
  case 'mark-edge':a=millPart(c,false,false);break;
  case 'mark-face':a=millPart(c,true,false);break;
  case 'route-edge':a=millPart(c,false,true);break;
  case 'route-face':a=millPart(c,true,true);break;
  case 'drill-board':a=drillPart(c);break;
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
