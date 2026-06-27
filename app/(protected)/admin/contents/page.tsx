export default function AdminContent() {
  return (
    <>
      <style>{`
        .acnt-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:22px 26px;position:relative;overflow:hidden;margin-bottom:18px}
        .acnt-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 230px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .acnt-hero-inner{position:relative;z-index:1}
        .acnt-hero-title{font-size:21px;font-weight:900;color:#fff;margin:0 0 3px;letter-spacing:-.025em}
        .acnt-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0}
        .acnt-placeholder{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;padding:40px 24px;text-align:center;color:#9ca3af;font-size:13.5px}
      `}</style>
      <div className="acnt-hero">
        <div className="acnt-hero-inner">
          <h1 className="acnt-hero-title">Content Management</h1>
          <p className="acnt-hero-sub">Manage homepage banners, terms, and contact page content</p>
        </div>
      </div>
      <div className="acnt-placeholder">
        Homepage banners, terms, and contact page editing will go here.
      </div>
    </>
  );
}
