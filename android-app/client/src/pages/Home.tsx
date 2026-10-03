/* Reference-matched app design: soft botanical cream, rounded tactile cards, calm green status accents, compact telemetry, and a persistent mobile bottom bar. */
import { useEffect, useState } from "react";
import {
  ArrowLeft, BatteryCharging, Bluetooth, Bot, Check, ChevronRight, CircleHelp, Eye, Gauge, Gamepad2, Globe2, Home as HomeIcon, Leaf, LockKeyhole, MapPin, Menu, MoreVertical, Navigation, Radio, RotateCcw, ScanLine, Settings as SettingsIcon, Signal, SlidersHorizontal, Thermometer, UserRound, Wifi, Wind, X,
} from "lucide-react";


type Tab = "mission" | "drive" | "analysis" | "settings";

function MiniBar({ value, tone = "green" }: { value: number; tone?: "green" | "purple" }) {
  return <div className={`mini-bar ${tone}`}><span style={{ width: `${value}%` }} /></div>;
}

function TopBar({ onMenu }: { onMenu?: () => void }) {
  return <div className="topbar"><span className="app-name">DEMETRIOS 2</span><button className="icon-button" onClick={onMenu} aria-label="Open menu"><MoreVertical size={19} /></button></div>;
}

function SystemOverview({ onDrive, onMenu }: { onDrive: () => void; onMenu: () => void }) {
  return <div className="screen mission-screen"><TopBar onMenu={onMenu} /><div className="screen-title-row"><div><h1>System overview</h1></div><div className="signal-bars"><Signal size={17} /></div></div>
    <section className="rover-card"><div className="rover-heading"><div className="rover-avatar"><Bot size={20} /></div><div><h2>DEM-07 · Garage rover</h2><p><span className="status-dot" /> <strong>LIVE</strong> · updated 420 ms ago</p></div></div><div className="connection-row"><Bluetooth size={15} /> Bluetooth + <Wifi size={15} /> Wi-Fi connected</div></section>
    <section className="path-card"><div className="card-heading"><strong>Live mission path</strong><span>Link confidence 98%</span></div><div className="path-body"><svg viewBox="0 0 170 110" className="mission-svg" aria-label="Live mission path"><path d="M15 86 C35 74 34 57 58 52 S82 25 96 48 S115 79 123 56 S137 47 150 28" fill="none" stroke="#31a765" strokeWidth="2" /><circle cx="15" cy="86" r="5" fill="#31a765" /><path d="M143 25l12 0-7 8" fill="none" stroke="#31a765" strokeWidth="2" /></svg><div className="path-stats"><div><Signal size={16} /><strong>18 packets/s</strong></div><div><MapPin size={17} /><span>No GPS fix ·<br />awaiting rover lock</span></div></div></div></section>
    <section className="stats-row"><div><BatteryCharging /><span>Battery</span><strong>82% · 12.4 V</strong></div><div><Gauge /><span>Speed</span><strong>0.0 m/s</strong></div><div><Signal /><span>Signal</span><strong>−54 dBm</strong></div></section>
    <section className="sensor-card"><div className="motor-side"><div><span>Left motor</span><strong>61%</strong><MiniBar value={78} /></div><div><span>Right motor</span><strong>59%</strong><MiniBar value={74} /></div><div className="balance"><span>⚖ Balance</span><strong>+2%</strong></div></div><div className="climate-side"><div><Thermometer /><strong>24.8<span>°C</span></strong></div><div><Wind /><strong>58<span>% RH</span></strong></div><small>Updated 1.2 s ago</small></div></section>
    <button className="drive-cta" onClick={onDrive}><Gamepad2 size={18} /> Open live drive <ChevronRight size={18} /></button><div className="nominal"><Check size={15} /> All systems nominal</div>
  </div>;
}

function Drive({ onBack }: { onBack: () => void }) {
  const [command, setCommand] = useState("STANDBY");
  const [speed, setSpeed] = useState(0);
  const send = (cmd: string) => { setCommand(cmd); setSpeed(cmd === "STOP" ? 0 : 0.8); };
  return <div className="screen sub-screen"><div className="sub-header"><button className="round-button" onClick={onBack}><ArrowLeft size={18} /></button><div><span className="tiny-label">DEM-07 / PILOT MODE</span><h1>Live drive</h1></div><span className="live-chip"><span className="status-dot" /> LIVE</span></div><section className="drive-map"><div className="map-grid" /><div className="rover-marker"><Bot size={25} /></div><div className="map-label"><MapPin size={14} /> GARAGE FLOOR / NO GPS</div><span className="map-coord">X 018.2<br />Y 042.9</span></section><div className="drive-readout"><div><span>COMMAND</span><strong>{command}</strong></div><div><span>SPEED</span><strong>{speed.toFixed(1)} <small>m/s</small></strong></div><div><span>BATTERY</span><strong>82%</strong></div></div><section className="drive-pad"><button onClick={() => send("FORWARD")} className="pad-up">↑</button><button onClick={() => send("LEFT")} className="pad-left">←</button><button onClick={() => send("STOP")} className="pad-stop">STOP</button><button onClick={() => send("RIGHT")} className="pad-right">→</button><button onClick={() => send("REVERSE")} className="pad-down">↓</button></section><div className="drive-hint"><Radio size={16} /> Commands are simulated until the hardware link is connected.</div></div>;
}

