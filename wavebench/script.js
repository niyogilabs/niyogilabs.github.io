/**
 * WaveBench Interactive Landing Page Script
 * Niyogi Labs — Waveform Analysis, Hardware Debug Hints & 1-Click OAuth Auth
 */

document.addEventListener("DOMContentLoaded", () => {
  initWaveformSimulator();
  initOAuthButtons();
  initOAuthAuthState();
});

// -------------------------------------------------------------
// 1. Interactive A2A Oscilloscope & Signal Debug Simulator
// -------------------------------------------------------------
const SAMPLE_SCENARIOS = {
  multichannel_timing: {
    title: "I2C / SPI Signal Timing & Setup Violation",
    meta: "CH1: SCLK (Cyan) | CH2: MOSI (Amber) | Sample Rate: 500 MS/s",
    type: "multichannel",
    logs: [
      "[A2A Ingest] Received Dual-Channel Signal Array: CH1 (SCLK), CH2 (MOSI)",
      "[WaveBench Signal Engine] Running multi-channel waveform & timing analysis...",
      "[Signal Engine] SCLK rising edge detected at t = 1.240 µs",
      "[Signal Engine] MOSI data transition detected at t = 1.232 µs",
      "[CRITICAL] Measured Setup Time t_su = 8.0 ns (Required bus spec: t_su >= 15.0 ns)",
      "[A2A Engine] Compiling hardware-specific debug hints for main agent..."
    ],
    json: {
      "status": "ANALYSIS_COMPLETE",
      "verification_domain": "SIGNAL_LEVEL_DEBUG",
      "bus_type": "SPI_MODE_0",
      "waveform_metrics": {
        "clock_freq_mhz": 25.0,
        "measured_setup_time_ns": 8.0,
        "required_setup_time_ns": 15.0,
        "measured_hold_time_ns": 24.5,
        "skew_channel_1_vs_2_ns": 4.2
      },
      "verdict": "FAIL_SETUP_TIME_VIOLATION",
      "root_cause": "MOSI data signal arrives too late relative to SCLK rising edge due to PCB trace skew.",
      "hardware_debug_hints": [
        "Invert SCLK clock phase polarity (CPHA) in SPI controller control register 1.",
        "Add 1 to 2 dummy delay cycles in SPI master transfer initialization function.",
        "Check if PCB trace routing on MOSI line has excessive propagation delay vs SCLK."
      ],
      "instrument_guidance": "Trace captured cleanly. Keep current trigger level at 1.65V on CH1."
    }
  },
  power_rail_transient: {
    title: "Power Rail Voltage Brownout & Switching Ripple",
    meta: "CH1: VDD 3.3V Rail (Magenta) | Sample Rate: 100 MS/s",
    type: "power_integrity",
    logs: [
      "[A2A Ingest] Received Power Rail Signal Array: CH1 (3.3V VDD)",
      "[WaveBench Signal Engine] Analyzing voltage transients & power frequency spectrum...",
      "[Signal Engine] Instantaneous voltage drop detected: V_min = 2.78V (Nominal: 3.30V)",
      "[Signal Engine] Transient duration: 4.2 µs (Coincides with MCU TX burst startup)",
      "[Signal Engine] Power Spectral Density peak detected at 480 kHz (Switching regulator frequency)",
      "[A2A Engine] Compiling hardware-specific debug hints for main agent..."
    ],
    json: {
      "status": "ANALYSIS_COMPLETE",
      "verification_domain": "POWER_RAIL_DEBUG",
      "power_rail": "VDD_3V3_MCU",
      "waveform_metrics": {
        "v_nominal": "3.30 V",
        "v_min_transient": "2.78 V",
        "dip_percentage": 15.7,
        "transient_duration_us": 4.2,
        "ripple_peak_to_peak_mv": 310.0,
        "switching_freq_khz": 480.0
      },
      "verdict": "FAIL_CRITICAL_BROWNOUT",
      "root_cause": "Inadequate decoupling capacitance during high-current RF transmit burst causing VDD drop below brownout threshold.",
      "hardware_debug_hints": [
        "Enable software soft-start on RF power amplifier control register to stagger peak current draw.",
        "Place a 22µF low-ESR ceramic decoupling capacitor directly adjacent to MCU pin 28 (VDD).",
        "Verify buck converter inductor saturation rating under 500mA transient load."
      ],
      "instrument_guidance": "To observe decoupling response, set scope trigger mode to NORMAL with FALLING edge at 3.10V."
    }
  },
  improper_trigger: {
    title: "Signal-Level Trigger & Scope Scale Helper",
    meta: "CH1: High-Speed UART (Amber) | Sample Rate: 200 MS/s",
    type: "trigger_helper",
    logs: [
      "[A2A Ingest] Received Signal Array from Local Tool MCP",
      "[WaveBench Signal Engine] Inspecting waveform scaling & trigger stability...",
      "[Signal Engine] Waveform is CLIPPED at 2.0V top saturation (Volts/div set too small!)",
      "[Signal Engine] Trigger status: AUTO (Signal is free-running and un-triggered)",
      "[A2A Engine] Compiling instrument scale & trigger debug hints..."
    ],
    json: {
      "status": "NEEDS_INSTRUMENT_RECONFIGURATION",
      "verification_domain": "INSTRUMENT_HELPER",
      "issue_detected": "TRACE_CLIPPED_AND_UNTRIGGERED",
      "hardware_debug_hints": [
        "Set CH1 Vertical Scale (Volts/div) from 200mV/div to 1.0V/div on scope.",
        "Change Trigger Mode from AUTO to SINGLE to freeze the frame.",
        "Set Trigger Source to CH1, FALLING edge at 1.65V."
      ],
      "probe_guidance": "After adjusting scope scales, re-capture and resubmit trace via A2A protocol."
    }
  }
};

