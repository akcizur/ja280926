/*
 * RZ / Cinematic Edge Motion
 * Runtime is intentionally dependency-free; content is loaded from js/content.json.
 */
(function () {
  "use strict";

  var root = document.getElementById("root");
  if (!root) return;

  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia && window.matchMedia("(pointer: fine)");

  function setText(el, value) {
    el.textContent = value == null ? "" : String(value);
    return el;
  }

  function el(tag, className, attrs) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (attrs) Object.keys(attrs).forEach(function (key) {
      if (attrs[key] !== null && attrs[key] !== undefined) node.setAttribute(key, String(attrs[key]));
    });
    return node;
  }

  function titleBlock(number, title, parallax, depth) {
    var h2 = el("h2", "");
    h2.setAttribute("data-parallax", parallax);
    h2.setAttribute("data-depth", depth);
    h2.appendChild(document.createTextNode(number));
    h2.appendChild(document.createElement("br"));
    h2.appendChild(document.createTextNode(title));
    return h2;
  }

  function section(id, data, flipped) {
    var article = el("article", "section", { id: id });
    var grid = el("div", "section-grid");
    var left = el("div");
    var right = el("div");
    if (flipped) {
      left.appendChild(setText(el("p"), data.description));
      right.appendChild(titleBlock(data.number, data.title, "-0.055", "3"));
    } else {
      left.appendChild(titleBlock(data.number, data.title, "0.045", "2"));
      right.appendChild(setText(el("p"), data.description));
    }
    grid.append(left, right);
    article.appendChild(grid);
    return article;
  }

  function render(content) {
    document.title = content.meta && content.meta.title ? content.meta.title : "RUZICKAJAKUB";

    var fragment = document.createDocumentFragment();
    var grain = el("canvas", "film-grain", { id: "filmGrain", "aria-hidden": "true" });
    fragment.appendChild(grain);

    ["top", "bottom"].forEach(function (side) {
      var edge = el("div", "edge edge--" + side, { "aria-hidden": "true" });
      edge.append(el("div", "edge__haze"), el("div", "edge__glow"), el("div", "edge__shine"), el("div", "edge__mist"));
      fragment.appendChild(edge);
    });

    var progress = el("div", "scroll-progress", { "aria-hidden": "true" });
    progress.appendChild(el("span"));
    fragment.appendChild(progress);

    var nav = el("nav", "nav", { "aria-label": content.nav.ariaLabel });
    var navInner = el("div", "nav-inner");
    var brand = el("a", "brand", { href: "#top", "data-scroll-link": "true" });
    setText(brand, content.nav.brand);
    var navLinks = el("div", "nav-links");
    [
      ["#landing", content.nav.links.landing],
      ["#gradient", content.nav.links.gradient],
      ["#fade", content.nav.links.fade]
    ].forEach(function (item) {
      var a = el("a", "", { href: item[0], "data-scroll-link": "true" });
      setText(a, item[1]);
      navLinks.appendChild(a);
    });
    var live = el("span", "live-grain");
    live.append(el("span", "live-dot", { "aria-hidden": "true" }));
    live.appendChild(document.createTextNode(content.nav.liveLabel));
    navLinks.appendChild(live);
    navInner.append(brand, navLinks);
    nav.appendChild(navInner);
    fragment.appendChild(nav);

    var main = el("main", "", { id: "top" });
    var hero = el("section", "hero", { id: "landing" });
    var stage = el("div", "parallax-stage", { "aria-hidden": "true" });
    stage.append(
      el("div", "parallax-layer parallax-layer--1", { "data-parallax": "0.11", "data-depth": "1" }),
      el("div", "parallax-layer parallax-layer--2", { "data-parallax": "-0.18", "data-depth": "2" }),
      el("div", "parallax-layer parallax-layer--3", { "data-parallax": "0.28", "data-depth": "3" })
    );
    var heroInner = el("div", "hero-inner", { "data-parallax": "-0.03", "data-depth": "4" });
    setText(heroInner.appendChild(el("span", "eyebrow")), content.hero.eyebrow);
    var h1 = el("h1");
    [content.hero.title.line1, content.hero.title.line2, content.hero.title.line3].forEach(function (line, i) {
      if (i) h1.appendChild(document.createElement("br"));
      h1.appendChild(document.createTextNode(line));
    });
    heroInner.appendChild(h1);
    setText(heroInner.appendChild(el("p")), content.hero.description);
    hero.append(stage, heroInner);
    main.appendChild(hero);

    var demo = el("section", "demo");
    demo.append(
      section("blur", content.sections.blur, false),
      section("gradient", content.sections.gradient, true),
      section("fade", content.sections.fade, false)
    );
    var visual = el("div", "visual", { "data-parallax": "-0.025", "data-depth": "1" });
    var card = el("div", "card", { "data-parallax": "0.035", "data-depth": "2" });
    setText(card.appendChild(el("small")), content.card.label);
    setText(card.appendChild(el("strong")), content.card.value);
    visual.appendChild(card);
    demo.appendChild(visual);
    main.appendChild(demo);
    fragment.appendChild(main);

    var footer = el("footer", "footer");
    setText(footer.appendChild(el("span")), content.footer.primary);
    setText(footer.appendChild(el("em")), content.footer.secondary);
    fragment.appendChild(footer);

    root.replaceChildren(fragment);
    return grain;
  }

  function initFilmGrain(canvas) {
    if (!canvas || (reduce && reduce.matches)) return;
    var ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    var width = 1, height = 1, frames = [], frame = 0, last = 0, raf = 0;
    var frameMs = 1000 / 24;

    function resize() {
      width = Math.ceil((window.innerWidth + 100) * 0.5);
      height = Math.ceil((window.innerHeight + 100) * 0.5);
      canvas.width = width; canvas.height = height; frames = [];
      for (var i = 0; i < 6; i++) {
        var img = ctx.createImageData(width, height);
        for (var p = 0; p < img.data.length; p += 4) {
          var r = Math.random();
          if (r > 0.985) {
            var bright = 168 + Math.random() * 87;
            img.data[p] = img.data[p + 1] = img.data[p + 2] = bright;
            img.data[p + 3] = 34 + Math.random() * 26;
          } else if (r > 0.93) {
            var mid = 80 + Math.random() * 115;
            img.data[p] = img.data[p + 1] = img.data[p + 2] = mid;
            img.data[p + 3] = 10 + Math.random() * 12;
          } else if (r < 0.012) {
            img.data[p] = img.data[p + 1] = img.data[p + 2] = 18;
            img.data[p + 3] = 16 + Math.random() * 14;
          }
        }
        frames.push(img);
      }
      ctx.putImageData(frames[0], 0, 0);
      canvas.style.transform = "translate3d(0,0,0)";
    }

    function tick(now) {
      raf = 0;
      if (document.hidden) return;
      if (now - last >= frameMs) {
        last = now;
        frame = (frame + 1) % frames.length;
        if (frames[frame]) ctx.putImageData(frames[frame], 0, 0);
        canvas.style.transform = "translate3d(" + ((frame % 2) ? "-1px" : "0px") + "," + ((frame % 3) ? "0px" : "1px") + ",0)";
      }
      raf = requestAnimationFrame(tick);
    }
    resize();
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; }
      else { last = performance.now(); if (!raf) raf = requestAnimationFrame(tick); }
    }, { passive: true });
    if (reduce && reduce.addEventListener) {
      reduce.addEventListener("change", function (e) {
        if (e.matches) { if (raf) cancelAnimationFrame(raf); canvas.style.display = "none"; }
        else { canvas.style.display = ""; last = performance.now(); if (!raf) raf = requestAnimationFrame(tick); }
      });
    }
  }

  function initInertia() {
    if (reduce && reduce.matches) return;
    var y = window.scrollY, target = y, velocity = 0, lastWheel = performance.now();
    var raf = 0, maxScroll = 0, active = false;
    var hardScroll = function () { active = false; target = window.scrollY; y = target; velocity = 0; };

    function refresh() {
      maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      target = clamp(target, 0, maxScroll); y = clamp(y, 0, maxScroll);
    }
    function schedule() { if (!raf) raf = requestAnimationFrame(loop); }
    function loop() {
      raf = 0;
      var next = lerp(y, target, 0.12), delta = next - y; y = next;
      if (Math.abs(delta) > 0.01) {
        window.scrollTo(0, y);
        velocity = lerp(velocity, delta, 0.18);
        updateParallax(y, velocity); updateEdges(velocity); schedule();
      } else {
        velocity = lerp(velocity, 0, 0.24);
        updateParallax(y, velocity); updateEdges(velocity);
      }
      var progress = maxScroll ? clamp(y / maxScroll, 0, 1) : 0;
      var bar = document.querySelector(".scroll-progress span");
      if (bar) bar.style.transform = "scaleY(" + progress + ")";
    }
    function onWheel(e) {
      if (!finePointer || !finePointer.matches || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      var now = performance.now(), dt = Math.max(8, now - lastWheel);
      var impulse = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
      var speed = clamp(0.96 + Math.abs(impulse / dt) * 1.25, 0.96, 1.07);
      target = clamp(target + impulse * speed, 0, maxScroll);
      active = true; lastWheel = now; schedule();
    }
    document.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", function () {
      if (!active) { y = window.scrollY; target = y; updateParallax(y, 0); updateEdges(0); }
      refresh();
    }, { passive: true });
    window.addEventListener("resize", refresh, { passive: true });
    window.addEventListener("pointerdown", hardScroll, { passive: true });
    window.addEventListener("keydown", function (e) {
      if (["Home","End","PageDown","PageUp","ArrowDown","ArrowUp"].indexOf(e.key) >= 0) {
        active = false; setTimeout(function () { y = target = window.scrollY; }, 0);
      }
    });
    refresh();
  }

  var parallaxItems = [];
  function cacheParallax() {
    parallaxItems = Array.from(document.querySelectorAll("[data-parallax]")).map(function (node, i) {
      return { node: node, speed: Number(node.dataset.parallax) || 0, depth: Number(node.dataset.depth) || ((i % 3) + 1) };
    });
  }
  function updateParallax(scrollY, velocity) {
    if (!parallaxItems.length) return;
    parallaxItems.forEach(function (item) {
      var rect = item.node.getBoundingClientRect();
      var center = rect.top + rect.height * 0.5 - window.innerHeight * 0.5;
      var drift = -center * item.speed + velocity * item.depth * 7;
      item.node.style.transform = "translate3d(0," + drift.toFixed(2) + "px,0)";
    });
  }
  function updateEdges(velocity) {
    var e = clamp(Math.abs(velocity) * 0.65, 0, 1);
    document.documentElement.style.setProperty("--edge-energy-top", e.toFixed(3));
    document.documentElement.style.setProperty("--edge-energy-bottom", (e * 0.92).toFixed(3));
    document.documentElement.style.setProperty("--edge-drift", clamp(velocity * 14, -9, 9).toFixed(2) + "px");
    document.documentElement.style.setProperty("--mist-drift", clamp(velocity * -7, -6, 6).toFixed(2) + "px");
  }
  function initLinks() {
    document.addEventListener("click", function (event) {
      var anchor = event.target && event.target.closest ? event.target.closest("a[data-scroll-link]") : null;
      if (!anchor) return;
      var href = anchor.getAttribute("href");
      if (!href || href.charAt(0) !== "#") return;
      var targetEl = document.querySelector(href);
      if (!targetEl) return;
      event.preventDefault();
      var offset = Math.min(28, window.innerHeight * 0.035);
      targetEl.scrollIntoView({ block: "start" });
      window.scrollTo({ top: Math.max(0, window.scrollY - offset), behavior: (reduce && reduce.matches) ? "auto" : "smooth" });
      history.replaceState(null, "", href);
    }, false);
  }
  function load() {
    fetch("js/content.json", { cache: "no-cache" })
      .then(function (response) {
        if (!response.ok) throw new Error("content.json: " + response.status);
        return response.json();
      })
      .then(function (content) {
        var grain = render(content);
        cacheParallax(); initFilmGrain(grain); initInertia(); initLinks(); updateParallax(window.scrollY, 0);
      })
      .catch(function (error) {
        console.error("Failed to load content.json", error);
        var message = el("pre");
        message.style.cssText = "padding:2rem;font:14px/1.6 ui-monospace,monospace;color:#fff;background:#050505;white-space:pre-wrap;";
        setText(message, "Failed to load content.json. Start the project with: npm start\n\n" + error.message);
        root.replaceChildren(message);
      });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load, { once: true });
  else load();
})();
