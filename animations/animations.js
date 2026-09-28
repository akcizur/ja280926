/* SCROLL STORY — GSAP + ScrollTrigger. Center hold is the key correction. */
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  gsap.registerPlugin(ScrollTrigger);

  var CFG = null, T = null, SCENES = null;
  var REST = { opacity:1,x:0,y:0,xPercent:0,yPercent:0,rotation:0,rotationX:0,skewX:0,scale:1,filter:"blur(0px)" };
  function restFor(v){var o={};for(var k in v)if(k in REST)o[k]=REST[k];return o;}
  var PRESETS={
    giant:function(c,sg){var ex=CFG.exit;return{
      from:{opacity:0,x:sg*c.dx+"vw",y:sg*c.dy+"vh",rotation:sg*c.rot,scale:c.s0,filter:"blur("+c.blur+"px)"},
      to:{opacity:0,x:-.32*sg*c.dx+"vw",y:-.32*sg*c.dy+"vh",rotation:-.35*sg*c.rot,scale:ex.scale,filter:"blur("+ex.blurPx+"px)"}
    };}
  };
  function rnd(a,b){return a+Math.random()*(b-a);}
  function bezier(x1,y1,x2,y2){
    function cx(t){return 3*x1*t*(1-t)*(1-t)+3*x2*t*t*(1-t)+t*t*t;}
    function cy(t){return 3*y1*t*(1-t)*(1-t)+3*y2*t*t*(1-t)+t*t*t;}
    return function(x){if(x<=0)return 0;if(x>=1)return 1;var lo=0,hi=1,t=x;for(var i=0;i<24;i++){t=(lo+hi)/2;if(cx(t)<x)lo=t;else hi=t;}return cy(t);};
  }
  function cfg(deg,mobile){
    var a=deg*Math.PI/180,r=rnd(CFG.radius[0],CFG.radius[1]),ec=CFG.easeControlPoints;
    return{dx:Math.cos(a)*r*100*CFG.horizontalBias,dy:Math.sin(a)*r*100,rot:rnd(CFG.rotationDeg[0],CFG.rotationDeg[1]),s0:rnd(CFG.startScale[0],CFG.startScale[1]),blur:mobile?CFG.blurPx.mobile:CFG.blurPx.desktop,ez:bezier(rnd(ec.x1[0],ec.x1[1]),rnd(ec.y1[0],ec.y1[1]),rnd(ec.x2[0],ec.x2[1]),rnd(ec.y2[0],ec.y2[1]))};
  }
  function split(el){
    if(!el)return[];
    if(!el.dataset.split){
      el.setAttribute("aria-label",el.textContent.replace(/\s+/g," ").trim());
      Array.prototype.slice.call(el.childNodes).forEach(function(n){
        if(n.nodeType!==3)return;
        var frag=document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function(tok){
          if(!tok)return;
          if(/^\s+$/.test(tok)){frag.appendChild(document.createTextNode(" "));return;}
          var w=document.createElement("span");w.className="w";w.setAttribute("aria-hidden","true");
          tok.split("").forEach(function(ch){var c=document.createElement("span");c.className="c";c.textContent=ch;w.appendChild(c);});
          frag.appendChild(w);
        });
        el.replaceChild(frag,n);
      });
      el.dataset.split="1";
    }
    return el.querySelectorAll(".c");
  }

  var hudN,hudT,setBar,cur=-1;
  function makeHud(){
    var css=document.createElement("style");
    css.textContent=".w{display:inline-block;overflow:clip;vertical-align:top;padding:.06em .06em .14em;margin:-.06em -.06em -.14em}.c{display:inline-block;will-change:transform}.section-grid.is-center-held{will-change:transform}.visual{content-visibility:visible}.story-hud{position:fixed;left:24px;bottom:28px;z-index:120;display:flex;align-items:center;gap:12px;font-size:10px;font-weight:700;letter-spacing:.16em;color:#9d9d9d;pointer-events:none}.story-hud b{color:#fff;font-weight:800}.story-hud__bar{position:relative;width:64px;height:1px;background:rgba(255,255,255,.18);overflow:hidden}.story-hud__bar i{position:absolute;inset:0;background:#fff;transform-origin:0 50%;transform:scaleX(0)}.story-hud__t{display:inline-block;overflow:hidden;height:1.3em;line-height:1.3em}.story-hud__t span{display:block}@media(max-width:820px){.story-hud{left:14px;bottom:66px}}@media print{.story-hud{display:none}}";
    document.head.appendChild(css);
    var hud=document.createElement("div");hud.className="story-hud";hud.setAttribute("aria-hidden","true");
    hud.innerHTML='<b>00</b><span class="story-hud__bar"><i></i></span><span class="story-hud__t"><span>INTRO</span></span>';
    document.body.appendChild(hud);hudN=hud.querySelector("b");hudT=hud.querySelector(".story-hud__t span");setBar=gsap.quickSetter(hud.querySelector("i"),"scaleX");
  }
  function setScene(i){if(i===cur)return;cur=i;hudN.textContent=SCENES[i].n;hudT.textContent=SCENES[i].name;gsap.fromTo(hudT,{yPercent:100,opacity:0},{yPercent:0,opacity:1,duration:.5,ease:"power3.out",overwrite:true});gsap.fromTo(hudN,{opacity:0},{opacity:1,duration:.4,overwrite:true});}
  function intro(){
    var hero=document.querySelector(".hero");if(!hero)return;
    var eb=hero.querySelector(".eyebrow"),chars=split(hero.querySelector("h1")),p=hero.querySelector(".hero-inner > p");
    gsap.timeline({delay:.15,defaults:{ease:"power3.out"}}).fromTo(eb,{opacity:0,y:18,filter:"blur(8px)"},{opacity:1,y:0,filter:"blur(0px)",duration:.8})
      .fromTo(chars,{yPercent:118,rotate:8,opacity:0},{yPercent:0,rotate:0,opacity:1,duration:1.05,stagger:.028},"-=.45")
      .fromTo(p,{opacity:0,y:28,filter:"blur(10px)"},{opacity:1,y:0,filter:"blur(0px)",duration:1},"-=.6");
  }
  function heroExit(hero,c){var v=PRESETS.giant(c,1),kids=hero.querySelectorAll(".hero-inner > *");gsap.timeline({scrollTrigger:{trigger:hero,start:"top top",end:"bottom top",scrub:.4}}).fromTo(kids,restFor(v.to),Object.assign({},v.to,{ease:c.ez,duration:.85,stagger:.06,immediateRender:false}),.15);}
  function article(sec,sc,c){
    var make=PRESETS[sc.preset],tl=gsap.timeline({defaults:{ease:"none"},scrollTrigger:{trigger:sec,start:"top bottom",end:"bottom top",scrub:.4}});
    tl.addLabel("enter",T.enter).addLabel("hold",T.hold).addLabel("exit",T.exit).to({},{duration:1},0);
    sec.querySelectorAll(".section-grid > div").forEach(function(col,k){
      var sg=k?-1:1,v=make(c,sg),lag=k*.03,st=CFG.settle;
      tl.fromTo(col,v.from,Object.assign({},REST,{scale:st.overshootScale,ease:c.ez,duration:.3-st.duration}),"enter+="+lag)
        .to(col,{scale:1,ease:"back.out(2.6)",duration:st.duration},"enter+"+(lag+.3-st.duration))
        .fromTo(col,restFor(v.to),Object.assign({},v.to,{ease:"power2.in",duration:.34,immediateRender:false}),"exit+="+lag);
    });
    var chars=split(sec.querySelector("h2")),pp=sec.querySelector("p");
    tl.fromTo(chars,{yPercent:118,rotate:7,opacity:0},{yPercent:0,rotate:0,opacity:1,ease:"power3.out",duration:.14,stagger:.012},"enter+=.1")
      .fromTo(chars,{yPercent:0,opacity:1},{yPercent:-110,opacity:0,ease:"power2.in",duration:.12,stagger:{each:.01,from:"end"},immediateRender:false},"exit")
      .fromTo(pp,{y:34,opacity:0},{y:0,opacity:1,ease:"power2.out",duration:.16},"enter+=.14")
      .fromTo(pp,{y:0},{y:-18,duration:.32,immediateRender:false},"hold");
  }
  function centerHold(wrapper,mobile){
    if(!wrapper||!CFG.centerHold||CFG.centerHold.enabled===false)return;
    var s=CFG.centerHold;
    function clamp(v,min,max){return Math.min(max,Math.max(min,v));}
    function measureHold(){
      var rect=wrapper.getBoundingClientRect(),viewport=Math.max(1,window.innerHeight),ratio=clamp(rect.height/viewport,.35,1.25);
      var base=mobile?(s.mobileHoldPx||Math.round(s.holdPx*.65)):s.holdPx;
      var min=mobile?(s.mobileMinHoldPx||Math.round(s.minHoldPx*.7)):s.minHoldPx;
      var max=mobile?(s.mobileMaxHoldPx||Math.round(s.maxHoldPx*.72)):s.maxHoldPx;
      return Math.round(clamp(base+viewport*.14*(1-ratio),min,max));
    }
    var trigger=ScrollTrigger.create({trigger:wrapper,start:"center center",end:function(){return"+="+measureHold();},pin:wrapper,pinSpacing:true,anticipatePin:1,fastScrollEnd:false,invalidateOnRefresh:true,onToggle:function(self){wrapper.classList.toggle("is-center-held",self.isActive);}});
    var ro=typeof ResizeObserver==="function"?new ResizeObserver(function(){ScrollTrigger.refresh();}):null;if(ro)ro.observe(wrapper);
  }
  function visualScene(){
    var vis=document.querySelector(".visual");if(!vis)return;
    gsap.timeline({scrollTrigger:{trigger:vis,start:"top 95%",end:"top 35%",scrub:.4}})
      .fromTo(vis,{clipPath:"inset(100% 0% 0% 0% round 28px)"},{clipPath:"inset(0% 0% 0% 0% round 28px)",ease:"power3.inOut",duration:.7},0)
      .fromTo(vis.querySelectorAll(".card small,.card strong"),{opacity:0,y:24,filter:"blur(8px)"},{opacity:1,y:0,filter:"blur(0px)",ease:"power2.out",duration:.3,stagger:.1},.55);
  }
  function build(){
    var mobile=window.innerWidth<CFG.mobileBreakpoint,jit=CFG.directionJitterDeg;
    var dirs=[0,90,180,270].map(function(d){return d+rnd(jit[0],jit[1]);}).sort(function(){return Math.random()-.5;});
    SCENES.forEach(function(sc,i){
      var el=document.querySelector(sc.sel);if(!el)return;var c=cfg(dirs[i%4],mobile);
      ScrollTrigger.create({trigger:el,start:"top 60%",end:"bottom 60%",onToggle:function(self){if(self.isActive)setScene(i);},onUpdate:function(self){if(self.isActive)setBar(self.progress);}});
      if(sc.hero)heroExit(el,c);else{article(el,sc,c);centerHold(el.querySelector(".section-grid"),mobile);}
    });
    visualScene();
  }
  var booted=false;
  function start(){makeHud();setScene(0);document.querySelectorAll(".hero h1,.section h2").forEach(function(h){split(h);});intro();gsap.context(build);window.addEventListener("load",function(){ScrollTrigger.refresh();});if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){ScrollTrigger.refresh();});}
  function boot(){if(booted||!CFG||!document.getElementById("blur")||!document.querySelector(".hero h1"))return false;booted=true;start();return true;}
  fetch("animations/scene-config.json").then(function(r){return r.json();}).then(function(data){CFG=data;T=data.phases;SCENES=data.scenes;if(!boot()){var root=document.getElementById("root");if(root){var mo=new MutationObserver(function(){if(boot())mo.disconnect();});mo.observe(root,{childList:true,subtree:true});}}}).catch(function(err){console.error("scene-config.json se nepodařilo načíst:",err);});
})();
