import {rotatePoint} from './geometry.js';
// One shared depth-buffered renderer, composited onto each viewer's accessible 2D canvas.
// Keeping the output canvas 2D also makes the exact same views available to PDF export.
const gpuFaceIndices=[[0,3,2,1],[4,5,6,7],[0,1,5,4],[3,7,6,2],[0,4,7,3],[1,2,6,5]];
let gpuShared;
function gpuInit(){
 const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:true});if(!gl)return null;
 const vs=`attribute vec3 position;attribute vec3 color;attribute vec2 local;attribute vec2 grain;attribute float face;varying vec3 c;varying vec2 p;varying vec2 g;varying float f;void main(){gl_Position=vec4(position,1.0);c=color;p=local;g=grain;f=face;}`;
 const fs=`precision mediump float;varying vec3 c;varying vec2 p;varying vec2 g;varying float f;uniform vec3 hole0;uniform vec3 hole1;uniform float wooden;void main(){if(f<1.5){if(hole0.z>0.0&&distance(p,hole0.xy)<hole0.z)discard;if(hole1.z>0.0&&distance(p,hole1.xy)<hole1.z)discard;}float grainShade=wooden*(sin(g.y*1.8+sin(g.x*.035)*.6)*.019+sin(g.y*.17+g.x*.003)*.012);gl_FragColor=vec4(c+grainShade,1.0);}`;
 const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('3D shader compilation failed');return s;};
 const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;
 const buffer=gl.createBuffer();gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 const locations={};let offset=0;for(const[name,size]of[['position',3],['color',3],['local',2],['grain',2],['face',1]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,44,offset*4);offset+=size;}
 for(const name of['hole0','hole1','wooden'])locations[name]=gl.getUniformLocation(program,name);
 return {canvas,gl,program,buffer,locations};
}
export function drawGpu(viewer,visibleParts){
 if(gpuShared===undefined){try{gpuShared=gpuInit();}catch{gpuShared=null;}}if(!gpuShared)return false;
 const{canvas,gl,program,buffer,locations}=gpuShared;const width=viewer.canvas.width,height=viewer.canvas.height;if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
 gl.viewport(0,0,width,height);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 const extent=Math.max(...viewer.model.overall,200),colors=['#b18d59','#dbb882','#c09a65','#eed2a0','#c7a16e','#dfbd87'];
 const color=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
 for(const part of visibleParts){
  const [a,b,d]=part.size.map(n=>n/2),center=part.center.map((n,i)=>n+part.explode[i]*viewer.explode),r=part.rotationZ||0;
  const local=[[-a,-b,-d],[a,-b,-d],[a,b,-d],[-a,b,-d],[-a,-b,d],[a,-b,d],[a,b,d],[-a,b,d]];
  const points=local.map(v=>viewer.project(rotatePoint(v,part).map((n,i)=>n+center[i])));
  const vertices=[];
  for(let face=0;face<6;face++){const ids=gpuFaceIndices[face],col=color(part.id===viewer.selected?'#bf6742':part.color||colors[face]);for(const j of[0,1,2,0,2,3]){const id=ids[j],p=points[id],l=local[id],grain=face<2?[l[0],l[1]]:face<4?[l[0],l[2]]:[l[2],l[1]];vertices.push(p[0]/viewer.w*2-1,1-p[1]/viewer.h*2,-p[2]/(extent*5),...col,l[0],l[1],...grain,face);}}
  // Dark cylindrical inner surfaces keep drilled openings legible from oblique views.
  for(const hole of part.holes||[]){for(let k=0;k<28;k++){const q0=k/28*Math.PI*2,q1=(k+1)/28*Math.PI*2;const ring=[[hole.x+Math.cos(q0)*hole.r,hole.y+Math.sin(q0)*hole.r,-d],[hole.x+Math.cos(q1)*hole.r,hole.y+Math.sin(q1)*hole.r,-d],[hole.x+Math.cos(q1)*hole.r,hole.y+Math.sin(q1)*hole.r,d],[hole.x+Math.cos(q0)*hole.r,hole.y+Math.sin(q0)*hole.r,d]];for(const i of[0,1,2,0,2,3]){const l=ring[i],p=viewer.project(rotatePoint(l,part).map((n,i)=>n+center[i]));vertices.push(p[0]/viewer.w*2-1,1-p[1]/viewer.h*2,-p[2]/(extent*5),.34,.27,.15,l[0],l[1],l[0],l[1],7);}}}
  for(let i=0;i<2;i++){const h=part.holes?.[i];gl.uniform3f(locations['hole'+i],h?.x||0,h?.y||0,h?.r||0);}gl.uniform1f(locations.wooden,part.cut?1:0);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,vertices.length/11);
 }
 viewer.ctx.drawImage(canvas,0,0,viewer.w,viewer.h);return true;
}
