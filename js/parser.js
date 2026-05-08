function splitCSVLine(line,sep){const r=[];let c='',i=false;for(let ch of line){if(ch=='"')i=!i;else if(ch===sep&&!i){r.push(c);c='';}else c+=ch;}r.push(c);return r;}
function parseCSV(text){const l=text.split(/\r?\n/).filter(x=>x.trim());const s=l[0].includes(';')?';':',';const h=l[0].split(s).map(x=>x.replace(/"/g,'').toLowerCase().trim());return l.slice(1).map(line=>{const v=splitCSVLine(line,s);let o={};h.forEach((k,i)=>o[k]=(v[i]||'').replace(/"/g,'').trim());return o;});}
function parseFecha(f){
    if(!f) return null;
  
    // 👉 FORMATO API (YYYY-MM-DD)
    if (typeof f === "string" && f.includes("-")) {
      const date = new Date(f);
      return isNaN(date) ? null : date;
    }
  
    // 👉 FORMATO CSV (DD/MM/YYYY o DD.MM.YYYY)
    const m = f.match(/(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})/);
    if(m){
      const date = new Date(`${m[3]}-${m[2]}-${m[1]}`);
      return isNaN(date) ? null : date;
    }
  
    return null;
  }