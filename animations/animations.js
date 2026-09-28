/* Cinematic scene choreography: calm camera language, responsive transitions, light interaction. */
(function(){
  'use strict';
  if(!window.gsap||!window.ScrollTrigger)return;
  gsap.registerPlugin(ScrollTrigger);
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine=window.matchMedia&&window.matchMedia('(pointer: fine)');
  if(reduce&&reduce.matches)return;
  var CFG=null,SCENES=null,booted=false,hud=null,wash=null,current=-1;
  var q=function(s,r){return (r||document).querySelector(s)};
  var qa=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var clamp=function(v,a,b){return Math.min(b,Math.max(a,v))};

  function style(){
    var s=document.createElement('style');s.id='cinematic-style';s.textContent=`
      :root{--scene-mx:50vw;--scene-my:50vh;--scene-energy:0}
      .scene::before{content:"";position:absolute;inset:-18%;z-index:0;pointer-events:none;opacity:calc(.05 + var(--scene-energy)*.17);background:radial-gradient(circle at var(--scene-mx) var(--scene-my),rgba(255,255,255,.09),transparent 0 16%,rgba(255,255,255,.018) 35%,transparent 68%);filter:blur(16px);transform:translateZ(0)}
      .cinematic-aura{position:absolute;inset:-14%;z-index:0;pointer-events:none;overflow:visible}.cinematic-aura span{position:absolute;display:block;border-radius:999px;will-change:transform,opacity}.cinematic-aura__a{width:min(48vw,700px);height:min(48vw,700px);top:-16%;left:-10%;background:radial-gradient(circle,rgba(255,255,255,.07),transparent 69%);filter:blur(30px)}.cinematic-aura__b{width:min(38vw,540px);height:min(38vw,540px);right:-5%;bottom:-17%;background:radial-gradient(circle,rgba(255,255,255,.045),transparent 70%);filter:blur(30px)}.cinematic-aura__line{left:5%;right:5%;top:50%;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.11),transparent);transform:scaleX(.35);opacity:0}
      .cinematic-wash{position:fixed;inset:-10%;z-index:95;pointer-events:none;opacity:0;background:radial-gradient(circle at var(--scene-mx) var(--scene-my),rgba(255,255,255,.08),transparent 34%),linear-gradient(180deg,rgba(255,255,255,.015),transparent 46%,rgba(255,255,255,.018));mix-blend-mode:screen;filter:blur(9px);will-change:transform,opacity}
      .story-hud{position:fixed;right:24px;bottom:28px;z-index:120;display:flex;align-items:center;gap:11px;font:800 10px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.16em;color:#777;pointer-events:none;mix-blend-mode:screen}.story-hud b{color:#fff}.story-hud__bar{width:58px;height:1px;background:rgba(255,255,255,.16);position:relative;overflow:hidden}.story-hud__bar i{position:absolute;inset:0;background:#fff;transform-origin:left;transform:scaleX(0)}
      .cinematic-pointer{position:fixed;left:0;top:0;z-index:500;pointer-events:none;opacity:0}.cinematic-pointer__dot{position:absolute;width:4px;height:4px;border-radius:50%;background:#fff;transform:translate(-50%,-50%);box-shadow:0 0 16px rgba(255,255,255,.85)}.cinematic-pointer__ring{position:absolute;width:34px;height:34px;border:1px solid rgba(255,255,255,.62);border-radius:50%;transform:translate(-50%,-50%);transition:width .24s ease,height .24s ease,border-color .24s ease,background .24s ease}.cinematic-pointer__hint{position:absolute;left:24px;top:15px;font:800 8px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.14em;color:#aaa;opacity:0;transform:translateY(4px);transition:opacity .2s ease,transform .2s ease;white-space:nowrap}.cinematic-pointer.is-hot .cinematic-pointer__ring{width:50px;height:50px;background:rgba(255,255,255,.035);border-color:rgba(255,255,255,.92)}.cinematic-pointer.is-hot .cinematic-pointer__hint{opacity:1;transform:translateY(0)}
      .nav-link.is-active{opacity:1}.nav-link.is-active::after{transform:scaleX(1)}
      .section-copy,.hero-inner,.visual .card{transform-style:preserve-3d}.hero h1,.section h2{perspective:900px}.cinematic-char{display:inline-block;will-change:transform,opacity,filter}.cinematic-word{display:inline-block;overflow:clip;vertical-align:top;padding:.05em .04em .12em;margin:-.05em -.04em -.12em}
      .visual{will-change:transform}.visual .card{will-change:transform}.section{--scene-energy:0}
      @media(max-width:820px){.story-hud{right:14px;bottom:62px}.cinematic-aura{inset:-24%}}@media(pointer:coarse){.cinematic-pointer{display:none}.scene::before{opacity:.035}}@media(prefers-reduced-motion:reduce){.cinematic-wash,.cinematic-pointer{display:none!important}}
    `;document.head.appendChild(s)
  }
  function addAuras(sec){if(q('.cinematic-aura',sec))return;var a=document.createElement('div');a.className='cinematic-aura';a.setAttribute('aria-hidden','true');['cinematic-aura__a','cinematic-aura__b','cinematic-aura__line'].forEach(function(c){var s=document.createElement('span');s.className=c;a.appendChild(s)});sec.classList.add('scene');sec.insertBefore(a,sec.firstChild)}
  function split(el){
    if(!el||el.dataset.cinematicSplit)return qa('.cinematic-char',el);
    el.setAttribute('aria-label',el.textContent.replace(/\s+/g,' ').trim());
    Array.prototype.slice.call(el.childNodes).forEach(function(n){
      if(n.nodeType!==3)return;var frag=document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(function(tok){if(!tok)return;if(/^\s+$/.test(tok)){frag.appendChild(document.createTextNode(' '));return}
        var w=document.createElement('span');w.className='cinematic-word';w.setAttribute('aria-hidden','true');tok.split('').forEach(function(ch){var c=document.createElement('span');c.className='cinematic-char';c.textContent=ch;w.appendChild(c)});frag.appendChild(w)
      });n.parentNode.replaceChild(frag,n)
    });el.dataset.cinematicSplit='1';return qa('.cinematic-char',el)
  }
  function hudBuild(){hud=document.createElement('div');hud.className='story-hud';hud.setAttribute('aria-hidden','true');hud.innerHTML='<b>00</b><span class="story-hud__bar"><i></i></span><span class="story-hud__name">INTRO</span>';document.body.appendChild(hud);hud.n=q('b',hud);hud.i=q('.story-hud__bar i',hud);hud.t=q('.story-hud__name',hud)}
  function hudSet(i,p){if(!hud||!SCENES[i])return;if(current!==i){current=i;hud.n.textContent=SCENES[i].n;hud.t.textContent=SCENES[i].name;gsap.fromTo([hud.n,hud.t],{y:7,opacity:0},{y:0,opacity:1,duration:.38,ease:'power3.out',overwrite:true})}gsap.set(hud.i,{scaleX:clamp(p,0,1)})}
  function flash(dir){if(!wash)return;gsap.killTweensOf(wash);gsap.set(wash,{xPercent:dir>0?-7:7,opacity:0});gsap.timeline().to(wash,{xPercent:0,opacity:.25,duration:.24,ease:'power3.out'}).to(wash,{opacity:0,duration:.72,ease:'power2.in'})}
  function hero(){
    var hero=q('.hero'),inner=q('.hero-inner',hero);if(!inner)return;
    var eb=q('.eyebrow',inner),h1=q('h1',inner),desc=q('p',inner),chars=split(h1),glows=qa('.parallax-layer',hero);
    gsap.set(eb,{opacity:0,y:14,filter:'blur(7px)'});gsap.set(chars,{yPercent:105,rotateX:52,rotateZ:5,opacity:0,filter:'blur(7px)',transformOrigin:'50% 100%',transformPerspective:850});gsap.set(desc,{opacity:0,y:22,filter:'blur(8px)'});gsap.set(glows,{scale:.88,opacity:0});
    gsap.timeline({delay:.12,defaults:{ease:'power3.out'}}).to(glows,{opacity:.75,scale:1,duration:1.1,stagger:.09},0).to(eb,{opacity:1,y:0,filter:'blur(0px)',duration:.65},.04).to(chars,{yPercent:0,rotateX:0,rotateZ:0,opacity:1,filter:'blur(0px)',duration:.9,stagger:.034,ease:'power4.out'},.16).to(desc,{opacity:1,y:0,filter:'blur(0px)',duration:.75},.68);
    ScrollTrigger.create({trigger:hero,start:'top top',end:'bottom top',scrub:.55,onUpdate:function(self){var p=self.progress;hudSet(0,p);document.documentElement.style.setProperty('--scene-energy',(Math.sin(p*Math.PI)*.65).toFixed(3));gsap.set(inner,{y:p*16,scale:1-p*.045,filter:'blur('+(p*3).toFixed(2)+'px)',opacity:1-p*.42})}})
  }
  function section(sec,index,wash){
    addAuras(sec);var grid=q('.section-grid',sec);if(!grid)return;var cols=qa(':scope > div',grid);var title=q('h2',sec),desc=q('p',sec),chars=split(title);var a=q('.cinematic-aura__a',sec),b=q('.cinematic-aura__b',sec),line=q('.cinematic-aura__line',sec);var dir=index%2?-1:1;
    gsap.set(cols,{x:dir*42,y:28,scale:1.045,rotation:dir*1.9,opacity:0,filter:'blur(9px)'});gsap.set(chars,{yPercent:108,rotateX:52,rotateZ:dir*3,opacity:0,filter:'blur(6px)',transformPerspective:900,transformOrigin:'50% 100%'});gsap.set(desc,{y:25,opacity:0,filter:'blur(6px)'});gsap.set([a,b],{scale:.72,opacity:0});gsap.set(line,{scaleX:.35,opacity:0});
    var tl=gsap.timeline({scrollTrigger:{trigger:sec,start:CFG.scene.start,end:CFG.scene.end,scrub:CFG.scene.scrub,onEnter:function(){flash(dir)},onEnterBack:function(){flash(-dir)},onUpdate:function(self){var p=self.progress;hudSet(index,p);sec.style.setProperty('--scene-energy',(Math.sin(p*Math.PI)*.9).toFixed(3));qa('.nav-link').forEach(function(x){x.classList.remove('is-active')});var nav=q('.nav-link[href="#'+sec.id+'"]');if(nav)nav.classList.add('is-active')}}});
    var enter=CFG.scene.enterEnd,hold=CFG.scene.holdEnd;
    tl.to([a,b],{scale:1,opacity:.72,duration:enter,ease:'power3.out'},0).to(line,{scaleX:1,opacity:.25,duration:enter,ease:'power2.out'},0)
      .to(cols[0],{x:0,y:0,scale:CFG.scene.settle.scale,rotation:0,opacity:1,filter:'blur(0px)',duration:enter,ease:'power3.out'},0)
      .to(cols[1],{x:0,y:0,scale:CFG.scene.settle.scale,rotation:0,opacity:1,filter:'blur(0px)',duration:enter+.025,ease:'power3.out'},.018)
      .to(chars,{yPercent:0,rotateX:0,rotateZ:0,opacity:1,filter:'blur(0px)',duration:.2,stagger:CFG.scene.title.stagger,ease:'power4.out'},.08)
      .to(desc,{y:0,opacity:1,filter:'blur(0px)',duration:.18,ease:'power2.out'},.15)
      .to(grid,{y:-5,scale:1.005,duration:hold-enter,ease:'sine.inOut'},enter)
      .to([a,b],{scale:1.06,x:dir*14,y:-8,duration:hold-enter,ease:'sine.inOut'},enter)
      .to(cols[0],{x:dir*CFG.scene.exit.x,y:-CFG.scene.exit.y,scale:CFG.scene.exit.scale,opacity:.22,filter:'blur('+CFG.scene.exit.blur+'px)',duration:1-hold,ease:'power2.in'},hold)
      .to(cols[1],{x:-dir*CFG.scene.exit.x,y:CFG.scene.exit.y,scale:CFG.scene.exit.scale,opacity:.18,filter:'blur('+(CFG.scene.exit.blur+1)+'px)',duration:1-hold,ease:'power2.in'},hold)
      .to(chars,{yPercent:-102,rotateX:45,rotateZ:-dir*2,opacity:0,filter:'blur(5px)',duration:.18,stagger:.009,ease:'power2.in'},hold+.015)
      .to(desc,{y:-14,opacity:.12,filter:'blur(4px)',duration:.25,ease:'power2.in'},hold+.05)
      .to([a,b],{scale:.82,opacity:0,duration:1-hold,ease:'power2.in'},hold)
  }
  function interactions(){
    if(!fine||!fine.matches)return;
    var ui=document.createElement('div');ui.className='cinematic-pointer';ui.setAttribute('aria-hidden','true');ui.innerHTML='<span class="cinematic-pointer__dot"></span><span class="cinematic-pointer__ring"></span><span class="cinematic-pointer__hint"></span>';document.body.appendChild(ui);
    var ring=q('.cinematic-pointer__ring',ui),dot=q('.cinematic-pointer__dot',ui),hint=q('.cinematic-pointer__hint',ui);var rx=gsap.quickTo(ring,'x',{duration:.35,ease:'power3.out'}),ry=gsap.quickTo(ring,'y',{duration:.35,ease:'power3.out'}),dx=gsap.quickTo(dot,'x',{duration:.09,ease:'power2.out'}),dy=gsap.quickTo(dot,'y',{duration:.09,ease:'power2.out'});
    document.addEventListener('pointermove',function(e){ui.style.opacity='1';rx(e.clientX);ry(e.clientY);dx(e.clientX);dy(e.clientY);document.documentElement.style.setProperty('--scene-mx',e.clientX+'px');document.documentElement.style.setProperty('--scene-my',e.clientY+'px')},{passive:true});
    qa('a,.visual,.card').forEach(function(node){node.addEventListener('pointerenter',function(){ui.classList.add('is-hot');hint.textContent=node.matches('a')?'OPEN':'EXPLORE'});node.addEventListener('pointerleave',function(){ui.classList.remove('is-hot');hint.textContent=''})});
    qa('h1 .cinematic-char,h2 .cinematic-char').forEach(function(ch){ch.addEventListener('pointerenter',function(){gsap.to(ch,{y:-6,rotateZ:(Math.random()-.5)*3,duration:.28,ease:'back.out(2.6)',overwrite:true})});ch.addEventListener('pointerleave',function(){gsap.to(ch,{y:0,rotateZ:0,duration:.35,ease:'power3.out',overwrite:true})})});
    var visual=q('.visual'),card=q('.visual .card');if(visual)visual.addEventListener('pointermove',function(e){var r=visual.getBoundingClientRect(),cx=(e.clientX-(r.left+r.width/2))/(r.width/2),cy=(e.clientY-(r.top+r.height/2))/(r.height/2);gsap.to(visual,{rotationY:cx*2.8,rotationX:-cy*2.8,transformPerspective:950,duration:.45,ease:'power3.out',overwrite:true})});if(visual)visual.addEventListener('pointerleave',function(){gsap.to(visual,{rotationY:0,rotationX:0,duration:.65,ease:'power3.out',overwrite:true})});if(card)card.addEventListener('pointermove',function(e){var r=card.getBoundingClientRect(),cx=(e.clientX-(r.left+r.width/2))/(r.width/2),cy=(e.clientY-(r.top+r.height/2))/(r.height/2);gsap.to(card,{x:cx*6,y:cy*5,rotationY:cx*2,rotationX:-cy*2,duration:.35,ease:'power3.out',overwrite:true})});if(card)card.addEventListener('pointerleave',function(){gsap.to(card,{x:0,y:0,rotationY:0,rotationX:0,duration:.5,ease:'power3.out',overwrite:true})});
    document.addEventListener('pointerdown',function(e){var r=document.createElement('span');r.style.cssText='position:fixed;left:'+e.clientX+'px;top:'+e.clientY+'px;width:10px;height:10px;margin:-5px;border:1px solid rgba(255,255,255,.48);border-radius:50%;pointer-events:none;z-index:499';document.body.appendChild(r);gsap.to(r,{scale:5,opacity:0,duration:.6,ease:'power2.out',onComplete:function(){r.remove()}})},{passive:true});
  }
  function build(){if(booted||!CFG||!q('.hero')||!q('#blur'))return;booted=true;style();hudBuild();wash=document.createElement('div');wash.className='cinematic-wash';document.body.appendChild(wash);SCENES=CFG.scenes;hero();SCENES.forEach(function(sc,i){if(!sc.hero&&q(sc.sel))section(q(sc.sel),i,wash)});interactions();ScrollTrigger.refresh()}
  fetch('animations/scene-config.json',{cache:'no-cache'}).then(function(r){return r.json()}).then(function(data){CFG=data;var root=document.getElementById('root');if(!build()&&root){var mo=new MutationObserver(function(){if(build())mo.disconnect()});mo.observe(root,{childList:true,subtree:true})}window.addEventListener('load',function(){ScrollTrigger.refresh()},{once:true});if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){ScrollTrigger.refresh()})}).catch(function(e){console.error('Cinematic config:',e)})
})();
