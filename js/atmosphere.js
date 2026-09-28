/* Cinematic atmosphere: sparse floating dust + low-frequency moving light field. */
(function () {
  "use strict";
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)");if(reduce&&reduce.matches)return;
  var DPR_CAP=1.15,FPS=24,FRAME_MS=1000/FPS,canvas=document.createElement("canvas");
  canvas.id="atmosphereCanvas";canvas.className="atmosphere-canvas";canvas.setAttribute("aria-hidden","true");
  var ctx=canvas.getContext("2d",{alpha:true});if(!ctx)return;
  document.body.appendChild(canvas);
  var width=1,height=1,dpr=1,raf=0,last=0,running=!document.hidden,dust=[],lights=[];
  function rnd(a,b){return a+Math.random()*(b-a)} function clamp(v,a,b){return Math.min(b,Math.max(a,v))}
  function seedDust(){var mobile=width<820,count=mobile?22:40;dust=[];for(var i=0;i<count;i++)dust.push({x:rnd(-20,width+20),y:rnd(-20,height+20),vx:rnd(-.28,.30),vy:rnd(-.16,.18),size:rnd(.42,1.25),alpha:rnd(.045,.15),phase:rnd(0,Math.PI*2),freq:rnd(.00018,.00048),depth:rnd(.45,1)})}
  function seedLights(){lights=[{x:.18,y:.16,r:.22,a:.035,sx:.035,sy:.022,speed:.00011,phase:.2},{x:.82,y:.34,r:.18,a:.028,sx:.045,sy:.030,speed:.000085,phase:2.1},{x:.48,y:.88,r:.25,a:.020,sx:.032,sy:.045,speed:.00007,phase:4.3}]}
  function resize(){width=Math.max(1,innerWidth);height=Math.max(1,innerHeight);dpr=Math.min(devicePixelRatio||1,DPR_CAP);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=width+"px";canvas.style.height=height+"px";ctx.setTransform(dpr,0,0,dpr,0,0);seedDust();seedLights()}
  function wrap(p){if(p.x<-12)p.x=width+12;else if(p.x>width+12)p.x=-12;if(p.y<-12)p.y=height+12;else if(p.y>height+12)p.y=-12}
  function render(now){raf=0;if(!running||(reduce&&reduce.matches))return;if(now-last<FRAME_MS){raf=requestAnimationFrame(render);return}var dt=clamp((now-(last||now))/16.6667,.6,2.2);last=now;ctx.clearRect(0,0,width,height);
    for(var i=0;i<lights.length;i++){var l=lights[i],t=now*l.speed+l.phase,x=(l.x+Math.sin(t)*l.sx)*width,y=(l.y+Math.cos(t*.83)*l.sy)*height,rad=Math.min(width,height)*l.r,pulse=.94+Math.sin(t*1.17)*.06,g=ctx.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,"rgba(255,255,255,"+(l.a*pulse).toFixed(4)+")");g.addColorStop(.34,"rgba(255,255,255,"+(l.a*.28*pulse).toFixed(4)+")");g.addColorStop(1,"rgba(255,255,255,0)");ctx.fillStyle=g;ctx.fillRect(x-rad,y-rad,rad*2,rad*2)}
    for(var d=0;d<dust.length;d++){var p=dust[d],q=now*p.freq+p.phase;p.x+=(p.vx*p.depth+Math.sin(q*1.31)*.065)*dt;p.y+=(p.vy*p.depth+Math.cos(q*.91)*.045)*dt;wrap(p);var tw=.72+.28*((Math.sin(q*1.6)+1)*.5);ctx.fillStyle="rgba(255,255,255,"+(p.alpha*tw).toFixed(4)+")";ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill()}
    raf=requestAnimationFrame(render)}
  resize();if(running)raf=requestAnimationFrame(render);addEventListener("resize",resize,{passive:true});document.addEventListener("visibilitychange",function(){running=!document.hidden;if(running){last=performance.now();if(!raf)raf=requestAnimationFrame(render)}else if(raf){cancelAnimationFrame(raf);raf=0}},{passive:true});
  if(reduce&&reduce.addEventListener)reduce.addEventListener("change",function(e){if(e.matches){if(raf)cancelAnimationFrame(raf);canvas.remove()}else{document.body.appendChild(canvas);running=true;last=performance.now();raf=requestAnimationFrame(render)}});
})();
