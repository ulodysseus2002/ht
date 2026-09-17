/* ======================= DONNÉES & ÉTAT ======================= */
const FONTS = [
  {id:'avantgarde', label:'Avant Garde', css:"'Questrial', 'Century Gothic', sans-serif", w:400, sub:1},
  {id:'bebas', label:'Bebas Neue', css:"'Bebas Neue', Impact, sans-serif", w:400},
  {id:'oswald', label:'Oswald', css:"'Oswald', Impact, sans-serif", w:600},
  {id:'barca', label:'Barca', css:"'Saira Stencil One', Impact, sans-serif", w:400, sub:1},
  {id:'ethno', label:'Ethnocentric', css:"'Orbitron', 'Arial Black', sans-serif", w:800, sub:1},
  {id:'montserrat', label:'Montserrat', css:"'Montserrat', 'Arial Black', sans-serif", w:800},
  {id:'sixcaps', label:'Six Caps', css:"'Six Caps', Impact, sans-serif", w:400},
  {id:'tahoma', label:'Tahoma', css:"Tahoma, Verdana, sans-serif", w:700},
  {id:'fredoka', label:'Fredoka', css:"'Fredoka', 'Arial Rounded MT Bold', sans-serif", w:600},
  {id:'futura', label:'Futura', css:"'Jost', Futura, 'Century Gothic', sans-serif", w:600, sub:1},
];
const PALETTE = [['Blanc','#FFFFFF'],['Rouge','#E31B17'],['Noir','#0B0D0E'],['Jaune','#F5C400'],['Bleu','#2F6BFF'],['Vert','#13B981'],['Cyan','#12B5D6'],['Rose','#EC4899'],['Orange','#F26B1D'],['Or','#C9A24B']];
const STEPS = ['Choisissez la version','Choisissez votre police','Numéro & couleurs','Logo du club dans le numéro','Contour & épaisseur','Nom du joueur','Courbure du nom','Aperçu & contrôle','Export du fichier'];
const JERSEY_BG = {noir:'#101315', blanc:'#F1F1EF'};

const DEFAULT_STYLE = {
  version:'dos', font:'bebas', numberColor:'#FFFFFF', jerseyColor:'#E31B17', bgMode:'noir',
  outline:'aucun', outlineWidth:3, outlineColor:'#E31B17', outline2Width:3, outline2Color:'#FFFFFF',
  logoOn:true, logo:null, logoName:'', logoPreset:'crest', logoX:0, logoY:65, logoScale:100, logoRot:0,
  nameOn:true, nameFont:'montserrat', nameSize:55, nameColor:'#FFFFFF', nameOutline:false, nameSpacing:4, nameGap:10,
  curveMode:'haut', curve:55,
  numberHeight:25, chestHeight:10, dpi:300, format:'png', bgColor:'#FFFFFF',
  hidden:{logo:false,name:false,number:false,outline:false,jersey:false}, locked:{}
};
const today = () => new Date().toLocaleDateString('fr-FR');
let S = {
  step:0, view:'dos', zoom:1, grid:false, project:null,
  player:{name:'VOTRE NOM', number:'10'},
  style: structuredClone(DEFAULT_STYLE),
  team:{name:'Équipe A', players:[{name:'KALLA',number:'10'},{name:'AMINE',number:'7'},{name:'YANIS',number:'9'},{name:'SOFIANE',number:'11'},{name:'ADAM',number:'6'}]},
  creations:[
    {id:1, name:'KALLA', number:'10', team:'Équipe A', date:'12/09/2026', status:'Exporté', style:null},
    {id:2, name:'AMINE', number:'7', team:'Équipe A', date:'12/09/2026', status:'Brouillon', style:null},
    {id:3, name:'NOA', number:'23', team:'—', date:'08/09/2026', status:'Exporté', style:{font:'oswald',numberColor:'#F5C400',nameColor:'#F5C400',curveMode:'normal'}},
  ],
  files:[
    {name:'JERSEYDTF_10_KALLA.png', size:'2 953 × 3 780 px', date:'12/09/2026'},
    {name:'JERSEYDTF_EQUIPE_A_PLANCHE_01.png', size:'11 811 × 7 087 px', date:'12/09/2026'},
  ],
  sheet:{w:100, h:60, margin:1, spacing:1, copies:1, rotate:true, split:true, version:'dos', items:[]},
  sheetsCount:2, nextId:4
};
const STORE='jerseydtf-studio-v2';
try{
  const saved = JSON.parse(localStorage.getItem(STORE)||'null');
  if(saved && saved.style){ S = Object.assign(S, saved); S.style = Object.assign(structuredClone(DEFAULT_STYLE), saved.style); }
}catch(e){}
let saveTimer=null, lastSaved=new Date();
function persist(){
  const el=document.querySelector('.save-state'); if(el) el.textContent='Enregistrement…';
  clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>{
    try{ localStorage.setItem(STORE, JSON.stringify(S)); }catch(e){}
    lastSaved=new Date();
    const el=document.querySelector('.save-state'); if(el) el.textContent=saveLabel();
    updStatus();
  },600);
}
const saveLabel=()=>'✓ Sauvegardé '+lastSaved.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});

/* ======================= OUTILS ======================= */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fontById=id=>FONTS.find(f=>f.id===id)||FONTS[1];
const cvs=document.createElement('canvas').getContext('2d');
const mCache={};
function measure(text,font,size){
  const k=font.id+'|'+text; if(mCache[k]==null){ cvs.font=`${font.w} 100px ${font.css}`; mCache[k]=cvs.measureText(text).width; }
  return mCache[k]*size/100;
}
function darken(hex,a){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;r=Math.round(r*(1-a));g=Math.round(g*(1-a));b=Math.round(b*(1-a));return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}
function lum(hex){const n=parseInt(hex.slice(1),16);return (0.299*(n>>16)+0.587*(n>>8&255)+0.114*(n&255))/255}
const slug=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'');
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
function toast(msg,type='ok',action){
  const t=document.createElement('div'); t.className='toast '+type;
  t.innerHTML=`<i>${type==='ok'?'✓':'!'}</i><span>${msg}</span>`;
  if(action){const b=document.createElement('button');b.textContent=action.label;b.onclick=()=>{action.fn();t.remove()};t.appendChild(b)}
  $('#toasts').appendChild(t); setTimeout(()=>t.remove(),4200);
}

/* ======================= MOTEUR GRAPHIQUE ======================= */
const U=100, CAP=0.72;
function crest(x,y,s,rot){
  return `<g transform="translate(${x+s/2} ${y+s/2}) rotate(${rot}) translate(${-s/2} ${-s/2}) scale(${s/100})">
   <path d="M50 3 L93 17 V47 C93 74 73 90 50 98 C27 90 7 74 7 47 V17 Z" fill="#E31B17"/>
   <path d="M50 14 L83 25 V47 C83 67 68 80 50 86 C32 80 17 67 17 47 V25 Z" fill="#0B0D0E"/>
   <circle cx="50" cy="50" r="19" fill="none" stroke="#E31B17" stroke-width="6"/>
   <text x="50" y="57" text-anchor="middle" font-family="Montserrat,Arial Black,sans-serif" font-weight="900" font-size="19" fill="#fff">FC</text></g>`;
}
function star(x,y,s,rot){
  return `<g transform="translate(${x+s/2} ${y+s/2}) rotate(${rot}) translate(${-s/2} ${-s/2}) scale(${s/100})">
   <circle cx="50" cy="50" r="47" fill="#0B0D0E" stroke="#F5C400" stroke-width="6"/>
   <path d="M50 16l9.6 21.2 23.1 2.4-17.3 15.6 4.9 22.8L50 66.3 29.7 78l4.9-22.8L17.3 39.6l23.1-2.4z" fill="#F5C400"/></g>`;
}
function logoMarkup(st,x,y,s){
  if(st.logo) return `<g transform="translate(${x+s/2} ${y+s/2}) rotate(${st.logoRot})"><image href="${st.logo}" x="${-s/2}" y="${-s/2}" width="${s}" height="${s}" preserveAspectRatio="xMidYMid meet"/></g>`;
  return st.logoPreset==='star' ? star(x,y,s,st.logoRot) : crest(x,y,s,st.logoRot);
}
function strokeLayers(txt, attrs, fill, st, scale, useOutline){
  const style = useOutline ? st.outline : 'aucun';
  const w1 = st.outlineWidth*2.2*scale, w2 = (st.outline==='double'?st.outlineWidth:st.outline2Width)*2.2*scale;
  const base = `${attrs} stroke-linejoin="round" paint-order="stroke"`;
  if(style==='aucun' || st.hidden.outline) return `<text ${attrs} fill="${fill}">${txt}</text>`;
  if(style==='simple') return `<text ${base} fill="${fill}" stroke="${st.outlineColor}" stroke-width="${w1*2}">${txt}</text>`;
  return `<text ${base} fill="${st.outline2Color}" stroke="${st.outline2Color}" stroke-width="${(w1+w2)*2}">${txt}</text>
          <text ${base} fill="${fill}" stroke="${st.outlineColor}" stroke-width="${w1*2}">${txt}</text>`;
}
function outlineExtent(st, scale=1){
  if(st.outline==='aucun'||st.hidden.outline) return 0;
  const w1=st.outlineWidth*2.2*scale, w2=(st.outline==='double'?st.outlineWidth:st.outline2Width)*2.2*scale;
  return st.outline==='simple'?w1:w1+w2;
}
/* Rend une création dans un repère en unités (hauteur de capitale du numéro = 72u).
   Renvoie {w,h,svg,k,cx,numTop,numH,logoBox} ; k = cm par unité. */
