import {drawGpu} from './gpu.js';
// Dependency-free orthographic 3D renderer. Geometry comes only from the shared model.
const faces = [[0,3,2,1],[4,5,6,7],[0,1,5,4],[3,7,6,2],[0,4,7,3],[1,2,6,5]];
const shades = ['#b18d59','#dbb882','#c09a65','#eed2a0','#c7a16e','#dfbd87'];
export class Viewer {
 constructor(canvas,model,options={}) {
  this.canvas=canvas; this.ctx=canvas.getContext('2d'); this.model=model; this.options=options;
  this.yaw=-0.68; this.pitch=0.46; this.zoom=1; this.explode=options.explode??0; this.stage=4; this.selected=null; this.polygons=[];
  this.resizeObserver=new ResizeObserver(()=>this.draw());this.resizeObserver.observe(canvas);
  if(options.interactive!==false) this.bind();
 }
 project([x,y,z]) {
  const cy=Math.cos(this.yaw),sy=Math.sin(this.yaw),cp=Math.cos(this.pitch),sp=Math.sin(this.pitch);
  const xx=x*cy+z*sy,zz=-x*sy+z*cy,yy=y-this.model.overall[2]*0.45;
  return [this.w/2+xx*this.scale,this.h*0.49+(-yy*cp+zz*sp)*this.scale,yy*sp+zz*cp];
 }
 draw() {
  const c=this.canvas,ctx=this.ctx,r=c.getBoundingClientRect();if(!r.width||!r.height)return;
  this.w=r.width;this.h=r.height;const dpr=Math.min(window.devicePixelRatio||1,2);
  if(c.width!==Math.round(r.width*dpr)||c.height!==Math.round(r.height*dpr)){c.width=Math.round(r.width*dpr);c.height=Math.round(r.height*dpr);}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,this.w,this.h);
  const extent=Math.max(this.model.overall[0],this.model.overall[1]*1.3,this.model.overall[2]*1.1,250);
  this.scale=Math.min(this.w/(extent*1.65),this.h/(extent*.96))*this.zoom;
  this.grid();
  this.polygons=[];
  for(const p of this.model.parts.filter(p=>p.stage<=this.stage)){
   const [a,b,d]=p.size.map(n=>n/2),center=p.center.map((n,i)=>n+p.explode[i]*this.explode);
   const transform=v=>{const r=p.rotationZ||0;return this.project([v[0]*Math.cos(r)-v[1]*Math.sin(r)+center[0],v[0]*Math.sin(r)+v[1]*Math.cos(r)+center[1],v[2]+center[2]]);};
   const vertices=[[-a,-b,-d],[a,-b,-d],[a,b,-d],[-a,b,-d],[-a,-b,d],[a,-b,d],[a,b,d],[-a,b,d]].map(transform);
   faces.forEach((face,i)=>{const points=face.map(n=>vertices[n]);const holes=(i<2?p.holes||[]:[]).map(h=>Array.from({length:40},(_,j)=>{const angle=j/40*Math.PI*2;return transform([h.x+Math.cos(angle)*h.r,h.y+Math.sin(angle)*h.r,i===0?-d:d]);}));this.polygons.push({points,holes,depth:points.reduce((s,v)=>s+v[2],0)/4,part:p,color:p.color||shades[i],face:i});});
  }
  this.polygons.sort((a,b)=>a.depth-b.depth);
  if(!drawGpu(this,this.model.parts.filter(p=>p.stage<=this.stage)))for(const poly of this.polygons){
   ctx.beginPath();poly.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
   for(const hole of poly.holes){hole.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();}
   ctx.fillStyle=poly.part.id===this.selected?'#bf6742':poly.color;ctx.fill('evenodd');ctx.strokeStyle='rgba(75,57,34,.30)';ctx.lineWidth=.8;ctx.stroke();
   ctx.save();ctx.clip('evenodd');const v=poly.points[0],u=poly.points[1],end=poly.points[3];
   ctx.strokeStyle=poly.part.id===this.selected?'rgba(255,237,208,.20)':'rgba(105,73,34,.12)';ctx.lineWidth=.65;
   for(let j=1;j<(poly.part.cut?19:1);j++){const f=j/19;ctx.beginPath();ctx.moveTo(v[0]+(end[0]-v[0])*f,v[1]+(end[1]-v[1])*f);ctx.lineTo(u[0]+(poly.points[2][0]-u[0])*f,u[1]+(poly.points[2][1]-u[1])*f);ctx.stroke();}ctx.restore();
  }
  if(this.explode>.5||this.options.labels){
   for(const p of this.model.parts.filter(p=>p.stage<=this.stage&&p.cut)){
    const pos=this.project(p.center.map((n,i)=>n+p.explode[i]*this.explode));ctx.fillStyle=p.id===this.selected?'#ad512f':'#263e36';ctx.beginPath();ctx.arc(pos[0],pos[1],13,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='10px ui-monospace, monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.id,pos[0],pos[1]);
   }
  }
  if(this.options.dimensions){
   const w=this.model.dimensions.width,z=this.model.dimensions.depth;
   const a=this.project([-w/2,-16,z/2+42]),b=this.project([w/2,-16,z/2+42]);
   ctx.strokeStyle='rgba(38,62,54,.6)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();
   for(const p of[a,b]){ctx.beginPath();ctx.moveTo(p[0]-3,p[1]-4);ctx.lineTo(p[0]+3,p[1]+4);ctx.stroke();}
   ctx.fillStyle='#263e36';ctx.font='11px ui-monospace, monospace';ctx.textAlign='center';ctx.fillText(new Intl.NumberFormat('de-DE',{maximumFractionDigits:2}).format(w/10)+' cm',(a[0]+b[0])/2,(a[1]+b[1])/2+17);
  }
 }
 grid(){
  const ctx=this.ctx;ctx.strokeStyle='rgba(38,62,54,.065)';ctx.lineWidth=.7;
  for(let n=-900;n<=900;n+=100){for(const line of[[[n,-90,-700],[n,-90,700]],[[-900,-90,n],[900,-90,n]]]){const a=this.project(line[0]),b=this.project(line[1]);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();}}
 }
 bind(){
  let pointer=null,moved=false;
  this.canvas.addEventListener('pointerdown',e=>{pointer=[e.clientX,e.clientY];moved=false;this.canvas.setPointerCapture(e.pointerId);});
  this.canvas.addEventListener('pointermove',e=>{if(!pointer)return;const dx=e.clientX-pointer[0],dy=e.clientY-pointer[1];if(Math.abs(dx)+Math.abs(dy)>2)moved=true;this.yaw+=dx*.008;this.pitch=Math.max(-.8,Math.min(1.3,this.pitch+dy*.006));pointer=[e.clientX,e.clientY];this.draw();});
  this.canvas.addEventListener('pointerup',e=>{if(!moved&&this.options.onSelect){const r=this.canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;for(const poly of [...this.polygons].reverse()){const path=new Path2D();poly.points.forEach(([px,py],i)=>i?path.lineTo(px,py):path.moveTo(px,py));path.closePath();if(this.ctx.isPointInPath(path,x*(this.canvas.width/this.w),y*(this.canvas.height/this.h))){this.options.onSelect(poly.part);break;}}}pointer=null;});
  this.canvas.addEventListener('pointercancel',()=>{pointer=null;});
  this.canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','Home'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')this.yaw-=.12;if(e.key==='ArrowRight')this.yaw+=.12;if(e.key==='ArrowUp')this.pitch=Math.min(1.3,this.pitch+.1);if(e.key==='ArrowDown')this.pitch=Math.max(-.8,this.pitch-.1);if(e.key==='+')this.changeZoom(.1);if(e.key==='-')this.changeZoom(-.1);if(e.key==='Home')this.reset();this.draw();});
 }
 changeZoom(delta){this.zoom=Math.min(1.8,Math.max(.6,this.zoom+delta));this.draw();}
 reset(){this.yaw=-.68;this.pitch=.46;this.zoom=1;this.draw();}
 update(model){this.model=model;this.draw();}
}
