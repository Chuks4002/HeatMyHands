/* HeatMyHands iPhone compatibility diagnostics.
 * Observes existing app state only; does not start or increase CPU/GPU work.
 */
(function () {
  "use strict";

  function startDiagnostics() {
    if (document.getElementById("hmh-diagnostics")) return;

    var panel = document.createElement("aside");
    panel.id = "hmh-diagnostics";
    panel.setAttribute("role", "status");
    panel.style.cssText = [
      "position:fixed", "z-index:2147483647", "left:8px", "right:8px",
      "bottom:8px", "max-height:42vh", "overflow:auto",
      "padding:10px 12px", "background:rgba(0,0,0,.88)",
      "color:#fff", "font:12px/1.45 -apple-system,BlinkMacSystemFont,sans-serif",
      "border:1px solid #aaa", "border-radius:8px",
      "white-space:pre-wrap", "overflow-wrap:anywhere"
    ].join(";");

    var heading = document.createElement("div");
    heading.style.cssText = "font-weight:700;margin-bottom:5px";
    heading.textContent = "HeatMyHands · iPhone diagnostics";
    panel.appendChild(heading);

    var content = document.createElement("div");
    panel.appendChild(content);

    var close = document.createElement("button");
    close.textContent = "Hide diagnostics";
    close.type = "button";
    close.style.cssText = "margin-top:7px;padding:5px 8px";
    close.addEventListener("click", function () { panel.remove(); });
    panel.appendChild(close);
    document.body.appendChild(panel);

    var recentErrors = [];
    window.addEventListener("error", function (e) {
      recentErrors.push((e.message || "Script error") +
        (e.filename ? " (" + e.filename.split("/").pop() + ")" : ""));
      if (recentErrors.length > 3) recentErrors.shift();
      render();
    });
    window.addEventListener("unhandledrejection", function (e) {
      recentErrors.push("Promise rejection: " + String(e.reason || "unknown"));
      if (recentErrors.length > 3) recentErrors.shift();
      render();
    });

    var canvas = document.getElementById("webgl");
    if (canvas) {
      canvas.addEventListener("webglcontextlost", function () {
        recentErrors.push("WebGL context lost");
        render();
      });
    }

    function yesNo(v) { return v ? "YES" : "NO"; }
    function render() {
      var c = window.controller;
      var lines = [
        "Page visible: " + yesNo(document.visibilityState === "visible"),
        "Started flag: " + (c ? yesNo(c.started) : "controller not found")
      ];

      if (c && c.cpu) {
        lines.push("CPU workers supported: " + yesNo(!!c.cpu.compatible));
        lines.push("CPU workers requested: " + (c.cpu.numCores || 0));
        lines.push("CPU workers created: " + (c.cpu.workers ? c.cpu.workers.length : 0));
      } else {
        lines.push("CPU controller: not found");
      }

      if (c && c.gpu) {
        lines.push("WebGL initialization error: " + yesNo(!!c.gpu.error));
        lines.push("WebGL context available: " + yesNo(!!c.gpu.gl));
        lines.push("GPU loop started: " + yesNo(!!c.gpu.started));
        lines.push("Shaders active: " + (c.gpu.shaders ? c.gpu.shaders.length : 0));
        lines.push("Recent FPS counter: " + (typeof c.gpu.fps === "number" ? c.gpu.fps : "n/a"));
      } else {
        lines.push("GPU controller: not found");
      }

      lines.push("Browser: " + navigator.userAgent);
      if (recentErrors.length) {
        lines.push("", "Recent errors:");
        recentErrors.forEach(function (e) { lines.push("• " + e); });
      } else {
        lines.push("", "JavaScript errors observed: none so far");
      }
      content.textContent = lines.join("\n");
    }

    render();
    window.setInterval(function () {
      if (document.getElementById("hmh-diagnostics")) render();
    }, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startDiagnostics);
  } else {
    startDiagnostics();
  }
}());