function renderArt(player, st, parts={number:true,name:true,logo:true}, heightCm){
  const k = (heightCm||st.numberHeight) / (U*CAP);
  const nf=fontById(st.font), af=fontById(st.nameFont);
  const num=String(player.number||''), name=String(player.name||'').toUpperCase();
  const showNum = parts.number && num && !st.hidden.number;
  const showName = parts.name && st.nameOn && name && !st.hidden.name;
  const showLogo = parts.logo && st.logoOn && !st.hidden.logo;
  const ext = outlineExtent(st);
  const pad = ext + 1.5;
  const numW = showNum ? measure(num,nf,U) : 0;
  const nS = 0.3*U*st.nameSize/100;
  const ls = st.nameSpacing*nS/40;
  const nameW = showName ? measure(name,af,nS) + ls*Math.max(0,name.length-1) : 0;
  const intensity = st.curveMode==='normal'?0:st.curve/100;
  const sag = nameW*0.16*intensity*(st.curveMode==='bas'?-1:1);
  const nExt = st.nameOutline ? outlineExtent(st,.55) : 0;
  const logoS = showLogo ? 0.4*U*st.logoScale/100 : 0;
  const lxu = showNum ? st.logoX/k : 0;
  const gap = 0.06*U;
  const w = Math.max(numW, nameW + 2*nExt, logoS + 2*Math.abs(lxu)) + 2*pad;
  const cx = w/2;
  let y = pad, svg='', numTop=null, logoBox=null;
  if(showName){
    const top = y + Math.max(0,sag) + nExt;
    const base = top + nS*CAP;
    const fam = `font-family="${af.css.replace(/"/g,"'")}" font-weight="${af.w}" font-size="${nS}" letter-spacing="${ls}"`;
    if(Math.abs(sag)<0.5){
      svg += strokeLayers(esc(name), `x="${cx}" y="${base}" text-anchor="middle" ${fam}`, st.nameColor, st, .55, st.nameOutline);
    }else{
      const L = nameW*1.25, id='c'+Math.random().toString(36).slice(2,8);
      svg += `<defs><path id="${id}" d="M${cx-L/2} ${base} Q${cx} ${base-2*sag} ${cx+L/2} ${base}"/></defs>`;
      svg += strokeLayers(`<textPath href="#${id}" startOffset="50%">${esc(name)}</textPath>`, `text-anchor="middle" ${fam}`, st.nameColor, st, .55, st.nameOutline);
    }
    y = base + Math.max(0,-sag) + nExt + (showNum ? gap + st.nameGap*0.6 : (showLogo ? gap : 0));
  }
  let bottom = y;
  if(showNum){
    numTop = y + ext;
    const base = numTop + U*CAP;
    svg += strokeLayers(esc(num), `x="${cx}" y="${base}" text-anchor="middle" font-family="${nf.css.replace(/"/g,"'")}" font-weight="${nf.w}" font-size="${U}"`, st.numberColor, st, 1, true);
    bottom = base + ext;
  }
  let shift = 0;
  if(showLogo){
    let lx, ly;
    if(showNum){ const cyL = numTop + st.logoY/100*U*CAP; lx = cx + lxu - logoS/2; ly = cyL - logoS/2; }
    else { lx = cx - logoS/2; ly = bottom; }
    logoBox = {x:lx, y:ly, s:logoS};
    svg += `<g class="logo-hit">${logoMarkup(st,lx,ly,logoS)}</g>`;
    bottom = Math.max(bottom, ly + logoS);
    if(ly < pad) shift = pad - ly;
  }
  let h = Math.max(bottom + pad, 10) + shift;
  if(shift){ svg = `<g transform="translate(0 ${shift})">${svg}</g>`; if(numTop!=null) numTop+=shift; if(logoBox) logoBox.y+=shift; }
  return {w, h, svg, k, cx, numTop, numH:U*CAP, numW, logoBox};
}
function artSVG(player, st, parts, cls='', bg=''){
  const a=renderArt(player,st,parts);
  return `<svg class="${cls}" viewBox="0 0 ${a.w.toFixed(1)} ${a.h.toFixed(1)}" xmlns="http://www.w3.org/2000/svg">${bg?`<rect width="100%" height="100%" fill="${bg}"/>`:''}${a.svg}</svg>`;
}
/* Maillot illustré (site vitrine, aperçus d'équipe) */
function jerseySVG(player, st, view='dos', opts={}){
  const col = opts.color || st.jerseyColor, trim = lum(col)>0.6 ? darken(col,.16) : (lum(col)<0.12?'#262B2F':darken(col,.28));
  const PXCM = 4.05, isBack = view==='dos';
  const parts = isBack ? {number:true,name:true,logo:true} : {number:true,name:false,logo:false};
  const a = renderArt(player, st, parts, isBack?st.numberHeight:st.chestHeight);
  let s = Math.min(a.k*PXCM, (isBack?185:120)/a.w, (isBack?300:120)/a.h);
  const ax = 200 - a.cx*s, ay = isBack ? 64 : 150;
  return `<svg viewBox="0 0 400 440" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Maillot ${esc(player.name)} ${esc(player.number)}">
    <path d="M122 22 L160 8 Q200 ${isBack?30:44} 240 8 L278 22 L382 74 L352 156 L306 136 L306 424 Q200 436 94 424 L94 136 L48 156 L18 74 Z" fill="${col}"/>
    <path d="M18 74 L48 156 L94 136 L94 118 L60 132 L34 70 Z M382 74 L352 156 L306 136 L306 118 L340 132 L366 70 Z" fill="${trim}" opacity=".6"/>
    ${isBack?`<path d="M160 8 Q200 30 240 8 L232 4 Q200 20 168 4 Z" fill="${trim}"/>`:`<path d="M160 8 L200 58 L240 8 L230 6 L200 44 L170 6 Z" fill="${trim}"/>`}
    <path d="M94 424 Q200 436 306 424" stroke="${trim}" stroke-width="5" fill="none"/>
    <g transform="translate(${ax} ${ay}) scale(${s})">${a.svg}</g></svg>`;
}
/* ======================= SITE VITRINE ======================= */
const DEMO_SEQ=[{name:'KALLA',number:'10',col:'#E31B17'},{name:'AMINE',number:'7',col:'#0B0D0E'},{name:'YANIS',number:'9',col:'#2F6BFF'},{name:'SOFIANE',number:'11',col:'#F5C400'}];
let demoIdx=0, demoTimer=null, demoCol='#E31B17', demoPlayer={name:'KALLA',number:'10'};
function heroStyle(){
  const light=lum(demoCol)>0.6;
  return {...S.style, hidden:DEFAULT_STYLE.hidden, logo:null, logoPreset:'crest', outline:'simple', outlineWidth:2.5,
    outlineColor: light?'#0B0D0E':(demoCol==='#0B0D0E'?'#E31B17':'#0B0D0E'), numberColor: light?'#0B0D0E':'#FFFFFF', nameColor: light?'#0B0D0E':'#FFFFFF',
    nameOutline:false, nameSize:75, numberHeight:25, logoY:72, logoScale:90, logoX:0};
}
function renderHero(fade){
  const el=$('#heroJersey');
  const draw=()=>{ el.innerHTML=jerseySVG(demoPlayer, heroStyle(), 'dos', {color:demoCol}); el.classList.remove('fade'); };
  if(fade){ el.classList.add('fade'); setTimeout(draw,300); } else draw();
  $$('#hSw .sw').forEach(b=>b.setAttribute('aria-pressed',b.dataset.c===demoCol));
}
function startDemo(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  stopDemo();
  demoTimer=setInterval(()=>{ demoIdx=(demoIdx+1)%DEMO_SEQ.length; const d=DEMO_SEQ[demoIdx];
    demoPlayer={name:d.name,number:d.number}; demoCol=d.col; $('#hName').value=d.name; $('#hNum').value=d.number; renderHero(true); },2800);
  $('#demoLive').textContent='● LIVE';
}
function stopDemo(){ clearInterval(demoTimer); demoTimer=null; const l=$('#demoLive'); if(l) l.textContent='● ÉDITION'; }
function initHome(){
  const sw=$('#hSw');
  PALETTE.slice(0,8).forEach(([n,h])=>{
    const b=document.createElement('button'); b.className='sw'; b.style.background=h; b.dataset.c=h; b.title=n; b.setAttribute('aria-label','Maillot '+n);
    b.onclick=()=>{ stopDemo(); demoCol=h; renderHero(); };
    sw.appendChild(b);
  });
  $('#hName').value=demoPlayer.name; $('#hNum').value=demoPlayer.number;
  $('#hName').addEventListener('input',e=>{stopDemo(); e.target.value=e.target.value.toUpperCase(); demoPlayer.name=e.target.value; renderHero();});
  $('#hNum').addEventListener('input',e=>{stopDemo(); e.target.value=e.target.value.replace(/\D/g,'').slice(0,3); demoPlayer.number=e.target.value; renderHero();});
  $('.demo').addEventListener('focusin',stopDemo);

  const tk=['Numéros dos & poitrine','Noms courbés','Logo intégré au numéro','Import CSV / XLSX','Planches 100 × 60 cm','Export PNG · SVG · JPG','300 DPI','Clubs · Imprimeurs · Revendeurs'];
  $('#ticker').innerHTML=[...tk,...tk].map(t=>`<span>${t}</span>`).join('');

  const I = {
    ind:'<svg class="sol-ico" viewBox="0 0 44 44"><path d="M13 6l5-2c2 3 6 3 8 0l5 2 9 5-3 8-5-2v23H12V17l-5 2-3-8z" fill="none" stroke="#E31B17" stroke-width="2.2" stroke-linejoin="round"/><text x="22" y="32" text-anchor="middle" font-family="Montserrat,Arial Black" font-weight="900" font-size="12" fill="currentColor">10</text></svg>',
    team:'<svg class="sol-ico" viewBox="0 0 44 44"><g fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="15" cy="15" r="6"/><circle cx="30" cy="15" r="6" stroke="#E31B17"/><path d="M4 38c1-8 6-12 11-12s10 4 11 12M20 38c1-8 5-12 10-12s9 4 10 12"/></g></svg>',
    id:'<svg class="sol-ico" viewBox="0 0 44 44"><path d="M22 4l16 5v12c0 10-7 16-16 19C13 37 6 31 6 21V9z" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M22 10l10 3v8c0 7-4 11-10 13z" fill="#E31B17"/></svg>',
    dtf:'<svg class="sol-ico" viewBox="0 0 44 44"><rect x="6" y="8" width="32" height="28" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M6 16h32" stroke="#E31B17" stroke-width="2.2"/><path d="M13 23h8M13 29h14" stroke="currentColor" stroke-width="2.2"/></svg>',
    opt:'<svg class="sol-ico" viewBox="0 0 44 44"><rect x="5" y="7" width="34" height="30" fill="none" stroke="currentColor" stroke-width="2.2"/><rect x="9" y="11" width="11" height="12" fill="#E31B17"/><rect x="22" y="11" width="13" height="8" fill="currentColor"/><rect x="22" y="21" width="8" height="12" fill="currentColor"/><rect x="9" y="25" width="11" height="8" fill="#E31B17"/></svg>',
    exp:'<svg class="sol-ico" viewBox="0 0 44 44"><path d="M22 6v20m-8-8l8 8 8-8" fill="none" stroke="#E31B17" stroke-width="2.2"/><path d="M8 28v8h28v-8" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>'
  };
  const sols=[['ind','Personnalisation individuelle','Numéros et noms sur mesure.'],['team','Équipes & clubs','Création de plusieurs joueurs.'],['id','Identité de club','Logo et couleurs.'],['dtf','Préparation DTF','Fichiers prêts pour production.'],['opt','Optimisation des planches','Placement automatique.'],['exp','Export professionnel','PNG / JPG / SVG.']];
  $('#solGrid').innerHTML = sols.map(([i,t,d])=>`<article>${I[i]}<h3>${t}</h3><p>${d}</p></article>`).join('');

  const works=[
    {c:'Clubs', t:'FC Les Baobabs', d:'Maillots domicile, 22 joueurs.', p:{name:'RAKOTO',number:'8'}, col:'#13B981', st:{font:'oswald',numberColor:'#FFFFFF',nameColor:'#FFFFFF',outline:'simple',outlineColor:'#0B0D0E'}},
    {c:'Équipes', t:'Basket Club Horizon', d:'Numéros dos et poitrine.', p:{name:'DIALLO',number:'23'}, col:'#0B0D0E', st:{font:'montserrat',outline:'simple',outlineColor:'#E31B17'}},
    {c:'Imprimeurs', t:'Atelier Presse & Film', d:'Planches 100 × 60 cm optimisées.', p:{name:'LEROY',number:'4'}, col:'#2F6BFF', st:{font:'ethno',outline:'simple',outlineColor:'#FFFFFF',numberColor:'#F5C400',nameColor:'#F5C400'}},
    {c:'Revendeurs', t:'Boutique Sport 10', d:'Commandes clients à l\'unité.', p:{name:'NOA',number:'99'}, col:'#F5C400', st:{font:'fredoka',outline:'simple',outlineColor:'#FFFFFF',numberColor:'#0B0D0E',nameColor:'#0B0D0E',curveMode:'bas'}},
  ];
  const cats=['Tous','Clubs','Équipes','Imprimeurs','Revendeurs']; let cur='Tous';
  const drawWorks=()=>{$('#worksGrid').innerHTML=works.filter(w=>cur==='Tous'||w.c===cur).map(w=>{
    const st={...DEFAULT_STYLE,...w.st, logoY:115, logoScale:80};
    return `<article class="work"><div class="img">${jerseySVG(w.p,st,'dos',{color:w.col})}</div>
      <div class="txt"><div class="cat">${w.c.toUpperCase()}</div><h3>${w.t}</h3><p>${w.d}</p></div></article>`}).join('')};
  $('#workFilters').innerHTML=cats.map(c=>`<button class="chip" aria-pressed="${c===cur}">${c}</button>`).join('');
  $$('#workFilters .chip').forEach(b=>b.onclick=()=>{cur=b.textContent;$$('#workFilters .chip').forEach(x=>x.setAttribute('aria-pressed',x===b));drawWorks()});
  drawWorks();

  $('#replayPack').onclick=()=>renderTechSheet(true);
  const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ renderTechSheet(true); io.disconnect(); } }),{threshold:.35});
  io.observe($('#techSheet'));
  window.addEventListener('scroll',()=>$('#siteHead').classList.toggle('scrolled',scrollY>10),{passive:true});
}
function renderTechSheet(animate){
  const keep=S.sheet, ks=S.style;
  S.style={...DEFAULT_STYLE, outline:'simple', outlineColor:'#E31B17', numberHeight:15, nameSize:70};
  S.sheet={w:100,h:60,margin:1,spacing:1,copies:1,rotate:true,split:true,version:'dos',items:[]};
  optimizeSheet(); $('#techSheet').innerHTML=sheetSVG({rulers:false, animate}); $('#techOcc').textContent=Math.round(sheetStats().occ)+' %';
  S.sheet=keep; S.style=ks;
}
/* ======================= STUDIO : CONFIGURATEUR TECHNIQUE ======================= */
const main=()=>$('#appMain');
const dis=k=>S.style.locked[k]?'disabled':'';
const lockNote=k=>S.style.locked[k]?`<p class="small" style="margin:0;color:var(--warn)">Calque verrouillé : déverrouillez-le dans le panneau Calques.</p>`:'';
function rgbText(h){const n=parseInt(h.slice(1),16);return `RGB ${n>>16}, ${n>>8&255}, ${n&255}`}

