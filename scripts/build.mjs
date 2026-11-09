import {mkdir,rm,copyFile,cp,writeFile} from 'node:fs/promises';
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
const config={environment,version:'0.2.0',sourceSha:sha};
await writeFile(path.join(dist,'config.js'),`window.WERKSTUECK_CONFIG = ${JSON.stringify(config)};\n`);
await writeFile(path.join(dist,'build.json'),JSON.stringify(config,null,2));
await writeFile(path.join(dist,'.nojekyll'),'');
if(environment!=='production'){
 await writeFile(path.join(dist,'robots.txt'),'User-agent: *\nDisallow: /\n');
 const {readFile}=await import('node:fs/promises');const html=await readFile(path.join(dist,'index.html'),'utf8');
 await writeFile(path.join(dist,'index.html'),html.replace('<meta charset="UTF-8">','<meta name="robots" content="noindex, nofollow"><meta charset="UTF-8">'));
}
console.log(`Built ${environment} / ${sha} → dist`);
