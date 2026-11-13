/** Restore local media references after a WordPress re-import. No network access. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'archive-media-manifest.json'),'utf8'));
// Validate every destination before changing any content.
for(const item of Object.values(manifest)){
 const filename=path.join(root,'public',item.local);
 if(!fs.existsSync(filename))throw new Error(`Missing local media: ${item.local}`);
 const bytes=fs.readFileSync(filename);
 if(crypto.createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw new Error(`Incorrect media bytes: ${item.local}`);
}
const directory=path.join(root,'src/entries/mondaymotivator');let count=0;
const remote=new Set();
for(const filename of fs.readdirSync(directory).filter(f=>f.endsWith('.json'))){
 const full=path.join(directory,filename),post=JSON.parse(fs.readFileSync(full,'utf8'));const $=cheerio.load(post.html,null,false);let changed=false;
 $('img').each((_,image)=>{
  const e=$(image),src=e.attr('src')||'',asset=manifest[src];
  if(asset){e.attr('src',asset.local).attr('width',String(asset.width)).attr('height',String(asset.height)).attr('decoding','async');changed=true;count++;}
  const srcset=e.attr('srcset');if(srcset){const next=srcset.split(',').map(s=>s.trim().split(/\s+/)).map(([url,...descriptor])=>[manifest[url]?.local||url,...descriptor].join(' ')).join(', ');if(next!==srcset){e.attr('srcset',next);changed=true;}}
 });
 $('a[href]').each((_,anchor)=>{const e=$(anchor),asset=manifest[e.attr('href')||''];if(asset){e.attr('href',asset.local);changed=true;}});
 if(changed){post.html=$.html();fs.writeFileSync(full,JSON.stringify(post,null,2)+'\n');}
 $('img').each((_,image)=>{const e=$(image);for(const url of [e.attr('src')||'',...(e.attr('srcset')||'').split(',').map(s=>s.trim().split(/\s+/)[0])])if(/^https?:/.test(url))remote.add(url);});
}
fs.writeFileSync(path.join(root,'media-urls.txt'),[...remote].sort().join('\n')+(remote.size?'\n':''));
console.log(`Localized ${count} image references. ${remote.size} remote media URLs remain.`);