function slider(label,key,min,max,step,unit,lock,fmt){
  const v=S.style[key], p=(v-min)/(max-min)*100, id='sl_'+key;
  return `<div class="sl"><div class="sl-top"><label for="${id}">${label}</label><output id="o_${key}">${fmt?fmt(v):v+unit}</output></div>
    <input type="range" id="${id}" data-k="${key}" data-unit="${unit}" min="${min}" max="${max}" step="${step}" value="${v}" style="--p:${p}%" ${dis(lock)}></div>`;
}
function palette(label,key,lock){
  const v=S.style[key];
  return `<div class="field"><span class="label">${label}</span><div class="palette" data-pal="${key}">
    ${PALETTE.slice(0,8).map(([n,h])=>`<button class="sw" style="background:${h}" title="${n}" aria-label="${label} ${n}" aria-pressed="${v.toUpperCase()===h}" data-c="${h}" ${dis(lock)}></button>`).join('')}
    <span class="custom-col"><input type="color" value="${v}" data-ck="${key}" aria-label="${label} personnalisée" ${dis(lock)}><input class="hex" value="${v.toUpperCase()}" data-hk="${key}" maxlength="7" aria-label="${label} en HEX" title="${rgbText(v)}" ${dis(lock)}></span></div></div>`;
}
const segBtns=(key,opts,lock)=>`<div class="seg" role="group">${opts.map(([v,l])=>`<button data-seg="${key}" data-v="${v}" aria-pressed="${S.style[key]===v}" ${dis(lock)}>${l}</button>`).join('')}</div>`;
function bindCard(i,root,onSlide){
  $$('input[type=range][data-k]',root).forEach(r=>r.oninput=()=>{
    const k=r.dataset.k; S.style[k]=+r.value; r.style.setProperty('--p',(r.value-r.min)/(r.max-r.min)*100+'%');
    const o=$('#o_'+k); if(o) o.textContent = (SLFMT[k]?SLFMT[k](+r.value):r.value+r.dataset.unit);
    onSlide&&onSlide(k); upd(i);
  });
  $$('[data-pal]',root).forEach(p=>$$('.sw',p).forEach(b=>b.onclick=()=>{S.style[p.dataset.pal]=b.dataset.c; rc(i); upd(i);}));
  $$('input[data-ck]',root).forEach(c=>c.oninput=()=>{const k=c.dataset.ck; S.style[k]=c.value.toUpperCase(); $(`[data-hk="${k}"]`,root).value=c.value.toUpperCase(); $$(`[data-pal="${k}"] .sw`,root).forEach(s=>s.setAttribute('aria-pressed',s.dataset.c===c.value.toUpperCase())); upd(i);});
  $$('input[data-hk]',root).forEach(h=>h.oninput=()=>{const v=h.value.trim(), ok=/^#[0-9a-fA-F]{6}$/.test(v); h.style.borderColor=(!ok&&v.length>=7)?'var(--err)':''; if(ok){S.style[h.dataset.hk]=v.toUpperCase(); $(`[data-ck="${h.dataset.hk}"]`,root).value=v; upd(i);}});
  $$('[data-seg]',root).forEach(b=>b.onclick=()=>{S.style[b.dataset.seg]=b.dataset.v; rc(i); upd(i);});
}
const SLFMT={ logoX:v=>(v>0?'+':'')+(+v).toFixed(1)+' cm', logoScale:v=>v+' %', logoY:v=>v+' %', curve:v=>v+' %', nameSize:v=>v+' %', numberHeight:v=>v+' cm', chestHeight:v=>v+' cm', outlineWidth:v=>v+' px', outline2Width:v=>v+' px', logoRot:v=>v+'°' };

function computeChecks(){
  const st=S.style, isBack=st.version==='dos', hCm=isBack?st.numberHeight:st.chestHeight, out=[];
  const n=+S.player.number;
  out.push({ok:n>=1&&n<=999, t:n>=1&&n<=999?`Numéro ${n} valide (1 à 999)`:'Numéro invalide : saisissez une valeur de 1 à 999'});
  const a=renderArt(S.player,st,isBack?{number:true,name:true,logo:true}:{number:true,logo:true},hCm);
  const wcm=a.w*a.k, hcm=a.h*a.k, maxW=isBack?42:22, maxH=isBack?62:22;
  out.push({ok:wcm<=maxW&&hcm<=maxH, t:wcm<=maxW&&hcm<=maxH?`Flocage ${wcm.toFixed(1)} × ${hcm.toFixed(1)} cm dans la zone imprimable`:`Le flocage (${wcm.toFixed(1)} × ${hcm.toFixed(1)} cm) dépasse la zone imprimable ${isBack?'du dos':'de la poitrine'} : réduisez la hauteur`});
  const bg = st.bgMode==='blanc'?JERSEY_BG.blanc : st.bgMode==='club'?st.jerseyColor : st.bgMode==='noir'?JERSEY_BG.noir : null;
  if(bg){ const lowC=Math.abs(lum(st.numberColor)-lum(bg))<0.3 && (st.outline==='aucun'||Math.abs(lum(st.outlineColor)-lum(bg))<0.3);
    out.push({ok:!lowC, t:lowC?'Numéro peu lisible sur ce maillot : ajoutez un contour ou changez de couleur':'Contraste numéro / maillot suffisant'}); }
  if(st.logoOn && a.logoBox){ const over = Math.abs(st.logoX)*1 + a.logoBox.s*a.k/2 > a.numW*a.k/2 + 1;
    out.push({ok:!over, t:over?'Le logo déborde du numéro : réduisez l\'échelle ou recentrez-le':'Logo intégré dans la largeur du numéro'}); }
  if(st.logoWarn) out.push({ok:false,t:st.logoWarn});
  if(st.format!=='svg') out.push({ok:st.dpi>=300, t:st.dpi>=300?`Résolution ${st.dpi} DPI`:`Résolution ${st.dpi} DPI : 300 DPI minimum conseillés pour le DTF`});
  return out;
}
function updStatus(){
  const el=$('#status'); if(!el) return;
  const bad=computeChecks().filter(c=>!c.ok).length, st=S.style;
  el.classList.toggle('warn',!!bad);
  el.textContent = bad ? `${bad} point${bad>1?'s':''} à vérifier avant impression` : `Prêt pour impression DTF · ${st.format==='svg'?'SVG vectoriel':st.dpi+' DPI'}`;
  el.onclick = bad ? ()=>{ if(!location.hash.includes('creer')) location.hash='#/app/creer'; setTimeout(()=>setStep(7,true),60); } : null;
  $('#project').textContent = S.project ? `Projet · ${S.project}` : 'Mode projet · Vierge';
  $('#tabSheet').innerHTML = `Planche DTF<br>${S.sheet.w}×${S.sheet.h}`;
  $('#avatarBtn').textContent = (S.player.number||'10').slice(0,3);
}

function viewCreate(){
  main().innerHTML=`
  <div class="studio">
    <aside class="studio-left">
      <div class="studio-head"><span class="dot"></span><h1>Configurateur technique DTF</h1><span class="save-state">${saveLabel()}</span><span class="tag">9 étapes pro</span></div>
      <div class="cards" id="cards">${STEPS.map((t,i)=>`
        <section class="scard" id="card${i}" aria-labelledby="ct${i}">
          <div class="scard-h" data-card="${i}"><span class="nb">${i+1}</span><h2 id="ct${i}">${t}</h2><span class="meta" id="cm${i}"></span></div>
          <div class="scard-b" id="cb${i}"></div></section>`).join('')}
      </div>
      <div class="mob-nav"><button class="btn btn-ghost" id="mPrev">Précédent</button><span class="small muted" id="mLbl"></span><button class="btn btn-red" id="mNext">Suivant</button></div>
    </aside>
    <section class="studio-right" aria-label="Aperçu technique">
      <div class="toolbar">
        <div class="seg" role="group" aria-label="Support d'aperçu">
          <button data-bg="noir">Maillot noir</button><button data-bg="blanc">Maillot blanc</button><button data-bg="club">Club</button><button data-bg="damier">Damier DTF</button>
        </div>
        <button class="tb-btn" id="gridBtn" aria-pressed="false"><svg width="15" height="15"><use href="#i-grid"/></svg>Grille</button>
        <div class="seg" role="group" aria-label="Face"><button data-view="dos">Dos</button><button data-view="poitrine">Poitrine</button></div>
        <div class="tb-title"><b id="tbTitle"></b><small id="tbSub"></small></div>
        <div class="zoom"><button id="zOut" aria-label="Zoom arrière">−</button><output id="zVal">100%</output><button id="zIn" aria-label="Zoom avant">+</button></div>
      </div>
      <div class="canvas" id="canvas">
        <div class="ruler-corner"></div>
        <div class="ruler ruler-top" id="rTop"></div>
        <div class="ruler ruler-left" id="rLeft"></div>
        <div class="viewport" id="viewport">
          <svg id="stage" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Aperçu technique du flocage"></svg>
          <details class="layers-float" open><summary>Calques</summary><div id="layers"></div></details>
          <div class="hint-float">Glissez le logo · double-clic : 100 %</div>
        </div>
      </div>
    </section>
  </div>`;
  STEPS.forEach((_,i)=>rc(i));
  $$('[data-card]').forEach(h=>h.onclick=()=>setStep(+h.dataset.card,false));
  $$('.scard').forEach((c,i)=>c.addEventListener('focusin',()=>setStep(i,false)));
  $('#mPrev').onclick=()=>setStep(Math.max(0,S.step-1),true);
  $('#mNext').onclick=()=>{ if(S.step===8) doExport(); else setStep(S.step+1,true); };
  $$('[data-bg]').forEach(b=>b.onclick=()=>{S.style.bgMode=b.dataset.bg; drawStage(); updStatus(); rc(7); persist();});
  $$('[data-view]').forEach(b=>b.onclick=()=>{S.view=b.dataset.view; drawStage();});
  $('#gridBtn').onclick=()=>{S.grid=!S.grid; drawStage();};
  const Z=[.5,.75,1,1.5,2,3,4];
  $('#zIn').onclick=()=>{S.zoom=Z.find(z=>z>S.zoom+1e-6)||4; drawStage();};
  $('#zOut').onclick=()=>{S.zoom=[...Z].reverse().find(z=>z<S.zoom-1e-6)||.5; drawStage();};
  const vp=$('#viewport');
  vp.addEventListener('dblclick',e=>{ if(!e.target.closest('.logo-hit')){S.zoom=1; drawStage();} });
  vp.addEventListener('wheel',e=>{ if(!e.ctrlKey&&!e.metaKey) return; e.preventDefault(); S.zoom=clamp(S.zoom*(e.deltaY<0?1.12:1/1.12),.5,4); drawStage(); },{passive:false});
  new ResizeObserver(()=>drawStage()).observe(vp);
  bindStageDrag();
  setStep(S.step||0,false);
  if(innerWidth>900){
    const io=new IntersectionObserver(es=>{ const vis=es.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top); if(vis[0]&&!scrollLock) setStep(+vis[0].target.id.slice(4),false,true); },{root:$('#cards'),rootMargin:'0px 0px -65% 0px'});
    $$('.scard').forEach(c=>io.observe(c));
  }
  drawStage(); renderLayers();
}
let scrollLock=false;
function setStep(i,scroll,fromObserver){
  S.step=i;
  $$('.scard').forEach((c,j)=>c.classList.toggle('active',j===i));
  const lbl=$('#mLbl'); if(lbl) lbl.textContent=`Étape ${i+1} / 9`;
  const nx=$('#mNext'); if(nx) nx.textContent=i===8?'Exporter':'Suivant';
  const pv=$('#mPrev'); if(pv) pv.disabled=i===0;
  if(scroll && innerWidth>900){ scrollLock=true; $('#card'+i).scrollIntoView({behavior:'smooth',block:'start'}); setTimeout(()=>scrollLock=false,700); }
  if(scroll && innerWidth<=900){ window.scrollTo({top:0,behavior:'smooth'}); }
  if(!fromObserver) persist();
}
function rc(i){ const el=$('#cb'+i); if(!el) return; CARD[i](el); bindCard(i,el,CARD_SLIDE[i]); meta(i); }
function meta(i){
  const el=$('#cm'+i); if(!el) return; const st=S.style; let t='',c='';
  switch(i){
    case 0: t='Emplacement maillot'; break;
    case 1: t='10 styles pro'; c='red'; break;
    case 2: t='Couleurs illimitées'; break;
    case 3: { const centered=Math.abs(st.logoX)<0.05; t=!st.logoOn?'Sans logo':centered?'● Centrage auto':`Décalé ${st.logoX>0?'+':''}${st.logoX.toFixed(1)} cm`; c=st.logoOn&&centered?'ok':''; break; }
    case 4: t=st.outline==='aucun'?'Sans contour':`${{simple:'Simple',double:'Double',perso:'Personnalisé'}[st.outline]} · ${st.outlineWidth} px`; break;
    case 5: t=st.nameOn?`${S.player.name.length} / 30 caractères`:'Sans nom'; break;
    case 6: t=st.curveMode==='normal'?'Ligne droite':`${st.curve} %`; break;
    case 7: { const b=computeChecks().filter(x=>!x.ok).length; t=b?`${b} point${b>1?'s':''} à vérifier`:'● Conforme'; c=b?'red':'ok'; break; }
    case 8: t=st.format==='svg'?'SVG · vectoriel':`${st.format.toUpperCase()} · ${st.dpi} DPI`; break;
  }
  el.textContent=t; el.className='meta '+c;
}
function upd(from){
  drawStage();
  for(let i=0;i<9;i++) meta(i);
  if(from!==7) rc(7);
  if(from!==8) rc(8);
  persist(); updStatus();
}
const CARD_SLIDE=[];

const CARD=[
  /* 1 — Version */ (el)=>{ const st=S.style;
    el.innerHTML=`<div class="vcards">
      <button class="vcard" data-ver="dos" aria-pressed="${st.version==='dos'}"><span class="ic">DOS</span><span><b>Dos</b><small>${st.numberHeight} cm de haut</small></span></button>
      <button class="vcard" data-ver="poitrine" aria-pressed="${st.version==='poitrine'}"><span class="ic">AV</span><span><b>Poitrine</b><small>${st.chestHeight} cm de haut</small></span></button></div>
      <div class="hr"></div>
      <div class="inline-row" style="justify-content:space-between"><span class="label">Extensions (bientôt) :</span>
        <span class="inline-row" style="gap:8px"><span class="xchip" title="Prévu dans une prochaine version">Short (8 cm)</span><span class="xchip" title="Prévu dans une prochaine version">Manche (6 cm)</span><span class="xchip" title="Prévu dans une prochaine version">Pantalon</span></span></div>`;
    $$('[data-ver]',el).forEach(b=>b.onclick=()=>{st.version=b.dataset.ver; S.view=b.dataset.ver; rc(0); upd(0);});
  },
  /* 2 — Police */ (el)=>{ const st=S.style;
    el.innerHTML=`${lockNote('number')}<div class="fontgrid" role="listbox" aria-label="Catalogue de polices">${FONTS.map((f,i)=>`
      <button class="frow" role="option" aria-selected="${st.font===f.id}" aria-pressed="${st.font===f.id}" data-f="${f.id}" ${dis('number')}>
        <span class="nm">${String(i+1).padStart(2,'0')}. ${f.label}${f.sub?'<sup>*</sup>':''}</span>
        <span class="smp" style="font-family:${f.css};font-weight:${f.w}">${esc(S.player.number||'10')}</span></button>`).join('')}</div>
      <p class="small muted" style="margin:0">* Aperçu avec une police libre équivalente. Les fichiers définitifs (TTF, OTF, WOFF, WOFF2) sont gérés dans l'administration.</p>`;
    $$('[data-f]',el).forEach(b=>b.onclick=()=>{st.font=b.dataset.f; rc(1); upd(1);});
  },
  /* 3 — Numéro & couleurs */ (el)=>{
    el.innerHTML=`${lockNote('number')}
      <div class="inline-row"><label class="label" for="fNum">Chiffre(s) :</label><input class="bignum" id="fNum" value="${esc(S.player.number)}" maxlength="3" inputmode="numeric" ${dis('number')}><span class="small muted">1 à 999 supporté</span></div>
      ${palette('Couleur principale :','numberColor','number')}`;
    $('#fNum').oninput=e=>{ e.target.value=e.target.value.replace(/\D/g,'').slice(0,3); S.player.number=e.target.value;
      e.target.style.borderColor=+e.target.value>=1?'':'var(--err)'; $$('.frow .smp').forEach(s=>s.textContent=e.target.value||'10'); upd(2); };
  },
  /* 4 — Logo */ (el)=>{ const st=S.style, L='logo';
    el.innerHTML=`${lockNote('logo')}
      <label class="drop" id="logoDrop"><input type="file" id="logoFile" accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml" hidden ${dis(L)}>
        <svg><use href="#i-up"/></svg><b>${st.logo?'Remplacer le blason / logo':'Téléverser votre blason / logo'}</b><span>PNG transparent, JPG ou SVG vectoriel · 10 Mo max</span></label>
      <div id="logoInfo">${st.logo?`<div class="inline-row"><div class="thumb" style="background:var(--surface2)"><img src="${st.logo}" alt="" style="max-width:44px;max-height:44px"></div><div><b class="small">${esc(st.logoName||'logo')}</b>${st.logoWarn?`<br><span class="small" style="color:var(--warn)">${esc(st.logoWarn)}</span>`:''}</div></div>`:''}</div>
      <div class="inline-row" style="justify-content:space-between"><span class="label">Blasons prédéfinis :</span>
        <span class="seg" role="group"><button data-preset="crest" aria-pressed="${st.logoOn&&!st.logo&&st.logoPreset==='crest'}" ${dis(L)}>Écusson club</button><button data-preset="star" aria-pressed="${st.logoOn&&!st.logo&&st.logoPreset==='star'}" ${dis(L)}>Étoile</button><button data-preset="none" aria-pressed="${!st.logoOn}" ${dis(L)} style="${st.logoOn?'color:var(--err)':''}">Retirer</button></span></div>
      <div class="grid2">${slider('Échelle logo :','logoScale',40,200,5,' %',L,SLFMT.logoScale)}${slider('Position Y (bas) :','logoY',0,130,1,' %',L,SLFMT.logoY)}</div>
      <div class="grid2">${slider('Position X :','logoX',-12,12,.1,' cm',L,SLFMT.logoX)}${slider('Rotation :','logoRot',-180,180,5,'°',L,SLFMT.logoRot)}</div>
      <div class="inline-row" style="justify-content:space-between"><span class="small muted">Astuce : glissez le logo directement sur l'aperçu.</span><button class="link small" id="recenter" ${dis(L)}>Recentrer sur l'axe</button></div>`;
    $$('[data-preset]',el).forEach(b=>b.onclick=()=>{ const p=b.dataset.preset; if(p==='none'){st.logoOn=false;} else {st.logoOn=true; st.logo=null; st.logoName=''; st.logoWarn=''; st.logoPreset=p;} rc(3); upd(3); });
    $('#recenter').onclick=()=>{st.logoX=0; rc(3); upd(3); toast('Logo recentré sur l\'axe 0');};
    const drop=$('#logoDrop');
    ['dragover','dragenter'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('over')}));
    ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('over')}));
    drop.addEventListener('drop',e=>{ if(e.dataTransfer.files[0]&&!st.locked.logo) handleLogo(e.dataTransfer.files[0]); });
    $('#logoFile').onchange=e=>{ if(e.target.files[0]) handleLogo(e.target.files[0]); };
  },
  /* 5 — Contour */ (el)=>{ const st=S.style, L='outline';
    el.innerHTML=`${lockNote('outline')}
      <div class="field"><span class="label">Style</span>${segBtns('outline',[['aucun','Aucun'],['simple','Simple'],['double','Double'],['perso','Personnalisé']],L)}</div>
      ${st.outline==='aucun'?`<p class="small muted" style="margin:0">Le numéro sera imprimé sans contour.</p>`:`
        <div class="inline-row"><span class="label">Épaisseur :</span><span class="chips">${[1,2,3,4,5].map(n=>`<button class="chip" data-w="${n}" aria-pressed="${st.outlineWidth===n}" ${dis(L)}>${n} px</button>`).join('')}</span></div>
        ${slider(st.outline==='simple'?'Épaisseur précise :':'Contour intérieur :','outlineWidth',0,8,.5,' px',L,SLFMT.outlineWidth)}
        ${palette(st.outline==='simple'?'Couleur du contour :':'Couleur intérieure :','outlineColor',L)}
        ${st.outline!=='simple'?`${st.outline==='perso'?slider('Contour extérieur :','outline2Width',0,8,.5,' px',L,SLFMT.outline2Width):''}${palette('Couleur extérieure :','outline2Color',L)}`:''}`}`;
    $$('[data-w]',el).forEach(b=>b.onclick=()=>{st.outlineWidth=+b.dataset.w; rc(4); upd(4);});
  },
  /* 6 — Nom */ (el)=>{ const st=S.style, L='name';
    el.innerHTML=`${lockNote('name')}
      <label class="switch"><span>Ajouter un nom</span><input type="checkbox" id="nameOn" ${st.nameOn?'checked':''} ${dis(L)}></label>
      <div class="field"><label for="fName">Nom du joueur</label><input class="input" id="fName" value="${esc(S.player.name)}" maxlength="30" style="font-weight:700;letter-spacing:.06em" ${dis(L)}></div>
      <div class="field"><label for="fNameFont">Police du nom</label><select class="input" id="fNameFont" ${dis(L)}>${FONTS.map(f=>`<option value="${f.id}" ${st.nameFont===f.id?'selected':''}>${f.label}</option>`).join('')}</select></div>
      <div class="grid2">${slider('Taille :','nameSize',50,160,5,' %',L,SLFMT.nameSize)}${slider('Espacement :','nameSpacing',0,20,1,'',L)}</div>
      ${slider('Écart avec le numéro :','nameGap',0,40,1,'',L)}
      ${palette('Couleur du nom :','nameColor',L)}
      <label class="switch"><span>Appliquer le contour au nom</span><input type="checkbox" id="nameOl" ${st.nameOutline?'checked':''} ${dis(L)}></label>`;
    $('#fName').oninput=e=>{e.target.value=e.target.value.toUpperCase(); S.player.name=e.target.value; upd(5);};
    $('#nameOn').onchange=e=>{st.nameOn=e.target.checked; upd(5);};
    $('#nameOl').onchange=e=>{st.nameOutline=e.target.checked; upd(5);};
    $('#fNameFont').onchange=e=>{st.nameFont=e.target.value; upd(5);};
  },
  /* 7 — Courbe */ (el)=>{ const st=S.style, L='name';
    const modes=[['normal','Normal'],['haut','Courbé haut'],['bas','Courbé bas'],['leger','Courbé léger'],['fort','Courbé fort']];
    const active = st.curveMode==='normal'?'normal':(st.curveMode==='haut'&&st.curve===25?'leger':(st.curveMode==='haut'&&st.curve===90?'fort':st.curveMode));
    el.innerHTML=`${lockNote('name')}
      <div class="chips">${modes.map(([v,l])=>`<button class="chip" data-cm="${v}" aria-pressed="${active===v}" ${dis(L)}>${l}</button>`).join('')}</div>
      ${st.curveMode!=='normal'?slider('Intensité','curve',0,100,1,' %',L,SLFMT.curve):''}
      ${!st.nameOn||!S.player.name?`<p class="small" style="margin:0;color:var(--warn)">Ajoutez un nom à l'étape 6 pour voir la courbure.</p>`:''}`;
    $$('[data-cm]',el).forEach(b=>b.onclick=()=>{const v=b.dataset.cm;
      if(v==='leger'){st.curveMode='haut';st.curve=25} else if(v==='fort'){st.curveMode='haut';st.curve=90} else {st.curveMode=v; if(v!=='normal'&&st.curve===0) st.curve=50}
      rc(6); upd(6);});
  },
  /* 8 — Aperçu & contrôle */ (el)=>{ const st=S.style, f=fontById(st.font), nf=fontById(st.nameFont), checks=computeChecks();
    const ol={aucun:'Aucun',simple:'Simple',double:'Double',perso:'Personnalisé'}[st.outline];
    el.innerHTML=`<ul class="checks">${checks.map(c=>`<li class="${c.ok?'ok':'ko'}">${c.t}</li>`).join('')}</ul>
      <table class="summary">
        <tr><td>Joueur</td><td>${esc(S.player.name||'—')} #${esc(S.player.number)}</td></tr>
        <tr><td>Emplacement</td><td>${st.version==='dos'?'Dos':'Poitrine'}</td></tr>
        <tr><td>Police · couleur</td><td>${f.label} · ${st.numberColor}</td></tr>
        <tr><td>Contour</td><td>${ol}${st.outline!=='aucun'?` · ${st.outlineWidth} px · ${st.outlineColor}`:''}</td></tr>
        <tr><td>Nom</td><td>${st.nameOn?`${nf.label} · ${st.curveMode==='normal'?'droit':'courbé '+st.curveMode+' '+st.curve+' %'}`:'Sans nom'}</td></tr>
        <tr><td>Logo</td><td>${st.logoOn?(st.logo?esc(st.logoName):st.logoPreset==='star'?'Étoile':'Écusson club'):'Sans logo'}</td></tr></table>
      <div class="grid2">${slider('Hauteur numéro dos','numberHeight',10,35,1,' cm','',SLFMT.numberHeight)}${slider('Hauteur numéro poitrine','chestHeight',5,15,1,' cm','',SLFMT.chestHeight)}</div>
      <button class="btn btn-ghost" id="saveCre">Enregistrer dans mes créations</button>`;
    $('#saveCre').onclick=()=>{ saveCreation('Brouillon'); toast('Création enregistrée'); };
  },
  /* 9 — Export */ (el)=>{ const st=S.style, isBack=st.version==='dos', hCm=isBack?st.numberHeight:st.chestHeight;
    const a=renderArt(S.player,st,isBack?{number:true,name:true,logo:true}:{number:true,logo:true},hCm);
    const wcm=a.w*a.k, hcm=a.h*a.k, px=v=>Math.round(v/2.54*st.dpi);
    const fname=`JERSEYDTF_${slug(S.player.number)}${S.player.name&&st.nameOn?'_'+slug(S.player.name):''}.${st.format}`;
    el.innerHTML=`
      <div class="inline-row" style="justify-content:space-between"><span class="label">Format :</span>
        <span class="seg" role="group">${[['png','PNG'],['jpg','JPG'],['svg','SVG']].map(([v,l])=>`<button data-seg="format" data-v="${v}" aria-pressed="${st.format===v}">${l}</button>`).join('')}<button disabled title="Option future">PDF</button></span></div>
      <p class="small muted" style="margin:-6px 0 0">${{png:'Fond transparent, recommandé pour le DTF.',jpg:'Fond personnalisable, sans transparence.',svg:'Vectoriel : dimensions exactes à toute échelle.'}[st.format]}</p>
      <div class="bigstat"><span class="small muted">Dimensions réelles</span><b>${wcm.toFixed(1)} × ${hcm.toFixed(1)} cm</b></div>
      <div class="grid2">
        <div class="field"><label for="fDpi">Résolution</label><select class="input" id="fDpi" ${st.format==='svg'?'disabled':''}>${[150,300,600].map(d=>`<option value="${d}" ${st.dpi===d?'selected':''}>${d} DPI</option>`).join('')}</select></div>
        <div class="field"><label for="fCs">Espace colorimétrique</label><select class="input" id="fCs"><option>sRGB</option><option>Adobe RGB</option><option disabled>CMJN (bientôt)</option></select></div>
      </div>
      ${st.format!=='svg'?`<p class="small muted" style="margin:0">Fichier de <b style="color:var(--text)">${px(wcm).toLocaleString('fr-FR')} × ${px(hcm).toLocaleString('fr-FR')} px</b> à ${st.dpi} DPI, conforme aux dimensions physiques.</p>`:''}
      ${st.format==='jpg'?palette('Couleur de fond :','bgColor',''):''}
      <div class="field"><span class="label">Nom du fichier</span><div class="filename">${esc(fname)}</div></div>
      <div class="inline-row"><button class="btn btn-red" id="expBtn" style="flex:1">Exporter en ${st.format.toUpperCase()}</button></div>`;
    $('#fDpi').onchange=e=>{st.dpi=+e.target.value; rc(8); upd(8);};
    $('#expBtn').onclick=doExport;
    el.dataset.fname=fname; el.dataset.dims=`${px(wcm).toLocaleString('fr-FR')} × ${px(hcm).toLocaleString('fr-FR')} px`;
  }
];
CARD_SLIDE[0]=null;
CARD_SLIDE[7]=k=>{ if(k==='numberHeight'||k==='chestHeight'){ const c0=$('#cb0'); if(c0) CARD[0](c0); } };

