/* LearnLink student app, part 8: connection status (Wi-Fi icon, speed checks, offline notice). */
var NET = { lv: "good", mbps: null, bad: 0 }, SIMS = [null, { on: 1, mbps: 45 }, { on: 1, mbps: .6 },
  { on: 0 }], SN = ["Auto", "Fast", "Weak", "No signal"];

function wifi(l) {
  var c = l === "good" ? "var(--ac)" : l === "weak" ? "#E0A100" : "var(--er)", n = l === "good" ? 3 : l === "weak" ? 1 : 0,
    g = "var(--bd2)";
  return '<svg width="20" height="16" viewBox="0 0 24 20" fill="none" stroke-linecap="round" stroke-width="2.4" aria-hidden="true"><path d="M2 7.5a14 14 0 0 1 20 0" stroke="' +
    (n >= 3 ? c : g) + '"/><path d="M5.5 11.5a9 9 0 0 1 13 0" stroke="' + (n >= 2 ? c : g) + '"/><path d="M9 15.2a4 4 0 0 1 6 0" stroke="' +
    (n >= 1 ? c : g) + '"/><circle cx="12" cy="18.5" r="1.1" fill="' + (n >= 1 ? c : g) + '" stroke="none"/>' +
    (l === "off" ? '<path d="M3 2l18 17" stroke="var(--er)"/>' : "") + "</svg>"
}

function rd() {
  if (S.sim) return S.sim.on ? S.sim.mbps : -1;
  if (!navigator.onLine) return -1;
  if (NS && NS.ok && NS.fR >= 2 && NS.fB >= 1) return -1;
  if (NS && NS.mbps != null) return NS.mbps;
  var c = navigator.connection;
  return c && typeof c.downlink === "number" ? c.downlink : null
}

function lvOf(m) {
  return m === -1 ? "off" : m === null ? "good" : m < .2 ? "off" : m < 1 ? "weak" : "good"
}

function netUpd(first) {
  var m = rd(), l = lvOf(m), prev = NET.lv;
  if (!first && !S.sim && l === "off" && prev !== "off" && NET.bad < 1) {
    NET.bad++;
    return
  }
  NET.bad = 0;
  var t = (m === -1 || m === null) ? m : Math.round(m * 10 / 1) / 10;
  if (!first && l === NET.lv && t === NET.mbps) return;
  var lc = l !== NET.lv;
  NET.lv = l;
  NET.mbps = t;
  S.on = l !== "off";
  if (first) return;
  if (prev !== l) tw(l, prev);
  if (lc) {
    if (S.scr === "app") render()
  } else {
    var b = D.querySelector('button[aria-label^="Connection"]');
    if (b) b.outerHTML = netH()
  }
}

function nu(e) {
  if (e && e.type === "offline") NET.bad = 1;
  netUpd(false)
}

function netH() {
  var l = NET.lv, t = l === "off" ? "Offline" : (NET.mbps == null || NET.mbps === -1) ? "Online" : NET.mbps +
    " Mbps";
  return '<button aria-label="Connection: ' + t + '" onclick="event.stopPropagation();S.nm=!S.nm;S.pm=false;render()" style="display:flex;align-items:center;gap:6px;font-size:12px;padding:4px 10px;border-radius:99px;color:' +
    (l === "off" ? "var(--er)" : l === "weak" ? "var(--wt)" : "var(--tx)") + '">' + wifi(l) + "<span>" + t +
    "</span></button>"
}

function netB() {
  var l = NET.lv;
  if (l === "good") return "";
  var o = l === "off";
  return '<div style="margin:0 22px 8px;padding:8px 14px;border-radius:14px;background:' + (o ? "var(--erb)" : "var(--bt)") +
    ';color:' + (o ? "var(--er)" : "var(--wt)") + ';font-size:13px;font-weight:700">' + (o ? "No internet. Campus mode: LearnLink still answers over the campus network." : "Weak connection (" +
    NET.mbps + " Mbps). Answers may be slow.") + "</div>"
}

