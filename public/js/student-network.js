/* =====================================================================================================================
   LearnLink student app: connection status
   ---------------------------------------------------------------------------------------------------------------------
   Shows a banner at the top when the connection is weak or gone ("Campus mode": LearnLink keeps working over the
   campus network without internet), and a short toast when it changes.
   How it measures: the browser's online/offline events and navigator.connection, plus two small test downloads
   (TEST_FILES) every few seconds: a tiny one for latency, a bigger one for speed.
   TODO (PROGRESS.md): the test files are on public CDNs; point them at the campus server.
   ===================================================================================================================== */

var TEST_FILES = {
  small: "https://cdnjs.cloudflare.com/ajax/libs/fastclick/1.0.6/fastclick.min.js",   // latency, every 2 s
  big: "https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js"                         // speed, every 10 s
};
var SLOW_MBPS = 1, NO_SIGNAL_MBPS = 0.2;   // below these: "weak", then "off"

// level: "good" | "weak" | "off". mbps: last measured speed (null = unknown). misses: a short grace before "off".
var NET = { level: "good", mbps: null, misses: 0 };
// Test download results: latency (ms), speed (Mbps), failures in a row, and whether any test worked yet.
var PROBE = { latency: null, mbps: null, smallFails: 0, bigFails: 0, worked: false };

// Best guess at the current speed in Mbps: -1 = offline, null = unknown.
function currentMbps() {
  if (!navigator.onLine) return -1;
  if (PROBE.worked && PROBE.smallFails >= 2 && PROBE.bigFails >= 1) return -1;   // test downloads keep failing
  if (PROBE.mbps != null) return PROBE.mbps;
  var c = navigator.connection;
  return c && typeof c.downlink === "number" ? c.downlink : null
}
function levelOf(mbps) {
  return mbps === -1 ? "off" : mbps === null ? "good" : mbps < NO_SIGNAL_MBPS ? "off" : mbps < SLOW_MBPS ? "weak" : "good"
}

// Re-check the level and update the page if it changed. A single bad reading doesn't flip to "off" right away.
function updateNetwork(first) {
  var mbps = currentMbps(), level = levelOf(mbps), before = NET.level;
  if (!first && level === "off" && before !== "off" && NET.misses < 1) {
    NET.misses++;
    return
  }
  NET.misses = 0;
  var rounded = mbps === -1 || mbps === null ? mbps : Math.round(mbps * 10) / 10;
  if (!first && level === NET.level && rounded === NET.mbps) return;
  NET.level = level;
  NET.mbps = rounded;
  S.online = level !== "off";
  if (first) return;
  if (before !== level) {
    networkToast(level, before);
    if (S.screen === "app") render()
  }
}
function onNetworkEvent(e) {
  if (e && e.type === "offline") NET.misses = 1;   // the browser is sure: no grace period
  updateNetwork(false)
}

/* ---------- what the student sees ---------- */
function networkBanner() {
  if (NET.level === "good") return "";
  var off = NET.level === "off";
  return '<div style="margin:0 22px 8px;padding:8px 14px;border-radius:14px;background:' + (off ? "var(--erb)" : "var(--bt)") + ";color:" + (off ? "var(--er)" : "var(--wt)") +
    ';font-size:13px;font-weight:700">' + (off ? "No internet. Campus mode: LearnLink still answers over the campus network." : "Weak connection (" + NET.mbps + " Mbps). Answers may be slow.") + "</div>"
}

// A toast in #tw (student.html) for 5 seconds; tap to close.
var toastTimer;
function networkToast(level, before) {
  var el = $("tw");
  if (!el) return;
  var kind = level === "off" ? "off" : level === "weak" ? "weak" : "on";
  var m = kind === "off" ? ["No internet", "Campus mode: LearnLink still works over the campus network."] :
    kind === "weak" ? [before === "off" ? "Back online, but weak" : "Weak connection", "Answers may be slow."] : ["Back online", "Internet restored."];
  el.innerHTML = '<div class="tw ' + kind + '" onclick="this.parentNode.innerHTML=\'\'"><b>' + m[0] + "</b><span>" + m[1] + "</span></div>";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.innerHTML = "" }, 5000)
}

/* ---------- test downloads ---------- */
// Load url as a script (works across sites without CORS); then done(ok, ms, timing entry).
function probe(url, done) {
  var s = D.createElement("script"), t0 = performance.now(), over = false, timer = setTimeout(function () { end(false) }, 8000);
  function end(ok) {
    if (over) return;
    over = true;
    clearTimeout(timer);
    var entries = ok ? performance.getEntriesByName(s.src) : [];
    s.remove();
    done(ok, performance.now() - t0, entries[entries.length - 1] || null)
  }
  s.onload = function () { end(true) };
  s.onerror = function () { end(false) };
  s.async = true;
  s.src = url + "?t=" + Date.now() + Math.floor(Math.random() * 999);
  D.head.appendChild(s)
}
function gotSmall(ok, ms, entry) {
  if (ok) {
    PROBE.worked = true;
    PROBE.smallFails = 0;
    PROBE.latency = Math.max(1, Math.round((entry && entry.duration) || ms))
  } else PROBE.smallFails++;
  if (currentMbps() === -1) NET.misses = 1;
  updateNetwork(false)
}
function gotBig(ok, ms, entry) {
  if (ok) {
    PROBE.worked = true;
    PROBE.bigFails = 0;
    var bytes = (entry && (entry.transferSize || entry.encodedBodySize)) || 90000;
    var t = entry && entry.responseEnd - entry.responseStart > 3 ? entry.responseEnd - entry.responseStart : ms;
    var mbps = Math.min(999, bytes * 8 / 1000 / t);
    PROBE.mbps = PROBE.mbps == null ? mbps : PROBE.mbps * 0.5 + mbps * 0.5   // smoothed
  } else PROBE.bigFails++;
  if (currentMbps() === -1) NET.misses = 1;
  updateNetwork(false)
}

var seconds = 0, smallRunning = false, bigRunning = false;
setInterval(function () {
  seconds++;
  if (!navigator.onLine) return;
  if (!smallRunning && seconds % 2 === 0) {
    smallRunning = true;
    probe(TEST_FILES.small, function (ok, ms, e) { smallRunning = false; gotSmall(ok, ms, e) })
  }
  if (!bigRunning && seconds % 10 === 0) {
    bigRunning = true;
    probe(TEST_FILES.big, function (ok, ms, e) { bigRunning = false; gotBig(ok, ms, e) })
  }
}, 1000);

window.addEventListener("online", function () { PROBE.smallFails = 0; PROBE.bigFails = 0; onNetworkEvent() });
window.addEventListener("offline", onNetworkEvent);
if (navigator.connection && navigator.connection.addEventListener) navigator.connection.addEventListener("change", onNetworkEvent);
setInterval(onNetworkEvent, 4000);
updateNetwork(true);