/* ---------- Scène technique (règles en cm) ---------- */
let stageInfo=null;
function drawStage(){
  const vp=$('#viewport'); if(!vp) return;
  const W=vp.clientWidth, H=vp.clientHeight; if(!W||!H) return;
  const st=S.style, isBack=S.view==='dos', hCm=isBack?st.numberHeight:st.chestHeight;
  const parts=isBack?{number:true,name:true,logo:true}:{number:true,name:false,logo:true};
  const a=renderArt(S.player,st,parts,hCm);
  const s0=Math.min(W/66,H/84), s=s0*S.zoom, px=v=>v/s;
  const artTop=isBack?11:12, x0=-a.cx*a.k, y0=artTop, aw=a.w*a.k, ah=a.h*a.k;
  const t=clamp((S.zoom-1)/1,0,1), cxv=0, cyv=36+t*((y0+ah/2)-36);
  const vx0=cxv-W/2/s, vy0=cyv-H/2/s, vw=W/s, vh=H/s;
  const mode=st.bgMode;
  $('#canvas').classList.toggle('damier',mode==='damier');
  $$('[data-bg]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.bg===mode));
  $$('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===S.view));
  $('#gridBtn').setAttribute('aria-pressed',S.grid);
  $('#zVal').textContent=Math.round(S.zoom*100)+'%';
  $('#tbTitle').textContent=`${isBack?'Dos':'Poitrine'} — flocage ${hCm} cm`;
  $('#tbSub').textContent=S.grid?'Grille 5 cm · repères de centrage activés':'Repères de centrage activés';

  const fill = mode==='blanc'?JERSEY_BG.blanc : mode==='club'?st.jerseyColor : JERSEY_BG.noir;
  const edge = mode==='blanc'?'#D5D9DC' : mode==='club'?darken(st.jerseyColor,.25) : '#262B2F';
  const collar = mode==='blanc'?'#DADDE0' : mode==='club'?darken(st.jerseyColor,.3) : '#1E2326';
  const onJersey = lum(fill)>.6 ? '#5B6166' : '#7C848B';
  let g='';
  if(S.grid){ for(let x=Math.ceil(vx0/5)*5;x<vx0+vw;x+=5) g+=`<line x1="${x}" y1="${vy0}" x2="${x}" y2="${vy0+vh}" stroke="rgba(140,150,158,.14)" stroke-width="${px(1)}"/>`;
              for(let y=Math.ceil(vy0/5)*5;y<vy0+vh;y+=5) g+=`<line x1="${vx0}" y1="${y}" x2="${vx0+vw}" y2="${y}" stroke="rgba(140,150,158,.14)" stroke-width="${px(1)}"/>`; }
  let torso='';
  if(mode!=='damier' && !st.hidden.jersey){
    torso=`<rect x="-27" y="0" width="54" height="74" rx="4" fill="${fill}" stroke="${edge}" stroke-width="${px(1.2)}"/>
      ${isBack?`<path d="M-9.5 0 A9.5 9.5 0 0 0 9.5 0" fill="none" stroke="${collar}" stroke-width="1.6"/>`
              :`<path d="M-8.5 0 L0 9 L8.5 0" fill="none" stroke="${collar}" stroke-width="1.6" stroke-linejoin="round"/>`}
      <circle cx="${-px(118)}" cy="70.2" r="${px(4)}" fill="#E31B17"/>
      <text x="${-px(106)}" y="70.2" dominant-baseline="middle" font-family="Poppins,Arial" font-size="${px(12)}" fill="${onJersey}">Transfert DTF à chaud · 150 °C · 12 s (indicatif)</text>`;
  }
  const zoneLbl=`ZONE DTF RÉELLE : ${aw.toFixed(1)} × ${ah.toFixed(1)} cm`, tagW=px(zoneLbl.length*6.9+18), tagH=px(22);
  const guideX=a.numW*a.k/2;
  const centered=Math.abs(st.logoX)<0.05||!st.logoOn;
  const info = `<line x1="${x0}" y1="${y0+ah+px(12)}" x2="${x0+aw}" y2="${y0+ah+px(12)}" stroke="#E31B17" stroke-opacity=".5" stroke-dasharray="${px(3)} ${px(3)}" stroke-width="${px(1)}"/>
    <text x="${x0}" y="${y0+ah+px(30)}" font-family="JetBrains Mono,monospace" font-size="${px(11)}" fill="${centered?'#2BD17E':'#F5B82E'}">${centered?'Alignement vérifié':'Logo décalé '+(st.logoX>0?'+':'')+st.logoX.toFixed(1)+' cm'}</text>
    ${aw*s<260?'':`<text x="${x0+aw}" y="${y0+ah+px(30)}" text-anchor="end" font-family="JetBrains Mono,monospace" font-size="${px(11)}" fill="${onJersey}">Largeur : ${aw.toFixed(1)} cm</text>`}`;
  $('#stage').setAttribute('viewBox',`${vx0} ${vy0} ${vw} ${vh}`);
  $('#stage').innerHTML=`${g}${torso}
    <line x1="0" y1="${vy0}" x2="0" y2="${vy0+vh}" stroke="#E31B17" stroke-width="${px(1)}" stroke-dasharray="${px(5)} ${px(4)}"/>
    ${guideX?`<line x1="${-guideX}" y1="${y0-px(6)}" x2="${-guideX}" y2="${y0+ah+px(6)}" stroke="${onJersey}" stroke-opacity=".5" stroke-dasharray="${px(3)} ${px(4)}" stroke-width="${px(1)}"/><line x1="${guideX}" y1="${y0-px(6)}" x2="${guideX}" y2="${y0+ah+px(6)}" stroke="${onJersey}" stroke-opacity=".5" stroke-dasharray="${px(3)} ${px(4)}" stroke-width="${px(1)}"/>`:''}
    <rect x="${x0}" y="${y0}" width="${aw}" height="${ah}" fill="none" stroke="#E31B17" stroke-opacity=".8" stroke-width="${px(1)}" stroke-dasharray="${px(4)} ${px(3)}"/>
    <g transform="translate(${x0} ${y0}) scale(${a.k})" id="artG">${a.svg}</g>
    <g><rect x="${x0+px(10)}" y="${y0-tagH/2}" width="${tagW}" height="${tagH}" rx="${px(3)}" fill="#0B0D0E" stroke="#E31B17" stroke-width="${px(1)}"/>
      <text x="${x0+px(19)}" y="${y0}" dominant-baseline="central" font-family="JetBrains Mono,monospace" font-size="${px(11)}" fill="#FF4A45">${zoneLbl}</text></g>
    ${info}`;
  stageInfo={s,vx0,vy0,x0,y0,a,hCm};
  drawRulers(W,H,s,vx0,vy0,x0,y0,aw,ah);
}
function drawRulers(W,H,s,vx0,vy0,x0,y0,aw,ah){
  const TH=$('#rTop').clientHeight||30, LW=$('#rLeft').clientWidth||44, mob=innerWidth<=900;
  let top=`<rect x="${(x0-vx0)*s}" y="0" width="${aw*s}" height="${TH}" fill="rgba(227,27,23,.1)"/>`;
  const labStep = s<5?10:5;
  for(let cm=Math.ceil(vx0); cm<=vx0+W/s; cm++){
    const x=(cm-vx0)*s, major=cm%5===0;
    if(s<3 && !major) continue;
    top+=`<line x1="${x}" y1="${TH}" x2="${x}" y2="${TH-(major?9:4)}" stroke="${cm===0?'#E31B17':'var(--dim)'}" stroke-width="1"/>`;
    if(cm%labStep===0 && !mob || (mob && cm%10===0)) top+=`<text x="${x}" y="${TH-13}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="${mob?9:10.5}" fill="${cm===0?'#FF4A45':'var(--muted)'}" font-weight="${cm===0?700:500}">${cm===0?'AXE 0':(cm>0?'+':'')+cm+'cm'}</text>`;
  }
  $('#rTop').innerHTML=`<svg viewBox="0 0 ${W} ${TH}" preserveAspectRatio="none">${top}</svg>`;
  let left=`<rect x="0" y="${(y0-vy0)*s}" width="${LW}" height="${ah*s}" fill="rgba(227,27,23,.1)"/>`;
  for(let cm=Math.ceil(vy0); cm<=vy0+H/s; cm++){
    const y=(cm-vy0)*s, major=cm%5===0;
    if(s<3 && !major) continue;
    left+=`<line x1="${LW}" y1="${y}" x2="${LW-(major?18:5)}" y2="${y}" stroke="${major?'#E31B17':'var(--dim)'}" stroke-width="${major?2:1}"/>`;
    if(major && cm>=0 && !mob) left+=`<text x="4" y="${y-4}" font-family="JetBrains Mono,monospace" font-size="9.5" fill="${cm%25===0&&cm>0?'#FF4A45':'var(--muted)'}">${cm}cm</text>`;
  }
  $('#rLeft').innerHTML=`<svg viewBox="0 0 ${LW} ${H}" preserveAspectRatio="none">${left}</svg>`;
}
function bindStageDrag(){
  const svg=$('#stage'), vp=$('#viewport'); let drag=null;
  const pt=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())};
  svg.addEventListener('pointerdown',e=>{
    if(!e.target.closest('.logo-hit') || S.style.locked.logo || S.view!=='dos'&&S.view!=='poitrine') return;
    const i=stageInfo; if(!i||i.a.numTop==null) return;
    drag={pid:e.pointerId}; svg.setPointerCapture(e.pointerId); vp.classList.add('dragging'); setStep(3,true);
  });
  svg.addEventListener('pointermove',e=>{
    if(!drag) return; const i=stageInfo, p=pt(e), st=S.style;
    const numTopCm=i.y0+i.a.numTop*i.a.k;
    st.logoX=Math.round(clamp(p.x,-12,12)*10)/10; if(Math.abs(st.logoX)<0.4) st.logoX=0;
    st.logoY=Math.round(clamp((p.y-numTopCm)/i.hCm*100,0,130));
    drawStage(); meta(3);
    ['logoX','logoY'].forEach(k=>{const r=$('#sl_'+k), o=$('#o_'+k); if(r){r.value=st[k]; r.style.setProperty('--p',(st[k]-r.min)/(r.max-r.min)*100+'%');} if(o) o.textContent=SLFMT[k](st[k]);});
  });
  const end=()=>{ if(!drag) return; drag=null; vp.classList.remove('dragging'); rc(3); upd(3); };
  svg.addEventListener('pointerup',end); svg.addEventListener('pointercancel',end);
}
function renderLayers(){
  const L=[['logo','Logo'],['name','Nom'],['number','Numéro'],['outline','Contour'],['jersey','Maillot']], st=S.style;
  $('#layers').innerHTML=L.map(([k,l])=>`<div class="lrow ${st.hidden[k]?'off':''}"><span class="grip" aria-hidden="true">☰</span><span class="lbl">${l}</span>
    <button class="icon-btn" data-hide="${k}" aria-pressed="${!!st.hidden[k]}" aria-label="${st.hidden[k]?'Afficher':'Masquer'} ${l}" title="${st.hidden[k]?'Afficher':'Masquer'}">${st.hidden[k]?'◌':'◉'}</button>
    <button class="icon-btn" data-lock="${k}" aria-pressed="${!!st.locked[k]}" aria-label="Verrouiller ${l}" title="${st.locked[k]?'Déverrouiller':'Verrouiller'}">${st.locked[k]?'■':'□'}</button></div>`).join('');
  $$('[data-hide]').forEach(b=>b.onclick=()=>{st.hidden[b.dataset.hide]=!st.hidden[b.dataset.hide]; renderLayers(); upd();});
  $$('[data-lock]').forEach(b=>b.onclick=()=>{st.locked[b.dataset.lock]=!st.locked[b.dataset.lock]; renderLayers(); for(let i=0;i<9;i++) rc(i); persist();});
}
function handleLogo(file){
  const okType=/image\/(png|jpeg|svg\+xml)/.test(file.type) && /\.(png|jpe?g|svg)$/i.test(file.name), okSize=file.size<=10*1024*1024;
  if(!okType){ toast('Format non supporté : utilisez PNG, JPG ou SVG.','warn'); return; }
  if(!okSize){ toast('Fichier trop volumineux : 10 Mo maximum.','warn'); return; }
  const r=new FileReader();
  r.onload=()=>{ const img=new Image(); img.onload=()=>{
      const w=img.naturalWidth||0,h=img.naturalHeight||0, small=file.type!=='image/svg+xml'&&w&&Math.min(w,h)<500;
      Object.assign(S.style,{logo:r.result, logoName:file.name, logoOn:true, logoX:0, logoWarn: small?`Logo de ${w} × ${h} px : 500 px minimum conseillés pour 300 DPI`:''});
      rc(3); upd(3); toast(`Logo importé et centré${w?` (${w} × ${h} px)`:''}`);
    }; img.onerror=()=>toast('Le fichier ne peut pas être lu comme une image.','warn'); img.src=r.result; };
  r.readAsDataURL(file);
}
function saveCreation(status){
  const existing=S.creations.find(c=>c.name===S.player.name&&c.number===S.player.number);
  const snap=structuredClone(S.style);
  if(existing){ existing.style=snap; if(status==='Exporté') existing.status='Exporté'; existing.date=today(); }
  else S.creations.unshift({id:S.nextId++, name:S.player.name, number:S.player.number, team:'—', date:today(), status, style:snap});
  S.project=`${S.player.name||'Sans nom'} #${S.player.number}`;
  persist(); updStatus();
}
function doExport(){
  const el=$('#cb8'); const bad=computeChecks().filter(c=>!c.ok);
  const go=()=>{ saveCreation('Exporté'); S.files.unshift({name:el.dataset.fname, size:S.style.format==='svg'?'Vectoriel':el.dataset.dims, date:today()}); persist();
    toast(`Export terminé : ${esc(el.dataset.fname)}`,'ok',{label:'Mes fichiers',fn:()=>location.hash='#/app/fichiers'}); };
  if(bad.length) toast(`${bad.length} point${bad.length>1?'s':''} à vérifier avant impression.`,'warn',{label:'Exporter quand même',fn:go});
  else go();
}
function newFlocage(){
  const old=structuredClone({style:S.style,player:S.player,project:S.project,step:S.step});
  S.style=structuredClone(DEFAULT_STYLE); S.player={name:'VOTRE NOM',number:'10'}; S.project=null; S.step=0; S.zoom=1;
  persist(); if(location.hash.includes('creer')) viewCreate(); else location.hash='#/app/creer'; updStatus();
  toast('Nouveau flocage vierge','ok',{label:'Annuler',fn:()=>{Object.assign(S,old); persist(); route();}});
}
/* ======================= APPLICATION : AUTRES VUES ======================= */
function viewDashboard(){
  main().innerHTML=`<div class="page">
  <div class="page-head"><div><h1>Bonjour Kalla</h1><p>Reprenez une création ou préparez la prochaine planche.</p></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ghost" data-go="#/app/equipe">Importer une équipe</button><button class="btn btn-red" data-go="#/app/creer">Nouvelle création</button></div></div>
  <div class="stats4">
    <div><small>CRÉATIONS</small><b>${S.creations.length+21}</b></div>
    <div><small>ÉQUIPES</small><b>3</b></div>
    <div><small>PLANCHES DTF</small><b>${S.sheetsCount+6}</b></div>
    <div><small>FICHIERS</small><b>${S.files.length+45}</b></div>
  </div>
  <div class="panel"><div class="panel-h"><h2>Créations récentes</h2><button class="link" data-go="#/app/creations">Tout voir</button></div>
    ${creationsTable(S.creations.slice(0,4))}</div></div>`;
  bindCreations();
}
/* ======================= PLACEMENT (MaxRects, bas-gauche) ======================= */
function pack(binW, binH, items, allowRot){
  let free=[{x:0,y:0,w:binW,h:binH}]; const placed=[], out=[];
  const sorted=[...items].sort((a,b)=>b.w*b.h-a.w*a.h || b.h-a.h);
  for(const it of sorted){
    let best=null;
    for(const f of free){
      for(const r of (allowRot?[0,1]:[0])){
        const w=r?it.h:it.w, h=r?it.w:it.h;
        if(w<=f.w+1e-6 && h<=f.h+1e-6){
          const s1=f.y+h, s2=f.x;
          if(!best || s1<best.s1-1e-6 || (Math.abs(s1-best.s1)<1e-6 && s2<best.s2)) best={x:f.x,y:f.y,w,h,r,s1,s2};
        }
      }
    }
    if(!best){out.push(it);continue}
    placed.push({...it, x:best.x, y:best.y, rot:best.r?90:0});
    const R=best, nf=[];
    for(const f of free){
      if(R.x>=f.x+f.w||R.x+R.w<=f.x||R.y>=f.y+f.h||R.y+R.h<=f.y){nf.push(f);continue}
      if(R.x>f.x) nf.push({x:f.x,y:f.y,w:R.x-f.x,h:f.h});
      if(R.x+R.w<f.x+f.w) nf.push({x:R.x+R.w,y:f.y,w:f.x+f.w-R.x-R.w,h:f.h});
      if(R.y>f.y) nf.push({x:f.x,y:f.y,w:f.w,h:R.y-f.y});
      if(R.y+R.h<f.y+f.h) nf.push({x:f.x,y:R.y+R.h,w:f.w,h:f.y+f.h-R.y-R.h});
    }
    free=nf.filter((a,i)=>!nf.some((b,j)=>j!==i && a.x>=b.x-1e-6&&a.y>=b.y-1e-6&&a.x+a.w<=b.x+b.w+1e-6&&a.y+a.h<=b.y+b.h+1e-6 && (j<i || a.w*a.h<b.w*b.h)));
  }
  return {placed, out};
}
function buildSheetItems(){
  const sh=S.sheet, st=S.style, items=[];
  const hCm = sh.version==='dos'?st.numberHeight:st.chestHeight;
  const partsList = sh.split ? [{number:true},{name:true},{logo:true}] : [{number:true,name:sh.version==='dos',logo:true}];
  S.team.players.forEach((p,pi)=>{
    for(let c=0;c<sh.copies;c++){
      for(const pr of partsList){
        const parts={number:!!pr.number,name:!!pr.name,logo:!!pr.logo};
        const a=renderArt(p,st,parts,hCm);
        if(a.svg==='') continue;
        items.push({id:'i'+Math.random().toString(36).slice(2,9), pi, parts, w:+(a.w*a.k).toFixed(2), h:+(a.h*a.k).toFixed(2)});
      }
    }
  });
  return items;
}
function optimizeSheet(){
  const sh=S.sheet, sp=sh.spacing;
  const src = sh.items.length ? sh.items : buildSheetItems();
  const inflated = src.map(i=>({...i, w:i.w+sp, h:i.h+sp}));
  const {placed,out} = pack(sh.w-2*sh.margin+sp, sh.h-2*sh.margin+sp, inflated, sh.rotate);
  sh.items = placed.map(i=>({...i, w:+(i.w-sp).toFixed(2), h:+(i.h-sp).toFixed(2), x:+(i.x+sh.margin).toFixed(2), y:+(i.y+sh.margin).toFixed(2)}))
    .concat(out.map(i=>({...i, w:+(i.w-sp).toFixed(2), h:+(i.h-sp).toFixed(2), x:null, y:null, rot:0})));
}
function sheetStats(){
  const sh=S.sheet; let area=0, placed=0, off=0;
  sh.items.forEach(i=>{ if(i.x==null){off++;return} placed++; area+=i.w*i.h; });
  const occ = area/(sh.w*sh.h)*100;
  return {occ, waste:100-occ, placed, off, total:sh.items.length};
}
function itemBox(i){return i.rot? {x:i.x,y:i.y,w:i.h,h:i.w} : {x:i.x,y:i.y,w:i.w,h:i.h}}
function badItems(){
  const sh=S.sheet, bad=new Set(), P=sh.items.filter(i=>i.x!=null);
  P.forEach((a,ia)=>{const A=itemBox(a);
    if(A.x<-0.01||A.y<-0.01||A.x+A.w>sh.w+0.01||A.y+A.h>sh.h+0.01) bad.add(a.id);
    P.forEach((b,ib)=>{ if(ib<=ia) return; const B=itemBox(b);
      if(A.x<B.x+B.w-0.05&&A.x+A.w>B.x+0.05&&A.y<B.y+B.h-0.05&&A.y+A.h>B.y+0.05){bad.add(a.id);bad.add(b.id)} });
  });
  return bad;
}
function sheetSVG(opts={}){
  const sh=S.sheet, st=S.style, R=6, bad=badItems();
  const hCm = sh.version==='dos'?st.numberHeight:st.chestHeight;
  let grid='';
  for(let x=10;x<sh.w;x+=10) grid+=`<line x1="${x}" y1="0" x2="${x}" y2="${sh.h}" stroke="var(--film-grid)" stroke-width=".15"/>`;
  for(let y=10;y<sh.h;y+=10) grid+=`<line x1="0" y1="${y}" x2="${sh.w}" y2="${y}" stroke="var(--film-grid)" stroke-width=".15"/>`;
  const items = sh.items.filter(i=>i.x!=null).map((i,idx)=>{
    const p=S.team.players[i.pi]; if(!p) return '';
    const a=renderArt(p,st,i.parts,hCm);
    const tr = i.rot? `translate(${i.x+i.h} ${i.y}) rotate(90)` : `translate(${i.x} ${i.y})`;
    const inner=`<rect class="bb" width="${i.w}" height="${i.h}" fill="transparent" stroke="#8A9095" stroke-width=".18" stroke-dasharray=".8 .6"/>
      <svg width="${i.w}" height="${i.h}" viewBox="0 0 ${a.w} ${a.h}" overflow="visible">${a.svg}</svg>`;
    return `<g class="item${opts.selId===i.id?' sel':''}${bad.has(i.id)?' bad':''}" data-id="${i.id}" transform="${tr}">${opts.animate?`<g class="pop" style="animation-delay:${idx*70}ms">${inner}</g>`:inner}</g>`;
  }).join('');
  const rulers = opts.rulers===false ? '' : `
    <text x="${sh.w/2}" y="-2" text-anchor="middle" font-size="2.4" font-family="JetBrains Mono,monospace" font-weight="600" fill="currentColor">${sh.w} cm</text>
    <text x="-2" y="${sh.h/2}" text-anchor="middle" font-size="2.4" font-family="JetBrains Mono,monospace" font-weight="600" fill="currentColor" transform="rotate(-90 -2 ${sh.h/2})">${sh.h} cm</text>`;
  const vb = opts.rulers===false ? `0 0 ${sh.w} ${sh.h}` : `${-R} ${-R} ${sh.w+R+1} ${sh.h+R+1}`;
  return `<svg class="sheet" id="${opts.id||''}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">
    ${rulers}<rect width="${sh.w}" height="${sh.h}" fill="var(--film)"/>
    ${sh.margin>0?`<rect x="${sh.margin}" y="${sh.margin}" width="${sh.w-2*sh.margin}" height="${sh.h-2*sh.margin}" fill="none" stroke="#E31B17" stroke-opacity=".5" stroke-width=".15" stroke-dasharray="1 .8"/>`:''}
    ${grid}<g id="sheetItems">${items}</g></svg>`;
}