function Analysis() {
  return <div className="screen sub-screen"><TopBar /><div className="screen-title-row"><div><span className="tiny-label">FIELD DATA / 24H</span><h1>Analysis</h1></div><button className="round-button"><ScanLine size={18} /></button></div><section className="analysis-hero"><div><span>FIELD HEALTH</span><strong>Good</strong><p>Based on 128 sensor readings.</p></div><div className="ring"><span>78</span><small>score</small></div></section><section className="analysis-card"><div className="card-heading"><strong>Soil moisture</strong><span>68% <ArrowLeft size={14} /></span></div><div className="large-chart"><svg viewBox="0 0 340 120" preserveAspectRatio="none"><path d="M0 91 C22 84 28 72 50 76 S81 49 106 70 S134 73 160 53 S192 60 212 45 S235 56 254 42 S282 25 302 38 S325 20 340 14 V120H0Z" fill="#cceedd" /><path d="M0 91 C22 84 28 72 50 76 S81 49 106 70 S134 73 160 53 S192 60 212 45 S235 56 254 42 S282 25 302 38 S325 20 340 14" fill="none" stroke="#2d9e62" strokeWidth="3" /></svg><div><span>06:00</span><span>12:00</span><span>18:00</span><span>NOW</span></div></div></section><section className="recommend-card"><div className="leaf-icon"><Leaf size={20} /></div><div><span className="tiny-label">CROP RECOMMENDATION</span><h2>Chickpea</h2><p>Strong fit for current soil moisture, temperature, and NPK readings.</p></div><ChevronRight size={18} /></section><div className="analysis-image field-fallback" aria-label="Rover scanning field soil"><div className="field-lines" /><span>FIELD SCAN · DEM-07</span></div></div>;
}

function Settings({ onLogin }: { onLogin: () => void }) {
  return <div className="screen sub-screen"><TopBar /><div className="screen-title-row"><div><span className="tiny-label">SYSTEM PREFERENCES</span><h1>Settings</h1></div><SettingsIcon size={21} /></div><section className="profile-card"><div className="profile-avatar"><UserRound size={22} /></div><div><strong>Garage operator</strong><span>Local demo profile</span></div><ChevronRight size={18} /></section><section className="settings-list"><div><div className="setting-icon"><Bluetooth size={17} /></div><div><strong>Connection</strong><span>Bluetooth + Wi-Fi · connected</span></div><span className="switch on" /></div><div><div className="setting-icon"><Eye size={17} /></div><div><strong>Demo mode</strong><span>Use sample telemetry values</span></div><span className="switch on" /></div><div><div className="setting-icon"><CircleHelp size={17} /></div><div><strong>Diagnostics</strong><span>Run a full rover health check</span></div><ChevronRight size={18} /></div></section><button className="login-link" onClick={onLogin}><LockKeyhole size={16} /> Open login screen <ChevronRight size={16} /></button></div>;
}

function Login({ onBack }: { onBack: () => void }) {
  return <div className="login-screen"><button className="round-button login-back" onClick={onBack}><ArrowLeft size={18} /></button><div className="login-mark"><div className="login-logo-fallback">D</div></div><span className="tiny-label">DEMETRIOS / FIELD INTELLIGENCE</span><h1>Log in</h1><p>It's time to return to the soil. Log in to your account and keep growing.</p><label>Email<div className="input-wrap"><input placeholder="you@example.com" /><UserRound size={17} /></div></label><label>Password<div className="input-wrap"><input type="password" placeholder="Enter your password" /><Eye size={17} /></div></label><div className="remember"><span><i /> Remember Me</span><a href="#settings">Forgot Password</a></div><button className="login-button" onClick={onBack}>Log in</button><div className="or"><span /> Or <span /></div><div className="socials"><button><Globe2 size={17} /> Google</button><button><span className="apple">●</span> Apple</button></div><p className="signup">Do not have an account yet? <a href="#settings">Sign Up</a></p></div>;
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("mission");
  const [login, setLogin] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => { document.body.classList.add("app-body"); return () => document.body.classList.remove("app-body"); }, []);
  if (login) return <Login onBack={() => setLogin(false)} />;
  return <div className="app-frame"><div className="app-content">{tab === "mission" && <SystemOverview onDrive={() => setTab("drive")} onMenu={() => setMenu(!menu)} />}{tab === "drive" && <Drive onBack={() => setTab("mission")} />}{tab === "analysis" && <Analysis />}{tab === "settings" && <Settings onLogin={() => setLogin(true)} />}</div><nav className="bottom-nav"><button className={tab === "mission" ? "active" : ""} onClick={() => setTab("mission")}><HomeIcon size={18} /><span>Mission</span></button><button className={tab === "drive" ? "active" : ""} onClick={() => setTab("drive")}><Navigation size={18} /><span>Drive</span></button><button className={tab === "analysis" ? "active" : ""} onClick={() => setTab("analysis")}><SlidersHorizontal size={18} /><span>Analysis</span></button><button className={tab === "settings" ? "active" : ""} onClick={() => setTab("settings")}><SettingsIcon size={18} /><span>Settings</span></button></nav>{menu && <div className="quick-menu"><button onClick={() => setMenu(false)}><X size={16} /> Close</button><span>DEM-07 / local demo</span><span>Firmware 0.9.4</span></div>}</div>;
}