let currentScenarioKey = "multichannel_timing";

function initWaveformSimulator() {
  const selectEl = document.getElementById("trace-select");
  const btnEl = document.getElementById("run-analysis-btn");

  if (!selectEl || !btnEl) return;

  selectEl.addEventListener("change", (e) => {
    currentScenarioKey = e.target.value;
    renderCanvasWaveform(currentScenarioKey);
    updateScenarioMeta(currentScenarioKey);
  });

  btnEl.addEventListener("click", () => {
    runAnalysisSimulation(currentScenarioKey);
  });

  renderCanvasWaveform(currentScenarioKey);
  updateScenarioMeta(currentScenarioKey);
}

function updateScenarioMeta(key) {
  const scenario = SAMPLE_SCENARIOS[key];
  const metaEl = document.getElementById("trace-meta");
  if (metaEl) metaEl.textContent = scenario.meta;
}

function renderCanvasWaveform(key) {
  const canvas = document.getElementById("waveform-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= width; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y <= height; y += 35) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  ctx.strokeStyle = "rgba(14, 165, 233, 0.3)";
  ctx.beginPath();
  ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2);
  ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height);
  ctx.stroke();

  const scenario = SAMPLE_SCENARIOS[key];

  if (scenario.type === "multichannel") {
    drawClockTrace(ctx, width, height, "#38bdf8", 0.3, 0.7);
    drawDataTraceSkewed(ctx, width, height, "#f59e0b", 0.45, 0.85);
  } else if (scenario.type === "power_integrity") {
    drawPowerTransientTrace(ctx, width, height, "#f43f5e");
  } else if (scenario.type === "trigger_helper") {
    drawClippedTrace(ctx, width, height, "#f59e0b");
  }
}

