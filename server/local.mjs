import http from 'node:http';
import {spawn} from 'node:child_process';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {analyzePhotos} from './analysis.js';
const root=path.resolve(fileURLToPath(new URL('../dist/',import.meta.url))),port=Number(process.env.WERKSTUECK_PORT||4174),host='127.0.0.1',origin=`http://${host}:${port}`;
let key=process.env.OPENAI_API_KEY||'',busy=false,last=0;const model=process.env.OPENAI_MODEL||'gpt-4.1';
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json;charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
const body=async req=>{let size=0,blocks=[];for await(const chunk of req){size+=chunk.length;if(size>12000000){const e=Error('Die Bildauswahl ist zu groß.');e.status=413;throw e;}blocks.push(chunk);}return JSON.parse(Buffer.concat(blocks).toString());};
export const localServer=http.createServer(async(req,res)=>{
 try{
  if(req.headers.host!==`${host}:${port}`){json(res,403,{error:'Ungültiger Host.'});return;}
  const url=new URL(req.url,origin);
  if(url.pathname==='/api/status'&&req.method==='GET'){json(res,200,{local:true,configured:Boolean(key),model});return;}
  if(url.pathname.startsWith('/api/')){
   if(req.method!=='POST'||req.headers.origin!==origin||!String(req.headers['content-type']).startsWith('application/json')){json(res,403,{error:'Nur die lokale Werkstatt darf diese Aktion ausführen.'});return;}
   if(url.pathname==='/api/key'){const data=await body(req);if(typeof data.key!=='string'||!/^sk-[A-Za-z0-9_-]{15,250}$/.test(data.key)){json(res,400,{error:'Bitte einen gültigen OpenAI-API-Schlüssel eingeben.'});return;}key=data.key;json(res,200,{configured:true});return;}
   if(url.pathname==='/api/disconnect'){key='';json(res,200,{configured:false});return;}
   if(url.pathname==='/api/analyze'){
    if(!key){json(res,503,{error:'Die lokale Bildanalyse braucht noch deinen API-Schlüssel.'});return;}
    if(busy||Date.now()-last<5000){json(res,429,{error:'Eine Analyse läuft bereits. Bitte kurz warten.'});return;}
    const data=await body(req);busy=true;last=Date.now();try{const draft=await analyzePhotos(data,{key,model});json(res,200,{draft});}finally{busy=false;}return;
   }
   json(res,404,{error:'Unbekannte Aktion.'});return;
  }
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
  const relative=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname),file=path.resolve(root,'.'+relative);
  if(!file.startsWith(root+path.sep)||relative.split('/').some(s=>s.startsWith('.'))){res.writeHead(404);res.end();return;}
  if(!(await stat(file)).isFile())throw Error('Datei fehlt');
  const types={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(req.method==='HEAD'?'':await readFile(file));
 }catch(error){json(res,error.status||400,{error:error.name==='TimeoutError'?'Die Analyse hat zu lange gedauert. Bitte weniger Fotos verwenden.':error.message==='Datei fehlt'?'Datei nicht gefunden.':String(error.message).slice(0,200)});}
});
localServer.listen(port,host,()=>{if(process.env.WERKSTUECK_OPEN_BROWSER==='1')spawn('open',[origin+'/#fotowerkstatt'],{stdio:'ignore'});console.log(`Lokale Werkstatt: ${origin}/#fotowerkstatt\nFotos werden erst nach „Fotos analysieren“ an OpenAI gesendet. Schlüssel bleiben im Arbeitsspeicher. Mit Ctrl+C beenden.`);});
