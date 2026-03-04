import React, { useState } from 'react';
import { Shield, Copy, Check, Terminal, Cpu, Globe, Lock, Zap, Github, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MERGED_SCRIPT = `// ==UserScript==
// @name         Google AI Identity - Golden Master Sovereign (AdGuard Android)
// @namespace    http://tampermonkey.net/
// @version      12.5 (AdGuard Optimized)
// @description  Ultimate Chrome fingerprint hardening for Google AI services - Full Sovereign Hybrid
// @author       Anonymous
// @match        https://*.google.com/*
// @match        https://gemini.google.com/*
// @match        https://ai.google.dev/*
// @match        https://aistudio.google.com/*
// @match        https://notebooklm.google.com/*
// @match        https://accounts.google.com/*
// @match        https://assistant.google.com/*
// @match        https://*.google.dev/*
// @match        https://chatgpt.com/*
// @run-at       document-start
// @grant        none
// @noframes
// ==/UserScript==

(function() {
    'use strict';

    // ─── 1. CORE MASKING ENGINE & UTILITIES ────────────────────────────────
    // Prevents detection of spoofed functions via .toString()
    const originalToString = Function.prototype.toString;
    const modifiedFns = new Set();
    
    Function.prototype.toString = function() {
        if (modifiedFns.has(this)) return \`function \${this.name}() { [native code] }\`;
        return originalToString.call(this);
    };

    const protect = (fn) => { 
        if (fn && typeof fn === 'function') modifiedFns.add(fn); 
        return fn; 
    };

    const secureProps = (obj, prop, value) => {
        try {
            Object.defineProperty(obj, prop, {
                get: protect(() => value),
                configurable: true,
                enumerable: true
            });
        } catch (e) { /* Property lock bypass */ }
    };

    // ─── 2. TIMING & BEHAVIORAL JITTER ──────────────────────────────────────
    // Breaks timing-based fingerprinting and behavioral analysis
    const originalNow = performance.now;
    performance.now = protect(function() {
        return originalNow.apply(this) + (Math.random() * 0.1);
    });

    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = protect(function(callback) {
        return originalRAF(function(time) {
            callback(time + (Math.random() * 0.05));
        });
    });

    // ─── 3. NAVIGATOR & CPU CONSISTENCY (Linux RTX 3080 Profile) ─────────────
    const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
    
    secureProps(navigator, 'userAgent', UA);
    secureProps(navigator, 'platform', 'Linux x86_64');
    secureProps(navigator, 'vendor', 'Google Inc');
    secureProps(navigator, 'hardwareConcurrency', 16);
    secureProps(navigator, 'deviceMemory', 8);
    secureProps(navigator, 'maxTouchPoints', 0); // Spoofing desktop on mobile
    secureProps(navigator, 'language', 'en-US');
    secureProps(navigator, 'languages', ['en-US', 'en']);
    secureProps(navigator, 'webdriver', undefined);
    secureProps(navigator, 'pdfViewerEnabled', true);

    // High-Entropy UserAgentData (Client Hints Restoration)
    if (navigator.userAgentData) {
        const getHighEntropyValues = navigator.userAgentData.getHighEntropyValues;
        navigator.userAgentData.getHighEntropyValues = protect(async (hints) => {
            const values = await getHighEntropyValues.apply(navigator.userAgentData, [hints]);
            return { 
                ...values, 
                platform: "Linux", 
                architecture: "x86", 
                model: "", 
                platformVersion: "6.5.0",
                uaFullVersion: "128.0.6613.119"
            };
        });

        Object.defineProperty(Navigator.prototype, 'userAgentData', {
            get: protect(() => Promise.resolve({
                brands: [
                    { brand: 'Not_A Brand', version: '8' }, 
                    { brand: 'Chromium', version: '128' }, 
                    { brand: 'Chrome', version: '128' }
                ],
                platform: 'Linux', 
                mobile: false,
                getHighEntropyValues: navigator.userAgentData.getHighEntropyValues
            }))
        });
    }

    // Permissions & Hardware Enumeration Spoofing
    if (navigator.permissions && navigator.permissions.query) {
        const origQuery = navigator.permissions.query;
        navigator.permissions.query = protect(async (param) => {
            const res = await origQuery.apply(navigator.permissions, [param]);
            if (['notifications', 'geolocation'].includes(param.name)) {
                Object.defineProperty(res, 'state', { get: () => 'granted' });
            }
            return res;
        });
    }

    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices = protect(async () => [
            { kind: 'audioinput', label: 'Internal Microphone (Generic)', deviceId: 'default', groupId: 'default' },
            { kind: 'videoinput', label: 'Integrated Webcam (Generic)', deviceId: 'default', groupId: 'default' },
            { kind: 'audiooutput', label: 'Internal Speakers', deviceId: 'default', groupId: 'default' }
        ]);
    }

    // ─── 4. WEBGL & CANVAS STEALTH ──────────────────────────────────────────
    // Spoofs high-end GPU signature (RTX 3080)
    const spoofWebGL = (proto) => {
        const getParam = proto.getParameter;
        proto.getParameter = protect(function(param) {
            const mask = {
                37445: 'Google Inc. (NVIDIA)', 
                37446: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0)', 
                7936: 'NVIDIA Corporation', 
                7937: 'NVIDIA GeForce RTX 3080' 
            };
            return mask[param] || getParam.apply(this, arguments);
        });
    };
    if (window.WebGLRenderingContext) spoofWebGL(WebGLRenderingContext.prototype);
    if (window.WebGL2RenderingContext) spoofWebGL(WebGL2RenderingContext.prototype);

    // Canvas Noise Injection
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = protect(function() {
        if (this.width > 16 && this.height > 16) {
            const ctx = this.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#00000001';
                ctx.fillRect(0, 0, 1, 1);
            }
        }
        return originalToDataURL.apply(this, arguments);
    });

    const origGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = protect(function(x, y, w, h) {
        const data = origGetImageData.apply(this, arguments);
        data.data[Math.floor(Math.random() * data.data.length)] ^= 1;
        return data;
    });

    // ─── 5. GEOMETRY & SCREEN REALISM (Linux GNOME Style) ───────────────────
    // Spoofs desktop screen dimensions on mobile devices
    Object.defineProperties(screen, {
        height: { get: protect(() => 1080) },
        width: { get: protect(() => 1920) },
        availHeight: { get: protect(() => 1052) }, // GNOME Taskbar simulation
        availWidth: { get: protect(() => 1920) },
        colorDepth: { get: protect(() => 24) },
        pixelDepth: { get: protect(() => 24) }
    });

    const origGetClientRects = Element.prototype.getClientRects;
    Element.prototype.getClientRects = protect(function() {
        const rects = origGetClientRects.apply(this, arguments);
        for (let i = 0; i < rects.length; i++) {
            Object.defineProperty(rects[i], 'width', { get: protect(() => rects[i].width + 0.00001), configurable: true });
        }
        return rects;
    });

    // ─── 6. DYNAMIC INTL, DATE & NETWORK ────────────────────────────────────
    const OriginalIntl = Intl.DateTimeFormat;
    window.Intl.DateTimeFormat = protect(function(locale, options) {
        return new OriginalIntl('en-US', { ...options, timeZone: 'America/Los_Angeles' });
    });
    window.Intl.DateTimeFormat.prototype = OriginalIntl.prototype;
    window.Intl.DateTimeFormat.supportedLocalesOf = OriginalIntl.supportedLocalesOf;
    Date.prototype.getTimezoneOffset = protect(() => 420); 

    // Battery & Connection Spoofing
    if (navigator.getBattery) {
        navigator.getBattery = protect(async () => ({ 
            charging: true, 
            level: 1.0, 
            chargingTime: 0, 
            dischargingTime: Infinity,
            addEventListener: () => {}
        }));
    }
    if (navigator.connection) {
        secureProps(navigator.connection, 'effectiveType', '4g');
        secureProps(navigator.connection, 'rtt', 50);
        secureProps(navigator.connection, 'downlink', 10);
        secureProps(navigator.connection, 'saveData', false);
    }

    // ─── 7. WEBRTC & AUDIO HARDENING ────────────────────────────────────────
    // Disables ICE servers to prevent local IP leaks via WebRTC
    const origPeer = window.RTCPeerConnection || window.webkitRTCPeerConnection;
    if (origPeer) {
        window.RTCPeerConnection = protect(function(config) {
            if (config) config.iceServers = []; 
            return new origPeer(config);
        });
        window.RTCPeerConnection.prototype = origPeer.prototype;
    }

    const spoofAudio = (proto) => {
        const origGetChannelData = proto.getChannelData;
        proto.getChannelData = protect(function() {
            const data = origGetChannelData.apply(this, arguments);
            for (let i = 0; i < data.length; i += 100) data[i] += (Math.random() - 0.5) * 0.0000001;
            return data;
        });
    };
    if (window.AudioBuffer) spoofAudio(AudioBuffer.prototype);

    // ─── 8. STORAGE LOCK & PRIVACY ──────────────────────────────────────────
    // Prevents websites from clearing or setting storage unexpectedly
    const secureStorage = (storageName) => {
        try {
            const storage = window[storageName];
            storage.setItem = protect(() => {});
            storage.clear = protect(() => {});
        } catch (e) { /* Storage lock bypassed */ }
    };
    secureStorage('localStorage');
    secureStorage('sessionStorage');

    Object.defineProperty(navigator, 'globalPrivacyControl', { get: protect(() => true), configurable: true });
    Object.defineProperty(document, 'visibilityState', { get: protect(() => 'visible') });
    Object.defineProperty(document, 'hidden', { get: protect(() => false) });

    // Blocks tracking beacons
    const originalBeacon = navigator.sendBeacon;
    navigator.sendBeacon = protect((url, data) => { 
        console.log('[Identity Hardener] Beacon blocked:', url); 
        return true; 
    });

    console.log('[Golden Master Sovereign] Identity Hardened & Stabilized (AdGuard Android Compatible).');
})();`;

export default function App() {
  const [copied, setCopied] = useState(false);
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(MERGED_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGithubPush = async () => {
    if (!githubToken) {
      setPushStatus({ type: 'error', message: 'GitHub Personal Access Token is required.' });
      return;
    }

    setIsPushing(true);
    setPushStatus(null);

    try {
      const response = await fetch('/api/github/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: githubToken,
          repoOwner: 'RE3CON',
          repoName: 'Gemini-AI',
          branch: 'main',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPushStatus({ type: 'success', message: `Successfully pushed to RE3CON/Gemini-AI! Commit: ${data.commitSha.substring(0, 7)}` });
        setTimeout(() => setShowGithubModal(false), 3000);
      } else {
        setPushStatus({ type: 'error', message: data.error || 'Failed to push to GitHub.' });
      }
    } catch (error) {
      setPushStatus({ type: 'error', message: 'An unexpected error occurred.' });
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E6E6E6] p-4 md:p-8 font-sans text-[#141414]">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-6 h-6 text-[#FF4444]" />
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#8E9299]">
                Security Protocol v12.0
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#151619]">
              Identity Hardener
            </h1>
            <p className="mt-2 text-[#8E9299] max-w-xl italic serif">
              Sovereign fingerprint protection for Google AI & LLM environments. 
              Merged Golden Master architecture with zero-blindspot hardening.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowGithubModal(true)}
              className="group relative flex items-center gap-2 bg-white border border-black/10 text-[#151619] px-6 py-3 rounded-xl hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
            >
              <Github className="w-4 h-4" />
              <span className="text-sm font-medium">Push to GitHub</span>
            </button>
            <button
              onClick={handleCopy}
              className="group relative flex items-center gap-2 bg-[#151619] text-white px-6 py-3 rounded-xl hover:bg-[#252629] transition-all active:scale-95 shadow-lg shadow-black/10"
            >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium">Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="text-sm font-medium">Copy Script</span>
              </>
            )}
          </button>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature List */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-[#151619] rounded-2xl p-6 text-white shadow-xl">
              <h2 className="text-xs font-mono tracking-widest uppercase text-[#8E9299] mb-4">
                Active Modules
              </h2>
              <ul className="space-y-4">
                <FeatureItem icon={<Cpu />} title="Hardware Spoof" desc="RTX 3080 / 16-Core / 8GB" />
                <FeatureItem icon={<Globe />} title="Network Stealth" desc="4G / GPC / WebRTC Lock" />
                <FeatureItem icon={<Lock />} title="Masking Engine" desc="toString() Protection" />
                <FeatureItem icon={<Zap />} title="Jitter Logic" desc="Timing & RAF Noise" />
                <FeatureItem icon={<Terminal />} title="GNOME Simulation" desc="Realistic Screen Geometry" />
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-black/5 shadow-sm">
              <h3 className="text-sm font-bold mb-2">How to use</h3>
              <ol className="text-xs text-[#8E9299] space-y-2 list-decimal list-inside">
                <li>Install Tampermonkey or Violentmonkey</li>
                <li>Create a new script</li>
                <li>Paste the Golden Master code</li>
                <li>Save and refresh Google AI pages</li>
              </ol>
            </div>
          </div>

          {/* Code Preview */}
          <div className="md:col-span-2">
            <div className="bg-[#151619] rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[600px]">
              <div className="px-4 py-3 bg-[#1c1d21] border-b border-white/5 flex items-center justify-between">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                </div>
                <span className="text-[10px] font-mono text-[#8E9299]">golden_master_sovereign.js</span>
              </div>
              <div className="flex-1 flex flex-col">
                <textarea
                  readOnly
                  value={MERGED_SCRIPT}
                  className="flex-1 w-full bg-transparent p-6 font-mono text-xs leading-relaxed text-[#D1D1D1] resize-none focus:outline-none selection:bg-white/20"
                  spellCheck={false}
                  placeholder="Script content will appear here..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-black/5 flex justify-between items-center text-[10px] font-mono text-[#8E9299] uppercase tracking-widest">
          <div>System Status: Operational</div>
          <div>Encryption: AES-256-GCM Equivalent</div>
        </footer>

        {/* GitHub Modal */}
        <AnimatePresence>
          {showGithubModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isPushing && setShowGithubModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl overflow-hidden"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center text-white">
                    <Github className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Push to RE3CON/Gemini-AI</h2>
                    <p className="text-xs text-[#8E9299]">Deploy current codebase to GitHub</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8E9299] mb-1.5">
                      GitHub Personal Access Token
                    </label>
                    <input
                      type="password"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxx"
                      className="w-full bg-gray-50 border border-black/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                    />
                    <p className="mt-2 text-[10px] text-[#8E9299] leading-relaxed">
                      Requires <code className="bg-gray-100 px-1 rounded">repo</code> scope. Your token is only used for this session and never stored.
                    </p>
                  </div>

                  {pushStatus && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl text-xs ${
                        pushStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {pushStatus.message}
                    </motion.div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      disabled={isPushing}
                      onClick={() => setShowGithubModal(false)}
                      className="flex-1 px-6 py-3 rounded-xl text-sm font-medium border border-black/5 hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={isPushing || !githubToken}
                      onClick={handleGithubPush}
                      className="flex-1 bg-[#151619] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#252629] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isPushing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Pushing...
                        </>
                      ) : (
                        'Confirm Push'
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-1 text-[#FF4444]">{icon}</div>
      <div>
        <div className="text-sm font-medium leading-none mb-1">{title}</div>
        <div className="text-[10px] text-[#8E9299]">{desc}</div>
      </div>
    </li>
  );
}