function netP() {
  if (!S.nm) return "";
  var t = NET.lv === "off" ? "No usable signal" : NET.lv === "weak" ? "Weak signal" : "Good signal";
  return '<div class="dd" style="width:290px;right:60px;cursor:default" onclick="event.stopPropagation()"><p style="margin:4px 10px 6px;font-weight:800">' +
    t + (S.sim ? ' <span class="sm">(simulated)</span>' : "") + '</p><span id="ng" style="display:block">' +
    netG() + '</span><p class="sm" style="margin:0 10px 8px">' + (NS.ok ? "Measured live with small test downloads. Below 0.2 Mbps or with no signal, you are on campus mode only." : "Using your browser’s own signal while test downloads load.") +
    '</p><p class="sm" style="margin:0 10px 6px">Presentation demo</p><p style="margin:0 10px 8px;display:flex;flex-wrap:wrap;gap:6px">' +
    SN.map(function (n, i) {
    return '<button' + (S.sim === SIMS[i] ? ' class="p"' : "") + ' style="font-size:12px;padding:4px 10px" onclick="setSim(' +
      i + ')">' + n + "</button>"
  }).join("") + "</p></div>"
}

function setSim(i) {
  S.sim = SIMS[i];
  NET.bad = 1;
  netUpd(false);
  render()
}
window.addEventListener("online", nu);
window.addEventListener("offline", nu);
if (navigator.connection && navigator.connection.addEventListener) navigator.connection.addEventListener("change",
  nu);
setInterval(nu, 4000);
netUpd(true);
var NS = { rx: [], lat: [], mbps: null, rtt: null, fR: 0, fB: 0, ok: 0, peak: 0 }, U_R = "https://cdnjs.cloudflare.com/ajax/libs/fastclick/1.0.6/fastclick.min.js",
  U_B = "https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js", tc = 0, bR = 0, bB = 0;
for (var i0 = 0; i0 < 60; i0++) {
  NS.rx.push(0);
  NS.lat.push(0)
}

function probe(u, cb) {
  var s = D.createElement("script"), t0 = performance.now(), dn = 0, tm = setTimeout(function () {
    end(0)
  }, 8000);
  function end(ok) {
    if (dn) return;
    dn = 1;
    clearTimeout(tm);
    var ms = performance.now() - t0, e = null;
    if (ok) {
      var es = performance.getEntriesByName(s.src);
      e = es[es.length - 1] || null
    }
    s.remove();
    cb(ok, ms, e)
  }
  s.onload = function () {
    end(1)
  };
  s.onerror = function () {
    end(0)
  };
  s.async = true;
  s.src = u + "?t=" + Date.now() + Math.floor(Math.random() * 999);
  D.head.appendChild(s)
}

function gotR(ok, ms, e) {
  if (ok) {
    NS.ok = 1;
    NS.fR = 0;
    NS.rtt = Math.max(1, Math.round((e && e.duration) || ms))
  } else NS.fR++;
  if (rd() === -1) NET.bad = 1;
  netUpd(false)
}

function gotB(ok, ms, e) {
  if (ok) {
    NS.ok = 1;
    NS.fB = 0;
    var by = (e && (e.transferSize || e.encodedBodySize)) || 90000, tt = e && (e.responseEnd - e.responseStart) > 3 ? (e.responseEnd - e.responseStart) : ms,
      x = Math.min(999, by * 8 / 1000 / tt);
    NS.mbps = NS.mbps == null ? x : NS.mbps * .5 + x * .5
  } else NS.fB++;
  if (rd() === -1) NET.bad = 1;
  netUpd(false)
}

