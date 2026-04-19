const fs = require('fs');

const cssContent = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

:root {
  --g: #1DB954;
  --g2: #0F8C3B;
  --g3: #074D21;
  --glow: rgba(29,185,84,0.18);
  --dark: #080C09;
  --dark2: #0F1611;
  --dark3: #162019;
  --white: #FFFFFF;
  --off: #F5F7F5;
  --gray1: #F2F4F2;
  --gray2: #E4E8E4;
  --gray3: #B8C0B9;
  --gray4: #7A877B;
  --gray5: #4A5449;
  --text: #0D110E;
  --text2: #3D4A3E;
  --text3: #6B7A6C;
  --amber: #F5A623;
  --r: 12px;
  --r2: 18px;
  --r3: 24px;
}

html{scroll-behavior:smooth;}
body{font-family:'Plus Jakarta Sans',sans-serif;color:var(--text);background:var(--white);-webkit-font-smoothing:antialiased;}
a{text-decoration:none;color:inherit;}
button{font-family:'Plus Jakarta Sans',sans-serif;cursor:pointer;border:none;}

/* ═══════════════════════════════════════
   ANNOUNCEMENT BAR
═══════════════════════════════════════ */
.ann{
  background:var(--g3);
  text-align:center;padding:10px 20px;
  font-size:12.5px;color:rgba(255,255,255,0.7);
  letter-spacing:0.15px;
}
.ann b{color:#fff;}
.ann a{color:#5EE89A;margin-left:6px;font-weight:600;}

/* ═══════════════════════════════════════
   NAVBAR — frosted glass Apple-style
═══════════════════════════════════════ */
.nav{
  position:sticky;top:0;z-index:200;
  background:rgba(255,255,255,0.82);
  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  border-bottom:1px solid rgba(0,0,0,0.08);
  transition:background 0.3s;
}
.nav-inner{
  max-width:1280px;margin:0 auto;
  display:flex;align-items:center;justify-content:space-between;
  padding:0 40px;height:64px;gap:24px;
}
.nav-logo{display:flex;align-items:center;gap:9px;flex-shrink:0;}
.nav-logo-icon{
  width:34px;height:34px;background:var(--g3);border-radius:8px;
  display:flex;align-items:center;justify-content:center;
}
.nav-logo-icon svg{width:20px;height:20px;}
.nav-logo-name{font-size:17px;font-weight:700;color:var(--text);letter-spacing:-0.4px;}
.nav-logo-name span{color:var(--g2);}
.nav-search{
  flex:1;max-width:520px;
  display:flex;align-items:center;
  background:var(--gray1);border:1.5px solid var(--gray2);
  border-radius:10px;overflow:hidden;height:40px;
  transition:border-color 0.2s,box-shadow 0.2s;
}
.nav-search:focus-within{border-color:var(--g);box-shadow:0 0 0 3px var(--glow);}
.nav-search select{
  background:transparent;border:none;outline:none;
  padding:0 12px 0 14px;font-size:13px;
  color:var(--text3);font-family:'Plus Jakarta Sans',sans-serif;
  border-right:1px solid var(--gray2);height:100%;cursor:pointer;
}
.nav-search input{
  flex:1;background:transparent;border:none;outline:none;
  padding:0 12px;font-size:13.5px;color:var(--text);
  font-family:'Plus Jakarta Sans',sans-serif;
}
.nav-search input::placeholder{color:var(--gray3);}
.nav-search-btn{
  background:var(--g);border:none;padding:0 16px;height:100%;
  display:flex;align-items:center;justify-content:center;
  transition:background 0.2s;
}
.nav-search-btn:hover{background:var(--g2);}
.nav-search-btn svg{width:16px;height:16px;}
.nav-links{display:flex;align-items:center;gap:6px;flex-shrink:0;}
.nav-link{
  font-size:13.5px;font-weight:500;color:var(--text2);
  padding:7px 12px;border-radius:8px;transition:all 0.18s;white-space:nowrap;
}
.nav-link:hover{background:var(--gray1);color:var(--text);}
.nav-link.active{color:var(--g2);font-weight:600;}
.nav-actions{display:flex;align-items:center;gap:8px;flex-shrink:0;}
.nbtn{
  font-size:13.5px;font-weight:600;padding:8px 18px;border-radius:9px;
  transition:all 0.18s;white-space:nowrap;
}
.nbtn-ghost{color:var(--text2);background:transparent;border:1px solid var(--gray2);}
.nbtn-ghost:hover{border-color:var(--gray3);color:var(--text);}
.nbtn-green{background:var(--g);color:#fff;border:1px solid transparent;}
.nbtn-green:hover{background:var(--g2);}
.nbtn-outline{background:transparent;color:var(--g2);border:1.5px solid var(--g);}
.nbtn-outline:hover{background:#EBF9F0;}

/* ═══════════════════════════════════════
   HERO — Full bleed dark, Apple cinematic
═══════════════════════════════════════ */
.hero{
  background:var(--dark);
  min-height:92vh;display:flex;flex-direction:column;
  position:relative;overflow:hidden;
}
/* Ambient glow blobs */
.hero-blob{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;}
.blob1{width:600px;height:600px;background:rgba(29,185,84,0.12);top:-100px;left:-100px;}
.blob2{width:400px;height:400px;background:rgba(15,140,59,0.08);bottom:0;right:100px;}
.blob3{width:300px;height:300px;background:rgba(5,80,30,0.15);top:40%;left:50%;}
/* Grid texture */
.hero-grid{
  position:absolute;inset:0;
  background-image:
    linear-gradient(rgba(29,185,84,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(29,185,84,0.04) 1px, transparent 1px);
  background-size:60px 60px;
  mask-image:radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent);
}

.hero-content{
  position:relative;z-index:2;
  flex:1;display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  text-align:center;padding:80px 40px 60px;
}
.hero-eyebrow{
  display:inline-flex;align-items:center;gap:8px;
  background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
  border-radius:20px;padding:7px 16px;
  font-size:12px;font-weight:600;color:rgba(255,255,255,0.7);
  letter-spacing:1px;text-transform:uppercase;margin-bottom:32px;
  animation:fadeUp 0.6s ease both;
}
.hero-eyebrow-dot{width:7px;height:7px;background:var(--g);border-radius:50%;box-shadow:0 0 8px var(--g);}
.hero-h1{
  font-family:'Instrument Serif',serif;
  font-size:72px;line-height:1.05;letter-spacing:-2px;
  color:#fff;margin-bottom:28px;max-width:860px;
  animation:fadeUp 0.7s ease 0.1s both;
}
.hero-h1 .green{color:var(--g);}
.hero-h1 .italic{font-style:italic;color:rgba(255,255,255,0.75);}
.hero-sub{
  font-size:18px;line-height:1.7;
  color:rgba(255,255,255,0.55);max-width:560px;
  font-weight:300;margin-bottom:48px;
  animation:fadeUp 0.7s ease 0.2s both;
}
.hero-sub b{color:rgba(255,255,255,0.85);font-weight:600;}

/* Hero Search Bar */
.hero-searchbar{
  width:100%;max-width:720px;
  background:rgba(255,255,255,0.07);
  border:1px solid rgba(255,255,255,0.12);
  border-radius:16px;overflow:hidden;
  display:flex;align-items:stretch;
  backdrop-filter:blur(20px);
  box-shadow:0 8px 40px rgba(0,0,0,0.4);
  margin-bottom:20px;
  animation:fadeUp 0.7s ease 0.3s both;
  transition:border-color 0.2s,box-shadow 0.2s;
}
.hero-searchbar:focus-within{
  border-color:rgba(29,185,84,0.5);
  box-shadow:0 8px 40px rgba(0,0,0,0.4),0 0 0 3px rgba(29,185,84,0.15);
}
.hs-cat{
  background:rgba(255,255,255,0.06);border:none;border-right:1px solid rgba(255,255,255,0.1);
  color:rgba(255,255,255,0.6);font-family:'Plus Jakarta Sans',sans-serif;
  font-size:14px;padding:0 16px;outline:none;cursor:pointer;white-space:nowrap;
}
.hs-cat option{background:#1a2620;color:#fff;}
.hs-input{
  flex:1;background:transparent;border:none;outline:none;
  padding:18px 20px;font-size:15px;
  color:#fff;font-family:'Plus Jakarta Sans',sans-serif;
}
.hs-input::placeholder{color:rgba(255,255,255,0.3);}
.hs-btn{
  background:var(--g);color:#fff;border:none;
  padding:0 28px;font-size:15px;font-weight:600;
  font-family:'Plus Jakarta Sans',sans-serif;
  transition:background 0.2s;white-space:nowrap;
  display:flex;align-items:center;gap:8px;
}
.hs-btn:hover{background:var(--g2);}
.hero-tags{
  display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;
  animation:fadeUp 0.7s ease 0.4s both;margin-bottom:52px;
}
.hero-tags-label{font-size:13px;color:rgba(255,255,255,0.35);}
.hero-tag{
  background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);
  border-radius:20px;padding:5px 13px;font-size:13px;
  color:rgba(255,255,255,0.55);transition:all 0.2s;cursor:pointer;
}
.hero-tag:hover{background:rgba(29,185,84,0.15);border-color:rgba(29,185,84,0.4);color:var(--g);}
.hero-cta-row{
  display:flex;gap:12px;justify-content:center;flex-wrap:wrap;
  animation:fadeUp 0.7s ease 0.5s both;
}
.hcta{
  display:flex;align-items:center;gap:8px;padding:14px 28px;
  border-radius:12px;font-size:15px;font-weight:600;transition:all 0.2s;
}
.hcta-buyer{background:var(--g);color:#fff;}
.hcta-buyer:hover{background:var(--g2);transform:translateY(-1px);box-shadow:0 8px 24px rgba(29,185,84,0.3);}
.hcta-vendor{background:rgba(255,255,255,0.08);color:#fff;border:1px solid rgba(255,255,255,0.15);}
.hcta-vendor:hover{background:rgba(255,255,255,0.14);transform:translateY(-1px);}

/* Stats row at bottom of hero */
.hero-stats{
  position:relative;z-index:2;
  display:flex;justify-content:center;align-items:center;
  gap:0;border-top:1px solid rgba(255,255,255,0.07);
  padding:28px 40px;flex-wrap:wrap;
}
.hstat{
  text-align:center;padding:8px 48px;
  border-right:1px solid rgba(255,255,255,0.08);
}
.hstat:last-child{border-right:none;}
.hstat-num{
  font-family:'Instrument Serif',serif;
  font-size:36px;color:#fff;letter-spacing:-1px;line-height:1;margin-bottom:4px;
}
.hstat-num span{color:var(--g);}
.hstat-lbl{font-size:12px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.8px;}

@keyframes fadeUp{from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);}}

/* ═══════════════════════════════════════
   TRUST MARQUEE
═══════════════════════════════════════ */
.marquee-wrap{
  background:var(--dark2);border-bottom:1px solid rgba(255,255,255,0.06);
  padding:16px 0;overflow:hidden;
}
.marquee-track{
  display:flex;gap:0;
  animation:marquee 28s linear infinite;
  width:max-content;
}
.marquee-track:hover{animation-play-state:paused;}
.mitem{
  display:flex;align-items:center;gap:8px;
  padding:0 40px;border-right:1px solid rgba(255,255,255,0.06);
  font-size:13px;color:rgba(255,255,255,0.4);white-space:nowrap;
}
.mitem svg{width:14px;height:14px;flex-shrink:0;}
.mitem b{color:rgba(255,255,255,0.7);}
@keyframes marquee{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}

/* ═══════════════════════════════════════
   SECTION COMMONS
═══════════════════════════════════════ */
.sec{padding:80px 0;}
.container{max-width:1280px;margin:0 auto;padding:0 40px;}
.sec-eye{
  display:inline-block;font-size:11.5px;font-weight:700;
  text-transform:uppercase;letter-spacing:1.5px;color:var(--g2);
  margin-bottom:12px;
}
.sec-h{
  font-family:'Instrument Serif',serif;
  font-size:42px;letter-spacing:-1px;color:var(--text);
  line-height:1.1;margin-bottom:14px;
}
.sec-h b{color:var(--g2);}
.sec-sub{
  font-size:16px;color:var(--text3);max-width:520px;
  font-weight:400;line-height:1.7;
}
.sec-head-row{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:40px;flex-wrap:wrap;gap:16px;}
.link-all{
  font-size:14px;font-weight:600;color:var(--g2);
  display:flex;align-items:center;gap:4px;transition:gap 0.2s;
}
.link-all:hover{gap:8px;}

/* ═══════════════════════════════════════
   CATEGORY GRID — Others density + Apple polish
═══════════════════════════════════════ */
.cat-sec{background:var(--white);}
.cat-tabs{
  display:flex;gap:4px;margin-bottom:28px;
  border-bottom:2px solid var(--gray2);
}
.cat-tab{
  font-size:14px;font-weight:500;color:var(--text3);
  padding:10px 18px;background:none;border:none;
  border-bottom:2px solid transparent;margin-bottom:-2px;
  transition:all 0.18s;cursor:pointer;
}
.cat-tab.on{color:var(--g2);border-bottom-color:var(--g);font-weight:600;}
.cat-tab:hover:not(.on){color:var(--text);}
.cat-grid{
  display:grid;
  grid-template-columns:repeat(8,1fr);
  gap:10px;
}
.cat-card{
  background:var(--off);border:1.5px solid var(--gray2);
  border-radius:var(--r2);padding:20px 14px;
  display:flex;flex-direction:column;align-items:center;
  gap:10px;cursor:pointer;transition:all 0.22s;text-align:center;
}
.cat-card:hover{
  border-color:var(--g);background:#EBF9F0;
  transform:translateY(-3px);
  box-shadow:0 8px 24px rgba(29,185,84,0.12);
}
.cat-icon{
  width:48px;height:48px;border-radius:12px;
  background:var(--white);display:flex;align-items:center;justify-content:center;
  font-size:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);transition:transform 0.2s;
}
.cat-card:hover .cat-icon{transform:scale(1.08);}
.cat-name{font-size:12.5px;font-weight:600;color:var(--text);line-height:1.3;}
.cat-count{font-size:11px;color:var(--text3);}

/* Second row cats */
.cat-grid-2{
  display:grid;grid-template-columns:repeat(6,1fr);
  gap:10px;margin-top:10px;
}

/* ═══════════════════════════════════════
   VERIFIED VENDORS — card grid
═══════════════════════════════════════ */
.vendors-sec{background:var(--off);}
.vendor-filters{
  display:flex;gap:8px;flex-wrap:wrap;margin-bottom:28px;
}
.vf{
  background:var(--white);border:1px solid var(--gray2);
  border-radius:20px;padding:7px 16px;font-size:13px;
  font-weight:500;color:var(--text3);cursor:pointer;
  transition:all 0.18s;
}
.vf.on,.vf:hover{background:var(--g);color:#fff;border-color:var(--g);}
.vendor-grid{
  display:grid;grid-template-columns:repeat(3,1fr);
  gap:16px;
}
.vc{
  background:var(--white);border:1px solid var(--gray2);
  border-radius:var(--r2);overflow:hidden;
  transition:all 0.25s;position:relative;
}
.vc:hover{
  box-shadow:0 12px 40px rgba(0,0,0,0.1);
  border-color:var(--gray3);transform:translateY(-3px);
}
.vc-top{
  padding:20px 20px 0;
  display:flex;justify-content:space-between;align-items:flex-start;
}
.vc-logo{
  width:56px;height:56px;background:var(--off);border-radius:12px;
  display:flex;align-items:center;justify-content:center;
  font-family:'Instrument Serif',serif;font-size:22px;
  color:var(--g3);font-weight:400;border:1px solid var(--gray2);
}
.vc-badges{display:flex;flex-direction:column;gap:5px;align-items:flex-end;}
.eco-badge{
  font-size:10.5px;font-weight:700;padding:3px 10px;border-radius:4px;
  letter-spacing:0.5px;text-transform:uppercase;
}
.eco-plat{background:#0A3D2B;color:#5EE8A8;}
.eco-gold{background:#5C3800;color:#FFBB44;}
.eco-silver{background:#2A3030;color:#A8C0BC;}
.eco-bronze{background:#3A1A00;color:#E8943A;}
.bl-check{
  font-size:10px;font-weight:600;color:var(--g2);
  display:flex;align-items:center;gap:4px;
}
.bl-dot{width:6px;height:6px;background:var(--g);border-radius:50%;}
.vc-body{padding:14px 20px 16px;}
.vc-name{font-size:16px;font-weight:700;color:var(--text);margin-bottom:2px;}
.vc-cat{font-size:12.5px;color:var(--text3);margin-bottom:10px;}
.vc-tags{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px;}
.vc-tag{
  background:var(--off);border:1px solid var(--gray2);
  font-size:11px;font-weight:500;color:var(--text2);
  padding:3px 8px;border-radius:4px;
}
.vc-score-bar{margin-bottom:12px;}
.vc-score-label{
  display:flex;justify-content:space-between;
  font-size:11.5px;color:var(--text3);margin-bottom:5px;
}
.vc-score-track{height:4px;background:var(--gray2);border-radius:2px;}
.vc-score-fill{height:4px;background:var(--g);border-radius:2px;}
.vc-footer{
  display:flex;justify-content:space-between;align-items:center;
  padding:12px 20px;border-top:1px solid var(--gray2);
}
.vc-loc{font-size:12px;color:var(--text3);display:flex;align-items:center;gap:4px;}
.vc-loc svg{width:12px;height:12px;}
.btn-rfq{
  background:var(--g);color:#fff;font-size:12.5px;font-weight:600;
  padding:7px 18px;border-radius:7px;border:none;
  transition:all 0.18s;font-family:'Plus Jakarta Sans',sans-serif;
}
.btn-rfq:hover{background:var(--g2);}
.vc-verified-strip{
  background:#EBF9F0;padding:7px 20px;
  display:flex;align-items:center;gap:6px;
  font-size:11.5px;font-weight:600;color:var(--g3);
  border-top:1px solid #C5EED5;
}

/* ═══════════════════════════════════════
   HOW IT WORKS — Apple stepped layout
═══════════════════════════════════════ */
.how-sec{background:var(--white);}
.how-tabs-wrap{
  display:flex;gap:4px;
  background:var(--off);border-radius:12px;padding:4px;
  width:fit-content;margin-bottom:48px;
  border:1px solid var(--gray2);
}
.htab{
  padding:10px 24px;border-radius:9px;font-size:14px;font-weight:600;
  color:var(--text3);background:none;border:none;cursor:pointer;
  transition:all 0.2s;font-family:'Plus Jakarta Sans',sans-serif;
}
.htab.on{background:var(--white);color:var(--text);box-shadow:0 1px 4px rgba(0,0,0,0.08);}
.how-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;}
.how-step{
  background:var(--off);border:1px solid var(--gray2);
  border-radius:var(--r2);padding:28px 24px;
  position:relative;overflow:hidden;transition:all 0.22s;
}
.how-step:hover{border-color:var(--g);transform:translateY(-2px);box-shadow:0 8px 24px rgba(29,185,84,0.1);}
.how-step-arrow{
  position:absolute;right:-16px;top:50%;transform:translateY(-50%);
  width:32px;height:32px;background:var(--white);border:1px solid var(--gray2);
  border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:14px;z-index:2;
}
.how-step:last-child .how-step-arrow{display:none;}
.how-num{
  font-family:'Instrument Serif',serif;font-size:52px;
  color:var(--gray2);line-height:1;margin-bottom:16px;font-weight:400;
}
.how-step.active .how-num{color:var(--g);}
.how-icon{font-size:28px;margin-bottom:12px;}
.how-title{font-size:15px;font-weight:700;color:var(--text);margin-bottom:6px;}
.how-desc{font-size:13px;color:var(--text3);line-height:1.6;}

/* ═══════════════════════════════════════
   WHY US — dark cinematic section
═══════════════════════════════════════ */
.why-sec{
  background:var(--dark);
  position:relative;overflow:hidden;
  padding:80px 0;
}
.why-blob{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;}
.wb1{width:500px;height:500px;background:rgba(29,185,84,0.08);top:-100px;right:-100px;}
.wb2{width:300px;height:300px;background:rgba(7,77,33,0.12);bottom:0;left:100px;}
.why-inner{
  position:relative;z-index:1;
  display:grid;grid-template-columns:1fr 1fr;
  gap:60px;align-items:start;
}
.why-left .sec-h{color:#fff;}
.why-left .sec-sub{color:rgba(255,255,255,0.5);}
.why-feats{display:flex;flex-direction:column;gap:20px;margin-top:40px;}
.wf{
  display:flex;gap:16px;align-items:flex-start;
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
  border-radius:var(--r2);padding:20px;transition:all 0.2s;
}
.wf:hover{background:rgba(29,185,84,0.08);border-color:rgba(29,185,84,0.2);}
.wf-icon{
  width:44px;height:44px;background:rgba(29,185,84,0.1);border-radius:10px;
  display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;
}
.wf-title{font-size:15px;font-weight:600;color:#fff;margin-bottom:4px;}
.wf-desc{font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;}

/* Compare table */
.compare-wrap{
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
  border-radius:var(--r2);overflow:hidden;
}
.compare-wrap table{width:100%;border-collapse:collapse;}
.compare-wrap th{
  padding:14px 16px;font-size:11.5px;font-weight:600;
  text-transform:uppercase;letter-spacing:0.8px;
  text-align:center;background:rgba(255,255,255,0.06);
  color:rgba(255,255,255,0.45);
}
.compare-wrap th:first-child{text-align:left;}
.compare-wrap th.hl{color:var(--g);font-weight:700;}
.compare-wrap td{
  padding:12px 16px;font-size:13px;
  border-top:1px solid rgba(255,255,255,0.06);
  color:rgba(255,255,255,0.65);text-align:center;
}
.compare-wrap td:first-child{text-align:left;}
.compare-wrap td.hl{color:var(--g);font-weight:700;}
.compare-wrap tr:hover td{background:rgba(255,255,255,0.03);}
.cy{color:#4ADE80;font-size:16px;}
.cn{color:rgba(255,255,255,0.2);font-size:14px;}
.cm{color:rgba(255,255,255,0.3);font-size:13px;}

/* ═══════════════════════════════════════
   BROWN LENS — feature highlight
═══════════════════════════════════════ */
.bl-sec{background:var(--off);}
.bl-grid{
  display:grid;grid-template-columns:1fr 1fr;
  gap:48px;align-items:start;
}
.bl-criteria{display:flex;flex-direction:column;gap:12px;}
.blc{
  background:var(--white);border:1px solid var(--gray2);
  border-radius:var(--r);padding:18px 20px;
  display:flex;align-items:flex-start;gap:16px;
  transition:all 0.2s;cursor:default;
}
.blc:hover{border-color:var(--g);box-shadow:0 4px 16px rgba(29,185,84,0.08);}
.blc-num{
  width:32px;height:32px;background:#EBF9F0;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:700;color:var(--g2);flex-shrink:0;
}
.blc h5{font-size:14px;font-weight:700;color:var(--text);margin-bottom:3px;}
.blc p{font-size:12.5px;color:var(--text3);line-height:1.5;}
.bl-panel{
  background:var(--dark);border-radius:var(--r3);padding:40px;
  position:sticky;top:80px;
}
.bl-panel-badge{
  display:inline-flex;align-items:center;gap:8px;
  background:rgba(29,185,84,0.1);border:1px solid rgba(29,185,84,0.2);
  border-radius:8px;padding:8px 16px;
  font-size:13px;font-weight:600;color:var(--g);margin-bottom:24px;
}
.bl-panel h3{
  font-family:'Instrument Serif',serif;
  font-size:30px;color:#fff;letter-spacing:-0.5px;margin-bottom:14px;
}
.bl-panel p{font-size:14.5px;color:rgba(255,255,255,0.55);line-height:1.7;margin-bottom:24px;}
.eco-tiers{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:28px;}
.tier-pill{
  padding:8px 16px;border-radius:20px;font-size:13px;font-weight:600;
}
.t-br{background:rgba(200,100,30,0.15);color:#E8943A;}
.t-si{background:rgba(150,170,170,0.15);color:#A8C0BC;}
.t-go{background:rgba(200,160,30,0.15);color:#FFBB44;}
.t-pl{background:rgba(29,185,84,0.15);color:#5EE8A8;}
.bl-cta{
  display:flex;align-items:center;justify-content:space-between;
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
  border-radius:var(--r);padding:14px 18px;transition:all 0.2s;cursor:pointer;
}
.bl-cta:hover{background:rgba(29,185,84,0.08);border-color:rgba(29,185,84,0.2);}
.bl-cta span{font-size:14px;font-weight:600;color:#fff;}
.bl-cta-arr{color:var(--g);font-size:18px;}

/* ═══════════════════════════════════════
   TESTIMONIALS
═══════════════════════════════════════ */
.testi-sec{background:var(--white);}
.testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
.tc{
  background:var(--off);border:1px solid var(--gray2);
  border-radius:var(--r2);padding:28px;display:flex;flex-direction:column;gap:16px;
  transition:all 0.2s;
}
.tc:hover{box-shadow:0 8px 32px rgba(0,0,0,0.07);transform:translateY(-2px);}
.tc-stars{color:var(--g);font-size:14px;letter-spacing:2px;}
.tc-quote{
  font-size:15px;color:var(--text2);line-height:1.7;
  font-style:italic;flex:1;
}
.tc-quote::before{
  content:'"';font-family:'Instrument Serif',serif;
  font-size:44px;color:var(--gray2);line-height:0;
  vertical-align:-16px;margin-right:2px;
}
.tc-person{
  display:flex;align-items:center;gap:12px;
  border-top:1px solid var(--gray2);padding-top:16px;
}
.tc-av{
  width:42px;height:42px;border-radius:50%;background:#EBF9F0;
  display:flex;align-items:center;justify-content:center;
  font-weight:700;font-size:14px;color:var(--g2);
}
.tc-name{font-size:14px;font-weight:700;color:var(--text);}
.tc-role{font-size:12px;color:var(--text3);}
.tc-type{
  margin-left:auto;font-size:10.5px;font-weight:700;
  padding:3px 9px;border-radius:4px;text-transform:uppercase;letter-spacing:0.5px;
}
.tc-buyer{background:#EBF9F0;color:var(--g2);}
.tc-vendor{background:#FFF3E0;color:#C07000;}

/* ═══════════════════════════════════════
   PRICING — Apple style cards
═══════════════════════════════════════ */
.price-sec{background:var(--off);}
.price-toggle{
  display:flex;align-items:center;gap:12px;margin-bottom:40px;
}
.price-toggle span{font-size:14px;color:var(--text3);}
.toggle{
  width:46px;height:26px;background:var(--g);border-radius:13px;
  position:relative;cursor:pointer;
}
.toggle-k{
  width:20px;height:20px;background:#fff;border-radius:50%;
  position:absolute;top:3px;right:3px;
  box-shadow:0 1px 4px rgba(0,0,0,0.2);transition:transform 0.2s;
}
.price-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
.pc{
  background:var(--white);border:1px solid var(--gray2);
  border-radius:var(--r2);padding:28px 24px;
  position:relative;display:flex;flex-direction:column;
  transition:all 0.22s;
}
.pc:hover{box-shadow:0 12px 40px rgba(0,0,0,0.09);transform:translateY(-3px);}
.pc.pop{
  background:var(--dark);border-color:var(--dark);
  box-shadow:0 12px 48px rgba(8,12,9,0.25);
}
.pop-label{
  position:absolute;top:-11px;left:50%;transform:translateX(-50%);
  background:var(--g);color:#fff;font-size:11px;font-weight:700;
  padding:4px 14px;border-radius:10px;letter-spacing:0.5px;white-space:nowrap;
}
.pc-tier{font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text3);margin-bottom:6px;}
.pc.pop .pc-tier{color:rgba(255,255,255,0.4);}
.pc-name{font-size:20px;font-weight:700;color:var(--text);margin-bottom:6px;}
.pc.pop .pc-name{color:#fff;}
.pc-desc{font-size:13px;color:var(--text3);min-height:36px;margin-bottom:20px;line-height:1.5;}
.pc.pop .pc-desc{color:rgba(255,255,255,0.5);}
.pc-price{
  font-family:'Instrument Serif',serif;
  font-size:40px;color:var(--text);letter-spacing:-1px;line-height:1;margin-bottom:4px;
}
.pc.pop .pc-price{color:#fff;}
.pc-period{font-size:13px;color:var(--text3);margin-bottom:24px;}
.pc.pop .pc-period{color:rgba(255,255,255,0.4);}
.pc-feats{list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:28px;flex:1;}
.pc-feats li{
  font-size:13px;color:var(--text2);
  display:flex;align-items:flex-start;gap:8px;
}
.pc.pop .pc-feats li{color:rgba(255,255,255,0.7);}
.pc-feats li::before{content:'✓';color:var(--g);font-weight:700;flex-shrink:0;margin-top:1px;}
.pc-btn{
  width:100%;padding:12px;border-radius:var(--r);
  font-size:14px;font-weight:700;cursor:pointer;
  font-family:'Plus Jakarta Sans',sans-serif;text-align:center;
  transition:all 0.18s;
}
.pc-btn-out{background:transparent;color:var(--g2);border:1.5px solid var(--g);}
.pc-btn-out:hover{background:#EBF9F0;}
.pc-btn-solid{background:rgba(29,185,84,0.9);color:#fff;border:none;}
.pc-btn-solid:hover{background:var(--g);}

/* ═══════════════════════════════════════
   FINAL CTA — Apple dark cinematic
═══════════════════════════════════════ */
.fcta-sec{
  background:var(--dark);
  position:relative;overflow:hidden;padding:100px 0;
}
.fcta-blob1{position:absolute;width:600px;height:600px;background:rgba(29,185,84,0.07);border-radius:50%;filter:blur(80px);top:-200px;left:-100px;}
.fcta-blob2{position:absolute;width:400px;height:400px;background:rgba(7,77,33,0.1);border-radius:50%;filter:blur(80px);bottom:-100px;right:0;}
.fcta-inner{
  position:relative;z-index:1;
  max-width:1280px;margin:0 auto;padding:0 40px;
}
.fcta-top{text-align:center;margin-bottom:60px;}
.fcta-h{
  font-family:'Instrument Serif',serif;
  font-size:56px;color:#fff;letter-spacing:-2px;margin-bottom:18px;
}
.fcta-h .green{color:var(--g);}
.fcta-sub{font-size:18px;color:rgba(255,255,255,0.45);max-width:480px;margin:0 auto 36px;line-height:1.7;}
.fcta-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}
.fbtn{
  display:flex;align-items:center;gap:8px;padding:16px 32px;
  border-radius:12px;font-size:16px;font-weight:700;transition:all 0.2s;
}
.fbtn-buyer{background:var(--g);color:#fff;}
.fbtn-buyer:hover{background:var(--g2);transform:translateY(-2px);box-shadow:0 12px 32px rgba(29,185,84,0.3);}
.fbtn-vendor{background:rgba(255,255,255,0.08);color:#fff;border:1px solid rgba(255,255,255,0.15);}
.fbtn-vendor:hover{background:rgba(255,255,255,0.14);transform:translateY(-2px);}

.fcta-cards{
  display:grid;grid-template-columns:1fr 1fr;gap:20px;
}
.fcta-card{
  background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);
  border-radius:var(--r2);padding:32px;transition:all 0.2s;
}
.fcta-card:hover{background:rgba(29,185,84,0.06);border-color:rgba(29,185,84,0.2);}
.fcta-card-icon{font-size:32px;margin-bottom:14px;}
.fcta-card h3{
  font-family:'Instrument Serif',serif;
  font-size:26px;color:#fff;margin-bottom:10px;letter-spacing:-0.3px;
}
.fcta-card p{font-size:14.5px;color:rgba(255,255,255,0.5);line-height:1.7;margin-bottom:20px;}
.fcta-card-btn{
  display:inline-flex;align-items:center;gap:8px;
  background:var(--g);color:#fff;
  padding:12px 24px;border-radius:10px;
  font-size:14px;font-weight:700;transition:all 0.2s;
}
.fcta-card-btn:hover{background:var(--g2);}
.fcta-card-btn.dark{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);}
.fcta-card-btn.dark:hover{background:rgba(255,255,255,0.18);}

/* ═══════════════════════════════════════
   FOOTER
═══════════════════════════════════════ */
footer{background:#050A06;padding:60px 0 0;}
.footer-grid{
  max-width:1280px;margin:0 auto;padding:0 40px 48px;
  display:grid;grid-template-columns:2.5fr 1fr 1fr 1fr 1fr;gap:40px;
}
.footer-brand-name{
  font-family:'Instrument Serif',serif;
  font-size:24px;color:#fff;letter-spacing:-0.5px;
}
.footer-brand-name span{color:var(--g);}
.footer-brand-sub{
  font-size:13px;color:rgba(255,255,255,0.35);
  line-height:1.7;margin:14px 0 20px;max-width:260px;
}
.footer-badges{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:20px;}
.fbadge{
  background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
  border-radius:5px;padding:5px 10px;
  font-size:11px;color:rgba(255,255,255,0.4);font-weight:500;
}
.footer-social{display:flex;gap:8px;}
.fsoc{
  width:34px;height:34px;background:rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.09);border-radius:8px;
  display:flex;align-items:center;justify-content:center;
  font-size:16px;transition:all 0.2s;cursor:pointer;
}
.fsoc:hover{background:rgba(29,185,84,0.1);border-color:rgba(29,185,84,0.2);}
.footer-col h5{
  font-size:11px;font-weight:700;text-transform:uppercase;
  letter-spacing:1.2px;color:rgba(255,255,255,0.3);margin-bottom:16px;
}
.footer-col a{
  display:block;font-size:13.5px;
  color:rgba(255,255,255,0.55);margin-bottom:10px;transition:color 0.18s;
}
.footer-col a:hover{color:var(--g);}
.footer-bottom{
  border-top:1px solid rgba(255,255,255,0.07);
  max-width:1280px;margin:0 auto;padding:20px 40px;
  display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;
}
.footer-bottom-left p{font-size:12px;color:rgba(255,255,255,0.25);}
.footer-bottom-right{display:flex;gap:20px;align-items:center;}
.footer-bottom-right a{font-size:12px;color:rgba(255,255,255,0.25);transition:color 0.2s;}
.footer-bottom-right a:hover{color:rgba(255,255,255,0.6);}
.cin{
  font-size:11px;color:rgba(255,255,255,0.2);font-family:monospace;
  background:rgba(255,255,255,0.04);padding:3px 8px;border-radius:4px;
}

/* ═══════════════════════════════════════
   RESPONSIVE
═══════════════════════════════════════ */
@media(max-width:1100px){
  .cat-grid{grid-template-columns:repeat(4,1fr);}
  .cat-grid-2{grid-template-columns:repeat(4,1fr);}
}
@media(max-width:900px){
  .nav-links{display:none;}
  .nav-search{display:none;}
  .hero-h1{font-size:44px;}
  .cat-grid{grid-template-columns:repeat(3,1fr);}
  .cat-grid-2{grid-template-columns:repeat(3,1fr);}
  .vendor-grid,.why-inner,.bl-grid,.fcta-cards{grid-template-columns:1fr;}
  .how-steps{grid-template-columns:1fr 1fr;}
  .price-grid{grid-template-columns:1fr 1fr;}
  .testi-grid{grid-template-columns:1fr;}
  .footer-grid{grid-template-columns:1fr 1fr;}
  .container,.nav-inner,.hero-content,.hero-stats,.footer-grid,.footer-bottom,.fcta-inner{padding-left:20px;padding-right:20px;}
  .hstat{padding:8px 24px;}
}
@media(max-width:600px){
  .hero-h1{font-size:34px;}
  .cat-grid{grid-template-columns:repeat(2,1fr);}
  .how-steps,.price-grid,.fcta-cards{grid-template-columns:1fr;}
  .sec-h{font-size:32px;}
}
`;

fs.appendFileSync('app/globals.css', "\\n" + cssContent);
console.log("Appended CSS to globals.css");
