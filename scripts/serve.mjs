import http from 'node:http';import {readFile,stat} from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const base=process.argv.includes('--dist')?path.join(root,'dist'):root;
const port=Number(process.env.PORT||4173);
const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.txt':'text/plain;charset=utf-8'};
const server=http.createServer(async(req,res)=>{try{let urlPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(urlPath.endsWith('/'))urlPath+='index.html';const file=path.resolve(base,'.'+urlPath);if(!file.startsWith(base+path.sep)||urlPath.split('/').some(p=>p.startsWith('.'))){res.writeHead(403);res.end();return;}if(!(await stat(file)).isFile())throw Error();const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);}catch{res.writeHead(404,{'Content-Type':'text/plain;charset=utf-8'});res.end('Nicht gefunden');}});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