function drawClockTrace(ctx, w, h, color, yHighRatio, yLowRatio) {
  ctx.lineWidth = 2.5; ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 4;
  ctx.beginPath();
  const yHigh = h * yHighRatio; const yLow = h * yLowRatio;
  ctx.moveTo(0, yLow);
  for (let x = 0; x < w; x++) {
    const cycle = (x % 80) / 80;
    ctx.lineTo(x, cycle < 0.5 ? yHigh : yLow);
  }
  ctx.stroke(); ctx.shadowBlur = 0;
}

function drawDataTraceSkewed(ctx, w, h, color, yHighRatio, yLowRatio) {
  ctx.lineWidth = 2.5; ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 4;
  ctx.beginPath();
  const yHigh = h * yHighRatio; const yLow = h * yLowRatio;
  ctx.moveTo(0, yLow);
  for (let x = 0; x < w; x++) {
    const cycle = ((x + 15) % 80) / 80;
    ctx.lineTo(x, cycle < 0.5 ? yHigh : yLow);
  }
  ctx.stroke(); ctx.shadowBlur = 0;
}

function drawPowerTransientTrace(ctx, w, h) {
  ctx.lineWidth = 2.5; ctx.strokeStyle = "#f43f5e"; ctx.shadowColor = "#f43f5e"; ctx.shadowBlur = 4;
  ctx.beginPath();
  const dcY = h * 0.35; const dipY = h * 0.75;
  ctx.moveTo(0, dcY);
  for (let x = 0; x < w; x++) {
    let y = dcY;
    if (x > 140 && x < 280) {
      const t = (x - 140) / 140;
      y = dcY + Math.sin(t * Math.PI) * (dipY - dcY) + Math.sin(x * 0.3) * 12;
    } else {
      y = dcY + (Math.random() - 0.5) * 4;
    }
    ctx.lineTo(x, y);
  }
  ctx.stroke(); ctx.shadowBlur = 0;
}

function drawClippedTrace(ctx, w, h) {
  ctx.lineWidth = 2.5; ctx.strokeStyle = "#f59e0b"; ctx.shadowColor = "#f59e0b"; ctx.shadowBlur = 4;
  ctx.beginPath();
  const topClipY = h * 0.15; const lowY = h * 0.8;
  ctx.moveTo(0, lowY);
  for (let x = 0; x < w; x++) {
    const cycle = (x % 100) / 100;
    ctx.lineTo(x, cycle < 0.5 ? topClipY : lowY);
  }
  ctx.stroke(); ctx.shadowBlur = 0;
}

function runAnalysisSimulation(key) {
  const scenario = SAMPLE_SCENARIOS[key];
  const consoleEl = document.getElementById("console-output");
  const jsonEl = document.getElementById("json-output");

  if (!consoleEl || !jsonEl) return;

  consoleEl.innerHTML = "";
  jsonEl.textContent = "// Receiving A2A protocol payload...";

  let lineIdx = 0;
  const interval = setInterval(() => {
    if (lineIdx < scenario.logs.length) {
      const logText = scenario.logs[lineIdx];
      const div = document.createElement("div");
      div.className = "console-line " + (logText.includes("CRITICAL") || logText.includes("FAIL") ? "warn" : logText.includes("Verdict") || logText.includes("Compiling") ? "success" : "info");
      div.textContent = logText;
      consoleEl.appendChild(div);
      consoleEl.scrollTop = consoleEl.scrollHeight;
      lineIdx++;
    } else {
      clearInterval(interval);
      jsonEl.textContent = JSON.stringify(scenario.json, null, 2);
    }
  }, 400);
}

// -------------------------------------------------------------
// 2. 1-Click OAuth Provider Integration (GitHub / Google)
// -------------------------------------------------------------
function initOAuthButtons() {
  const githubBtn = document.getElementById("github-oauth-btn");
  const googleBtn = document.getElementById("google-oauth-btn");

  if (githubBtn) {
    githubBtn.addEventListener("click", () => handleOAuthSignIn("github"));
  }
  if (googleBtn) {
    googleBtn.addEventListener("click", () => handleOAuthSignIn("google"));
  }
}

