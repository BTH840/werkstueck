// Millimetres, right-handed coordinates. Camera basis is orthonormal: no shear.
export const CAMERA_VIEWS={front:[0,0],top:[0,Math.PI/2],right:[-Math.PI/2,0],iso:[-Math.PI/4,Math.atan(1/Math.sqrt(2))]};
export function cameraPoint([x,y,z],yaw,pitch){const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),u=x*cy+z*sy,v=-x*sy+z*cy;return [u,-y*cp+v*sp,y*sp+v*cp];}
export function rotatePoint([x,y,z],part){const a=part.rotationX||0,b=part.rotationY||0,c=part.rotationZ||0,yy=y*Math.cos(a)-z*Math.sin(a),zz=y*Math.sin(a)+z*Math.cos(a),xx=x*Math.cos(b)+zz*Math.sin(b),zzz=-x*Math.sin(b)+zz*Math.cos(b);return [xx*Math.cos(c)-yy*Math.sin(c),xx*Math.sin(c)+yy*Math.cos(c),zzz];}
export function boardCorners(part){const [a,b,c]=part.size.map(v=>v/2);return [[-a,-b,-c],[a,-b,-c],[a,b,-c],[-a,b,-c],[-a,-b,c],[a,-b,c],[a,b,c],[-a,b,c]].map(v=>rotatePoint(v,part).map((n,i)=>n+part.center[i]));}
export function partBounds(parts){const ps=parts.flatMap(boardCorners);return [0,1,2].map(i=>[Math.min(...ps.map(p=>p[i])),Math.max(...ps.map(p=>p[i]))]);}
