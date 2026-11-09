import {mkdir,rm,copyFile,cp,writeFile,readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const environment=process.env.DEPLOY_ENV||'development';
if(!['development','test','production'].includes(environment))throw new Error('Unknown deployment environment');
const sha=process.env.SOURCE_SHA||'local';
const dist=path.join(root,'dist');await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
for(const file of['index.html','mark.svg'])await copyFile(path.join(root,file),path.join(dist,file));
await cp(path.join(root,'src'),path.join(dist,'src'),{recursive:true,filter:p=>!p.endsWith('.test.js')});
await cp(path.join(root,'vendor'),path.join(dist,'vendor'),{recursive:true});
const config={environment,version:'0.6.0',sourceSha:sha};
// A release must never combine new HTML with cached modules from an older plan version.
const stamp=encodeURIComponent(config.version+'-'+sha.slice(0,12));
let html=await readFile(path.join(dist,'index.html'),'utf8');
html=html.replace(/((?:src|href)="\.\/[^\"]+\.(?:js|css|svg))"/g,(_,ref)=>ref+'?v='+stamp+'"');
for(const file of await readdir(path.join(dist,'src'))){
 if(!file.endsWith('.js'))continue;
 const filename=path.join(dist,'src',file);
 const module=await readFile(filename,'utf8');
 await writeFile(filename,module.replace(/(from\s+['"])(\.\/[^'"]+\.js)(['"])/g,(_,prefix,ref,suffix)=>prefix+ref+'?v='+stamp+suffix));
}
await writeFile(path.join(dist,'index.html'),html);
await writeFile(path.join(dist,'config.js'),`window.WERKSTUECK_CONFIG = ${JSON.stringify(config)};\n`);
await writeFile(path.join(dist,'build.json'),JSON.stringify(config,null,2));
await writeFile(path.join(dist,'.nojekyll'),'');
if(environment!=='production'){
 await writeFile(path.join(dist,'robots.txt'),'User-agent: *\nDisallow: /\n');
 await writeFile(path.join(dist,'index.html'),html.replace('<meta charset="UTF-8">','<meta name="robots" content="noindex, nofollow"><meta charset="UTF-8">'));
}
console.log(`Built ${environment} / ${sha} → dist`);