function creationStyle(c){ return {...S.style, ...(c.style||{}), hidden:DEFAULT_STYLE.hidden}; }
function creationsTable(list){
  if(!list.length) return `<div class="empty"><h2>Aucune création</h2><p>Créez votre premier numéro pour le retrouver ici.</p><button class="btn btn-red" data-go="#/app/creer">Créer un numéro</button></div>`;
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Aperçu</th><th>Numéro</th><th>Nom</th><th>Date</th><th>Équipe</th><th>Statut</th><th style="text-align:right">Actions</th></tr></thead><tbody>
  ${list.map(c=>`<tr data-cid="${c.id}"><td><div class="thumb">${artSVG(c,creationStyle(c),{number:true,name:true,logo:false})}</div></td>
    <td class="num">${esc(c.number)}</td><td><b>${esc(c.name)}</b></td><td>${c.date}</td><td>${esc(c.team)}</td>
    <td><span class="badge ${c.status==='Exporté'?'ok':'warn'}">${c.status}</span></td>
    <td><div class="acts"><button class="btn btn-ghost btn-sm" data-act="edit">Modifier</button><button class="btn btn-ghost btn-sm" data-act="dup">Dupliquer</button><button class="btn btn-ghost btn-sm" data-act="dl">Télécharger</button><button class="btn btn-ghost btn-sm" data-act="del" aria-label="Supprimer ${esc(c.name)}">Supprimer</button></div>
      <div class="dup-slot"></div></td></tr>`).join('')}</tbody></table></div>`;
}
function bindCreations(){
  $$('tr[data-cid]').forEach(tr=>{
    const c=S.creations.find(x=>x.id==tr.dataset.cid);
    $$('[data-act]',tr).forEach(b=>b.onclick=()=>{
      const a=b.dataset.act;
      if(a==='edit'){ S.player={name:c.name,number:c.number}; if(c.style) Object.assign(S.style,structuredClone(c.style)); S.project=`${c.name} #${c.number}`; S.step=7; persist(); location.hash='#/app/creer'; }
      if(a==='dl'){ toast(`Téléchargement de JERSEYDTF_${slug(c.number)}_${slug(c.name)}.png`); }
      if(a==='del'){ const idx=S.creations.indexOf(c); S.creations.splice(idx,1); persist(); route();
        toast(`Création ${esc(c.name)} #${esc(c.number)} supprimée`,'ok',{label:'Annuler',fn:()=>{S.creations.splice(idx,0,c);persist();route();}}); }
      if(a==='dup'){
        const slot=$('.dup-slot',tr); if(slot.innerHTML){slot.innerHTML='';return}
        slot.innerHTML=`<div class="dup-form"><input class="input" placeholder="Nom" maxlength="30" style="width:130px" aria-label="Nom du nouveau joueur"><input class="input" placeholder="N°" maxlength="3" style="width:64px" inputmode="numeric" aria-label="Numéro"><button class="btn btn-red btn-sm">Créer la copie</button></div>`;
        const [ni,nu]=$$('input',slot); ni.focus();
        ni.oninput=()=>ni.value=ni.value.toUpperCase(); nu.oninput=()=>nu.value=nu.value.replace(/\D/g,'');
        $('button',slot).onclick=()=>{
          const n=+nu.value; if(!ni.value.trim()){ni.classList.add('bad');return} if(!(n>=1&&n<=999)){nu.classList.add('bad');return}
          S.creations.unshift({...structuredClone(c), id:S.nextId++, name:ni.value.trim(), number:String(n), date:today(), status:'Brouillon'});
          persist(); route(); toast(`${esc(ni.value.trim())} #${n} créé avec le style de ${esc(c.name)} #${esc(c.number)}`);
        };
      }
    });
  });
}
function viewCreations(){
  main().innerHTML=`<div class="page"><div class="page-head"><div><h1>Mes créations</h1><p>Dupliquez une création pour un autre joueur sans refaire la configuration.</p></div><button class="btn btn-red" data-go="#/app/creer">Nouvelle création</button></div>
  <div class="panel">${creationsTable(S.creations)}</div></div>`;
  bindCreations();
}
function viewFiles(){
  main().innerHTML=`<div class="page"><div class="page-head"><div><h1>Mes fichiers</h1><p>Fichiers générés, prêts pour l'impression.</p></div></div>
  <div class="panel"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Fichier</th><th>Dimensions</th><th>Date</th><th></th></tr></thead><tbody>
  ${S.files.map(f=>`<tr><td><b>${esc(f.name)}</b></td><td>${esc(f.size)}</td><td>${f.date}</td><td style="text-align:right"><button class="btn btn-ghost btn-sm" onclick="toast('Téléchargement de ${esc(f.name)}')">Télécharger</button></td></tr>`).join('')}
  </tbody></table></div></div></div>`;
}