function chart(a, col, min) {
  var w = 252, h = 64, mx = Math.max(min, Math.max.apply(null, a)) * 1.15, line = a.map(function (v, i) {
    return (i / (a.length - 1) * w).toFixed(1) + "," + (h - v / mx * h).toFixed(1)
  }).join(" ");
  return '<svg viewBox="0 0 ' + w + " " + h + '" width="100%" height="' + h + '" preserveAspectRatio="none" style="background:var(--s1);border-radius:10px;display:block" aria-hidden="true">' +
    [.25, .5, .75].map(function (f) {
    return '<line x1="0" x2="' + w + '" y1="' + h * f + '" y2="' + h * f + '" stroke="var(--bd)" stroke-dasharray="3 3"/>'
  }).join("") + '<polygon points="0,' + h + " " + line + " " + w + "," + h + '" fill="' + col + '" opacity=".22"/><polyline points="' +
    line + '" fill="none" stroke="' + col + '" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>'
}

function netG() {
  var off = NET.lv === "off", c = navigator.connection, d = S.sim ? (S.sim.on ? S.sim.mbps : 0) : (off ? 0 : (NS.mbps != null ? NS.mbps : (c &&
    c.downlink) || 0)), f = function (x) {
    return x >= 10 ? Math.round(x) : Math.round(x * 10) / 10
  }, lt = off ? "—" : S.sim ? "~50 ms" : NS.rtt == null ? "…" : NS.rtt + " ms";
  return '<p style="margin:0 10px 8px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px"><span><span class="sm">Download</span><br><b>' +
    (off ? 0 : f(d)) + ' Mbps</b></span><span><span class="sm">Latency</span><br><b>' + lt + '</b></span><span><span class="sm">Peak</span><br><b>' +
    f(NS.peak) + ' Mbps</b></span></p><p class="sm" style="margin:0 10px 4px">Download, last 60 seconds</p><p style="margin:0 10px 8px">' +
    chart(NS.rx, "#3B82F6", 1) + '</p><p class="sm" style="margin:0 10px 4px">Latency</p><p style="margin:0 10px 8px">' +
    chart(NS.lat, "#E0A100", 50) + "</p>"
}

function tick() {
  tc++;
  var off = NET.lv === "off", c = navigator.connection, v = 0, l = 0;
  if (S.sim) {
    if (S.sim.on) {
      v = S.sim.mbps * (.85 + Math.random() * .3);
      l = 40 + Math.random() * 25
    }
  } else if (!off) {
    v = NS.mbps != null ? NS.mbps : (c && c.downlink) || 0;
    l = NS.rtt || 0
  }
  NS.rx.push(v);
  NS.rx.shift();
  NS.lat.push(l);
  NS.lat.shift();
  if (v > NS.peak) NS.peak = v;
  var g = $("ng");
  if (S.nm && g) g.innerHTML = netG();
  if (!S.sim && navigator.onLine) {
    if (!bR && tc % 2 === 0) {
      bR = 1;
      probe(U_R, function (a, b, e) {
        bR = 0;
        gotR(a, b, e)
      })
    }
    if (!bB && tc % (S.nm ? 3 : 10) === 0) {
      bB = 1;
      probe(U_B, function (a, b, e) {
        bB = 0;
        gotB(a, b, e)
      })
    }
  }
}
window.addEventListener("online", function () {
  NS.fR = 0;
  NS.fB = 0;
  nu()
});
setInterval(tick, 1000);
var TWT;
function tw(l, prev) {
  var k = l === "off" ? "off" : l === "weak" ? "weak" : "on", m = k === "off" ? ["No internet", "Campus mode: LearnLink still works over the campus network."] : k === "weak" ? (prev === "off" ? ["Back online, but weak",
    "Answers may be slow."] : ["Weak connection", "Answers may be slow."]) : ["Back online", "Internet restored."],
    el = $("tw");
  if (!el) return;
  el.innerHTML = '<div class="tw ' + k + '" onclick="this.parentNode.innerHTML=\'\'"><b>' + m[0] + "</b><span>" +
    m[1] + "</span></div>";
  clearTimeout(TWT);
  TWT = setTimeout(function () {
    el.innerHTML = ""
  }, 5000)
}