async function handleOAuthSignIn(providerName) {
  const statusMsg = document.getElementById("form-status");

  // Read selected options from form
  const roleEl = document.getElementById("user-role");
  const equipmentEl = document.getElementById("user-equipment");
  const primaryFeatureEl = document.querySelector('input[name="primary_feature"]:checked');

  const signupData = {
    role: roleEl ? roleEl.value : "Hardware R&D",
    equipment: equipmentEl && equipmentEl.value.trim() ? equipmentEl.value.trim() : "Unspecified",
    primary_feature: primaryFeatureEl ? primaryFeatureEl.value : "Hardware Debug Hints",
    timestamp: new Date().toISOString()
  };

  sessionStorage.setItem("wavebench_draft_signup", JSON.stringify(signupData));

  try {
    if (window.WAVEBENCH_CONFIG && !window.WAVEBENCH_CONFIG.MOCK_SUBMISSION && typeof supabaseClient !== 'undefined' && supabaseClient) {
      const redirectUrl = window.location.origin + window.location.pathname;
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: providerName,
        options: {
          redirectTo: redirectUrl,
          data: signupData
        }
      });

      if (error) throw error;
    } else {
      // Mock Demo OAuth Fallback
      await new Promise((res) => setTimeout(res, 800));
      if (statusMsg) {
        statusMsg.className = "form-status-message success";
        statusMsg.innerHTML = `🌐 <strong>[Demo Mode]</strong> Redirecting to ${providerName.toUpperCase()} OAuth...`;
        statusMsg.classList.remove("hidden");
      }
    }
  } catch (err) {
    console.error(`OAuth error (${providerName}):`, err);
    if (statusMsg) {
      statusMsg.className = "form-status-message error";
      statusMsg.textContent = `OAuth authentication failed: ${err.message || "Please check provider setup in Supabase Dashboard."}`;
      statusMsg.classList.remove("hidden");
    }
  }
}

// -------------------------------------------------------------
// 3. Handle OAuth Callback on Return (Auth State Listener)
// -------------------------------------------------------------
function initOAuthAuthState() {
  if (typeof supabaseClient === 'undefined' || !supabaseClient) return;

  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session && session.user) {
      console.log("User authenticated via OAuth:", session.user.email);
      
      const statusMsg = document.getElementById("form-status");

      const userMeta = session.user.user_metadata || {};
      const draftStr = sessionStorage.getItem("wavebench_draft_signup");
      const draft = draftStr ? JSON.parse(draftStr) : {};

      const role = userMeta.role || draft.role || "Hardware R&D";
      const equipment = userMeta.equipment || draft.equipment || "Unspecified";
      const primaryFeature = userMeta.primary_feature || draft.primary_feature || "Hardware Debug Hints";

      const finalRecord = {
        email: session.user.email,
        user_id: session.user.id,
        role: role,
        equipment: equipment,
        primary_feature: primaryFeature
      };

      try {
        const { data, error } = await supabaseClient
          .from("wavebench_signups")
          .upsert([finalRecord], { onConflict: "email" });

        if (error) {
          console.error("Supabase Database Insert Error:", error);
          if (statusMsg) {
            statusMsg.className = "form-status-message error";
            statusMsg.innerHTML = `⚠️ <strong>Database Policy Error:</strong> ${escapeHtml(error.message)}. Please check your RLS policies in Supabase SQL Editor.`;
            statusMsg.classList.remove("hidden");
          }
          return;
        }

        console.log("Database signup record upserted successfully:", data);
        sessionStorage.removeItem("wavebench_draft_signup");

        if (statusMsg) {
          statusMsg.className = "form-status-message success";
          statusMsg.innerHTML = `🎉 <strong>OAuth Verified!</strong> Welcome ${escapeHtml(session.user.email)}. Your waitlist registration is confirmed in our database!`;
          statusMsg.classList.remove("hidden");
          statusMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch (err) {
        console.error("Error finalizing signup record:", err);
      }
    }
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