/* ---------- Configurateur ---------- */

let impRows=[], impMode='replace';
function viewTeam(){
  const st=S.style, f=fontById(st.font);
  const errs=validateTeam(S.team.players);
  main().innerHTML=`<div class="page">
  <div class="page-head"><div><h1>Gestion d'équipe</h1><p>Le style de la création en cours est appliqué à tous les joueurs.</p></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ghost" id="impOpen">Importer CSV / XLSX</button><button class="btn btn-red" id="genSheet" ${errs.size||!S.team.players.length?'disabled':''}>Générer la planche DTF</button></div></div>
  <div class="team-grid">
    <div class="panel">
      <div class="panel-h"><div class="field" style="flex:1"><label for="teamName" class="small muted">Nom de l'équipe</label><input class="input" id="teamName" value="${esc(S.team.name)}" style="font-weight:700;max-width:260px"></div>
        <span class="badge">${S.team.players.length} joueurs</span></div>
      <div class="tbl-wrap"><table class="tbl" id="ptable"><thead><tr><th>Nom</th><th>Numéro</th><th>Contrôle</th><th style="text-align:right">Action</th></tr></thead><tbody>
      ${S.team.players.map((p,i)=>`<tr data-i="${i}"><td><input class="input" data-pf="name" value="${esc(p.name)}" maxlength="30" aria-label="Nom joueur ${i+1}"></td>
        <td><input class="input" data-pf="number" value="${esc(p.number)}" maxlength="3" inputmode="numeric" style="width:76px;font-family:var(--title);font-weight:800" aria-label="Numéro joueur ${i+1}"></td>
        <td>${errs.has(i)?`<span class="badge err">${errs.get(i)}</span>`:'<span class="badge ok">OK</span>'}</td>
        <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-rm="${i}" aria-label="Supprimer ${esc(p.name)}">Supprimer</button></td></tr>`).join('')}
      </tbody></table></div>
      <div class="panel-b" style="border-top:1px solid var(--line)"><button class="btn btn-ghost" id="addP">+ Ajouter un joueur</button></div>
    </div>
    <div class="panel"><div class="panel-h"><h2>Aperçu de l'équipe</h2><button class="link" data-go="#/app/creer">Modifier le style</button></div>
      <div class="panel-b">
        <div class="style-line"><span class="badge">${f.label}</span><span class="badge">${st.numberColor}</span><span class="badge">Contour ${st.outline}${st.outline!=='aucun'?' '+st.outlineWidth+' px':''}</span><span class="badge">${st.logoOn?'Logo':'Sans logo'}</span><span class="badge">${st.numberHeight} cm</span></div>
        <div class="mini-jerseys" id="minis">${S.team.players.map(p=>`<figure>${jerseySVG(p,{...st,logoY:115,logoScale:80},'dos')}<figcaption>${esc(p.name)} · ${esc(p.number)}</figcaption></figure>`).join('')}</div>
      </div></div>
  </div></div>`;
  $('#teamName').oninput=e=>{S.team.name=e.target.value;persist();};
  $$('#ptable [data-pf]').forEach(inp=>inp.onchange=inp.oninput=e=>{
    const i=+inp.closest('tr').dataset.i, k=inp.dataset.pf;
    inp.value = k==='name'? inp.value.toUpperCase() : inp.value.replace(/\D/g,'').slice(0,3);
    S.team.players[i][k]=inp.value; persist();
    if(e.type==='change') viewTeam(); else { const fig=$$('#minis figure')[i]; if(fig) fig.innerHTML=`${jerseySVG(S.team.players[i],{...S.style,logoY:115,logoScale:80},'dos')}<figcaption>${esc(S.team.players[i].name)} · ${esc(S.team.players[i].number)}</figcaption>`; }
  });
  $$('[data-rm]').forEach(b=>b.onclick=()=>{const i=+b.dataset.rm, p=S.team.players.splice(i,1)[0]; S.sheet.items=[]; persist(); viewTeam();
    toast(`${esc(p.name)} retiré de l'équipe`,'ok',{label:'Annuler',fn:()=>{S.team.players.splice(i,0,p);persist();viewTeam();}});});
  $('#addP').onclick=()=>{S.team.players.push({name:'',number:''}); S.sheet.items=[]; persist(); viewTeam(); const ins=$$('#ptable [data-pf="name"]'); ins[ins.length-1].focus();};
  $('#impOpen').onclick=()=>{ $('#importDlg').showModal(); parseImport($('#impText').value); };
  $('#genSheet').onclick=()=>{ S.sheet.items=[]; optimizeSheet(); S.sheetsCount++; persist(); location.hash='#/app/planche'; toast('Planche DTF générée'); };
}
function validateTeam(players){
  const m=new Map(), seen={};
  players.forEach((p,i)=>{ const n=+p.number;
    if(!p.name||!p.name.trim()) m.set(i,'Nom manquant');
    else if(p.name.length>30) m.set(i,'Nom > 30 car.');
    else if(!(n>=1&&n<=999)) m.set(i,'Numéro 1–999');
    else if(seen[n]!=null){ m.set(i,'Numéro en double'); m.set(seen[n],'Numéro en double'); }
    if(n) seen[n]=seen[n]??i; });
  return m;
}
function parseImport(text, rowsIn){
  let rows = rowsIn || text.trim().split(/\r?\n/).filter(l=>l.trim()).map(l=>l.split(/[;,\t]/).map(x=>x.trim().replace(/^"|"$/g,'')));
  const out=$('#impPreview'); if(!rows.length){out.innerHTML='';impRows=[];return}
  const head=rows[0].map(h=>String(h).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''));
  let ni=head.findIndex(h=>/^(nom|name|joueur|player)$/.test(h)), nu=head.findIndex(h=>/^(numero|number|n°|no|num|#)$/.test(h));
  const hasHead = ni>=0||nu>=0;
  if(!hasHead){ ni=0; nu=1; } else { if(ni<0) ni=nu===0?1:0; if(nu<0) nu=ni===0?1:0; }
  const data=(hasHead?rows.slice(1):rows).map(r=>({name:String(r[ni]??'').toUpperCase().trim(), number:String(r[nu]??'').replace(/\D/g,'')}));
  const base = impMode==='add'? S.team.players : [];
  const errs=validateTeam(base.concat(data));
  impRows=data.map((d,i)=>({...d, err:errs.get(base.length+i)}));
  const nOk=impRows.filter(r=>!r.err).length;
  out.innerHTML=`<p class="small" style="margin:0 0 8px">${hasHead?`Colonnes détectées : <b>${esc(rows[0][ni])}</b> → Nom, <b>${esc(rows[0][nu])}</b> → Numéro.`:'Aucun en-tête détecté : 1<sup>re</sup> colonne = nom, 2<sup>e</sup> = numéro.'}
    ${nOk} ligne${nOk>1?'s':''} valide${nOk>1?'s':''}${impRows.length-nOk?`, <b style="color:var(--err)">${impRows.length-nOk} erreur${impRows.length-nOk>1?'s':''} ignorée${impRows.length-nOk>1?'s':''}</b>`:''}.</p>
    <div class="tbl-wrap" style="max-height:220px;overflow:auto;border:1px solid var(--line);border-radius:8px"><table class="tbl"><thead><tr><th>Nom</th><th>Numéro</th><th>Contrôle</th></tr></thead><tbody>
    ${impRows.map(r=>`<tr><td>${esc(r.name)||'<span class="muted">—</span>'}</td><td class="num">${esc(r.number)||'—'}</td><td>${r.err?`<span class="badge err">${r.err}</span>`:'<span class="badge ok">OK</span>'}</td></tr>`).join('')}</tbody></table></div>`;
  $('#impConfirm').textContent=`Importer ${nOk} joueur${nOk>1?'s':''}`; $('#impConfirm').disabled=!nOk;
}
function initImport(){
  $('#impClose').onclick=()=>$('#importDlg').close();
  $('#impText').oninput=e=>parseImport(e.target.value);
  $$('[data-impmode]').forEach(b=>b.onclick=()=>{impMode=b.dataset.impmode;$$('[data-impmode]').forEach(x=>x.setAttribute('aria-pressed',x===b));parseImport($('#impText').value)});
  $('#impFile').onchange=e=>{
    const f=e.target.files[0]; if(!f) return;
    if(/\.xlsx?$/i.test(f.name)){
      if(typeof XLSX==='undefined'){toast('Lecture XLSX indisponible : exportez le fichier en CSV.','warn');return}
      const r=new FileReader(); r.onload=()=>{ try{ const wb=XLSX.read(r.result,{type:'array'}); const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:''}).filter(x=>x.some(c=>String(c).trim()));
        $('#impText').value=rows.map(x=>x.join(',')).join('\n'); parseImport('',rows);}catch(err){toast('Le fichier XLSX ne peut pas être lu.','warn')} }; r.readAsArrayBuffer(f);
    } else if(/\.csv$/i.test(f.name)){ const r=new FileReader(); r.onload=()=>{$('#impText').value=r.result; parseImport(r.result)}; r.readAsText(f); }
    else toast('Format non supporté : utilisez CSV ou XLSX.','warn');
    e.target.value='';
  };
  $('#impConfirm').onclick=()=>{
    const ok=impRows.filter(r=>!r.err).map(({name,number})=>({name,number}));
    S.team.players = impMode==='add'? S.team.players.concat(ok) : ok;
    S.sheet.items=[]; persist(); $('#importDlg').close(); route(); toast(`${ok.length} joueurs importés`);
  };
}

/* ---------- Planche DTF ---------- */

let selId=null, drag=null;
function viewSheet(){
  const sh=S.sheet;
  if(!sh.items.length && S.team.players.length) optimizeSheet();
  const players=S.team.players;
  main().innerHTML=`<div class="page">
  <div class="page-head"><div><h1>Planche DTF</h1><p>${esc(S.team.name)} · ${players.length} joueurs · glissez un élément pour le déplacer.</p></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ghost" id="optBtn">Optimiser automatiquement</button><button class="btn btn-red" id="dlSheet">Télécharger la planche</button></div></div>
  <div class="sheet-grid">
    <div class="panel planche-panel"><div class="panel-b">
      <div class="occ"><div><small>Occupation</small><b id="stOcc"></b></div><div><small>Chute</small><b id="stWaste"></b></div></div>
      <div class="meter"><i id="stMeter"></i></div>
      <p class="small" id="stPlaced" style="margin:0"></p>
      <div class="grid2">
        <div class="field"><label for="shW">Largeur (cm)</label><input class="input" type="number" id="shW" data-sh="w" min="20" max="200" value="${sh.w}"></div>
        <div class="field"><label for="shH">Hauteur (cm)</label><input class="input" type="number" id="shH" data-sh="h" min="20" max="500" value="${sh.h}"></div>
        <div class="field"><label for="shM">Marge (cm)</label><input class="input" type="number" id="shM" data-sh="margin" min="0" max="10" step="0.5" value="${sh.margin}"></div>
        <div class="field"><label for="shS">Espacement (cm)</label><input class="input" type="number" id="shS" data-sh="spacing" min="0" max="10" step="0.5" value="${sh.spacing}"></div>
        <div class="field"><label for="shC">Copies / joueur</label><input class="input" type="number" id="shC" data-sh="copies" min="1" max="10" value="${sh.copies}"></div>
        <div class="field"><label for="shN">Hauteur numéro</label><input class="input" type="number" id="shN" min="5" max="35" value="${sh.version==='dos'?S.style.numberHeight:S.style.chestHeight}"></div>
      </div>
      <div class="field"><span class="label">Emplacement</span><div class="seg" role="group"><button data-shv="dos" aria-pressed="${sh.version==='dos'}">Dos</button><button data-shv="poitrine" aria-pressed="${sh.version==='poitrine'}">Poitrine</button></div></div>
      <label class="switch"><span>Séparer numéro, nom et logo</span><input type="checkbox" id="shSplit" ${sh.split?'checked':''}></label>
      <label class="switch"><span>Rotation autorisée</span><input type="checkbox" id="shRot" ${sh.rotate?'checked':''}></label>
    </div></div>
    <div>
      <div class="sel-bar" id="selBar"></div>
      <div class="sheet-wrap" id="sheetWrap"></div>
    </div>
  </div></div>`;
  const rebuild=()=>{S.sheet.items=[]; optimizeSheet(); selId=null; drawSheet(); persist();};
  $$('[data-sh]').forEach(i=>i.onchange=()=>{ let v=+i.value; v=Math.min(+i.max,Math.max(+i.min,isNaN(v)?+i.min:v)); i.value=v; S.sheet[i.dataset.sh]=v; rebuild(); });
  $('#shN').onchange=e=>{const v=Math.min(35,Math.max(5,+e.target.value||20)); e.target.value=v; if(sh.version==='dos') S.style.numberHeight=v; else S.style.chestHeight=v; rebuild();};
  $$('[data-shv]').forEach(b=>b.onclick=()=>{S.sheet.version=b.dataset.shv; viewSheet(); rebuild();});
  $('#shSplit').onchange=e=>{S.sheet.split=e.target.checked; rebuild();};
  $('#shRot').onchange=e=>{S.sheet.rotate=e.target.checked; rebuild();};
  $('#optBtn').onclick=()=>{ S.sheet.items=S.sheet.items.map(i=>({...i})); optimizeSheet(); selId=null; drawSheet(); persist(); toast('Planche réoptimisée'); };
  $('#dlSheet').onclick=()=>{ const s=sheetStats(); if(badItems().size){toast('Des éléments se chevauchent ou dépassent : corrigez-les ou relancez l\'optimisation.','warn');return}
    const n=`JERSEYDTF_${slug(S.team.name)}_PLANCHE_${String(S.sheetsCount).padStart(2,'0')}.png`;
    S.files.unshift({name:n,size:`${Math.round(sh.w/2.54*300).toLocaleString('fr-FR')} × ${Math.round(sh.h/2.54*300).toLocaleString('fr-FR')} px`,date:today()}); persist();
    toast(`Export terminé : ${n} (${s.placed} éléments, 300 DPI)`,'ok',{label:'Mes fichiers',fn:()=>location.hash='#/app/fichiers'}); };
  drawSheet();
}
function drawSheet(){
  if(!players()) { $('#sheetWrap').innerHTML=`<div class="empty"><h2>Aucun joueur</h2><p>Ajoutez ou importez des joueurs pour générer une planche.</p><button class="btn btn-red" data-go="#/app/equipe">Gérer l'équipe</button></div>`; updStats(); return; }
  $('#sheetWrap').innerHTML=sheetSVG({selId, id:'sheetSvg'});
  updStats(); bindSheet();
}
const players=()=>S.team.players.length;
function updStats(){
  const s=sheetStats(), bad=badItems().size;
  $('#stOcc').textContent=s.occ.toFixed(0)+' %'; $('#stWaste').textContent=s.waste.toFixed(0)+' %'; $('#stMeter').style.width=Math.min(100,s.occ)+'%';
  $('#stPlaced').innerHTML=`${s.placed} / ${s.total} éléments placés${s.off?` · <b style="color:var(--err)">${s.off} hors planche</b> <button class="link" id="autoLen">Allonger la planche automatiquement</button>`:''}${bad?` · <b style="color:var(--err)">${bad} en conflit</b>`:''}`;
  const al=$('#autoLen'); if(al) al.onclick=()=>{ const sh=S.sheet, h0=sh.h; let h=sh.h;
    while(h<500){ h+=10; sh.h=h; optimizeSheet(); if(!sheetStats().off) break; }
    $('#shH').value=sh.h; selId=null; drawSheet(); persist(); updStatus();
    toast(sheetStats().off?`Planche portée à ${sh.h} cm : certains éléments restent trop grands.`:`Planche allongée de ${h0} à ${sh.h} cm : tous les éléments sont placés.`, sheetStats().off?'warn':'ok'); };
  const it=S.sheet.items.find(i=>i.id===selId);
  $('#selBar').innerHTML = it ? `<span class="small"><b>${esc(S.team.players[it.pi]?.name||'')} #${esc(S.team.players[it.pi]?.number||'')}</b> · ${it.parts.number&&it.parts.name?'bloc':it.parts.number?'numéro':it.parts.name?'nom':'logo'} · ${(it.rot?it.h:it.w).toFixed(1)} × ${(it.rot?it.w:it.h).toFixed(1)} cm</span>
     <button class="btn btn-ghost btn-sm" id="selRot">Tourner 90°</button><button class="btn btn-ghost btn-sm" id="selDup">Ajouter une copie</button><button class="btn btn-ghost btn-sm" id="selDel">Supprimer</button>`
    : `<span class="small muted">Sélectionnez un élément pour le tourner, le dupliquer ou le supprimer.</span>`;
  if(it){
    $('#selRot').onclick=()=>{it.rot=it.rot?0:90; drawSheet(); persist();};
    $('#selDel').onclick=()=>{const i=S.sheet.items.indexOf(it); S.sheet.items.splice(i,1); selId=null; drawSheet(); persist(); toast('Élément supprimé','ok',{label:'Annuler',fn:()=>{S.sheet.items.splice(i,0,it);drawSheet();persist()}});};
    $('#selDup').onclick=()=>{ const c={...it,id:'i'+Math.random().toString(36).slice(2,9), x:null,y:null}; S.sheet.items.push(c); optimizeSheet(); selId=null; drawSheet(); persist(); toast('Copie ajoutée et planche réoptimisée'); };
  }
}
function bindSheet(){
  const svg=$('#sheetSvg'); if(!svg) return;
  const pt=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())};
  svg.addEventListener('pointerdown',e=>{
    const g=e.target.closest('.item'); 
    if(!g){ if(selId){selId=null;drawSheet()} return; }
    const it=S.sheet.items.find(i=>i.id===g.dataset.id), p=pt(e);
    selId=it.id; $$('.item',svg).forEach(x=>x.classList.toggle('sel',x===g)); updStats();
    drag={it,g,dx:p.x-it.x,dy:p.y-it.y,moved:false}; svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove',e=>{
    if(!drag) return; const p=pt(e), it=drag.it;
    it.x=Math.round((p.x-drag.dx)*2)/2; it.y=Math.round((p.y-drag.dy)*2)/2; drag.moved=true;
    drag.g.setAttribute('transform', it.rot?`translate(${it.x+it.h} ${it.y}) rotate(90)`:`translate(${it.x} ${it.y})`);
  });
  const end=()=>{ if(drag&&drag.moved){ drawSheet(); persist(); } drag=null; };
  svg.addEventListener('pointerup',end); svg.addEventListener('pointercancel',end);
}



/* ======================= ROUTAGE ======================= */
function route(){
  const h=location.hash||'#/', isApp=h.startsWith('#/app');
  $('#view-home').classList.toggle('hidden',isApp);
  $('#siteHead').classList.toggle('hidden',isApp);
  $('#view-app').classList.toggle('hidden',!isApp);
  $('#mnav').classList.remove('open'); $('#burger').setAttribute('aria-expanded','false');
  $('#menu').classList.add('hidden');
  if(route.last!==h){ window.scrollTo(0,0); route.last=h; }
  if(!isApp){ stopDemo(); renderHero(); startDemo(); return; }
  document.documentElement.style.setProperty('--appbar-h', $('.appbar').offsetHeight+'px');
  stopDemo();
  const r=h.split('/')[2]||'dashboard';
  $$('.tab').forEach(b=>b.toggleAttribute('aria-current',false));
  const t=$(`.tab[data-route="${r}"]`); if(t) t.setAttribute('aria-current','page');
  ({dashboard:viewDashboard, creer:viewCreate, creations:viewCreations, equipe:viewTeam, planche:viewSheet, fichiers:viewFiles}[r]||viewDashboard)();
  updStatus();
}
document.addEventListener('click',e=>{
  const go=e.target.closest('[data-go]'); if(go){ e.preventDefault(); if(location.hash===go.dataset.go) route(); else location.hash=go.dataset.go; window.scrollTo(0,0); return; }
  const sc=e.target.closest('[data-scroll]'); if(sc){ e.preventDefault(); const target=sc.dataset.scroll;
    const doScroll=()=>document.getElementById(target)?.scrollIntoView({behavior:'smooth'});
    if((location.hash||'#/').startsWith('#/app')){ location.hash='#/'; setTimeout(doScroll,60);} else doScroll();
    $('#mnav').classList.remove('open'); return; }
  if(!e.target.closest('.avatar')) $('#menu').classList.add('hidden');
});
$('#burger').onclick=()=>{const o=$('#mnav').classList.toggle('open'); $('#burger').setAttribute('aria-expanded',o)};
$$('.themeBtn').forEach(b=>b.onclick=()=>{const r=document.documentElement; r.dataset.theme = r.dataset.theme==='light'?'dark':'light'; try{localStorage.setItem('jerseydtf-theme',r.dataset.theme)}catch(e){} if(location.hash.includes('creer')) drawStage();});
try{ const th=localStorage.getItem('jerseydtf-theme'); if(th) document.documentElement.dataset.theme=th; }catch(e){}
$('#avatarBtn').onclick=()=>{const m=$('#menu'); m.classList.toggle('hidden'); $('#avatarBtn').setAttribute('aria-expanded',!m.classList.contains('hidden'));};
$('#newBtn').onclick=newFlocage;
document.addEventListener('keydown',e=>{ if(e.key==='Escape') $('#menu').classList.add('hidden'); });
window.addEventListener('hashchange',route);
window.addEventListener('resize',()=>{ const ab=$('.appbar'); if(ab&&ab.offsetHeight) document.documentElement.style.setProperty('--appbar-h',ab.offsetHeight+'px'); });

initHome(); initImport(); route();
document.fonts && document.fonts.ready.then(()=>{ for(const k in mCache) delete mCache[k]; route(); });
