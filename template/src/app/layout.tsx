import { CONFIG } from "@/config";

export const metadata = {
  title: `The 5-Minute Automation Audit · ${CONFIG.businessName}`,
  description: "Find out exactly what AI can automate in your business, what it saves you, and how to build it.",
};

// One shared stylesheet: near-black canvas, one accent, clean cards, calm type.
const CSS = `
  *{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased;
    font-family:-apple-system,'SF Pro Display','SF Pro Text','Segoe UI',Roboto,Arial,sans-serif;}
  :root{--bg:#0a0a0c;--card:#161618;--card2:#1c1c1f;--ink:#f5f5f7;--sec:rgba(235,235,245,0.6);
    --ter:rgba(235,235,245,0.34);--hair:rgba(255,255,255,0.08);--fill:rgba(235,235,245,0.06);
    --accent:${CONFIG.accent};--accent-soft:${CONFIG.accent}24;--accent-ink:#1a1406;
    --green:#32d74b;--amber:#ffd60a;--blue:#0a84ff;--red:#ff453a;}
  html{scroll-behavior:smooth;}
  body{background:var(--bg);color:var(--ink);min-height:100vh;}
  .wrap{max-width:640px;margin:0 auto;padding:28px 20px 60px;}
  .kick{font-size:12.5px;font-weight:600;color:var(--accent);}
  h1{font-size:30px;font-weight:700;letter-spacing:-0.021em;line-height:1.12;}
  .sub{font-size:15px;color:var(--sec);margin-top:8px;line-height:1.55;}
  .card{background:var(--card);border-radius:18px;padding:18px;}
  .btn{display:inline-block;background:var(--accent);color:var(--accent-ink);font-weight:700;font-size:15px;
    border:none;border-radius:99px;padding:14px 26px;cursor:pointer;text-decoration:none;transition:.15s;}
  .btn:active{transform:translateY(1px);}
  .btn:disabled{opacity:.5;cursor:default;}
  .btn2{display:inline-block;background:var(--fill);color:var(--ink);font-weight:560;font-size:14px;
    border:1px solid var(--hair);border-radius:99px;padding:11px 18px;cursor:pointer;text-decoration:none;}
  .chip{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--sec);
    background:var(--fill);border:1px solid var(--hair);border-radius:99px;padding:5px 11px;}
  input,textarea{width:100%;background:var(--fill);border:1px solid var(--hair);border-radius:14px;
    color:var(--ink);font-size:15.5px;padding:13px 15px;outline:none;font-family:inherit;}
  input:focus,textarea:focus{border-color:var(--accent);}
  ::placeholder{color:var(--ter);}
  .fade{animation:up .4s cubic-bezier(.2,.7,.2,1) both;}
  @keyframes up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
  .kit-topbar{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:12px;padding:14px 0 12px;background:var(--bg);}
  .kit-typing{display:inline-flex;align-items:center;gap:10px;margin-top:16px;background:var(--card);border-radius:99px;padding:9px 16px 9px 9px;}
  .kit-avatar{width:28px;height:28px;border-radius:50%;background:var(--accent);color:var(--accent-ink);display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;}
  .kit-dots{display:inline-flex;gap:4px;}
  .kit-dots i{width:6px;height:6px;border-radius:50%;background:var(--sec);animation:kitDot 1.2s ease-in-out infinite;}
  .kit-dots i:nth-child(2){animation-delay:.15s}
  .kit-dots i:nth-child(3){animation-delay:.3s}
  @keyframes kitDot{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}
  .kit-spin{display:inline-block;width:16px;height:16px;border:2px solid rgba(0,0,0,0.25);border-top-color:var(--accent-ink);border-radius:50%;animation:kitSpin .8s linear infinite;vertical-align:-3px;margin-right:8px;}
  @keyframes kitSpin{to{transform:rotate(360deg)}}
  select{width:100%;background:var(--fill);border:1px solid var(--hair);border-radius:14px;color:var(--ink);font-size:14.5px;padding:13px 12px;outline:none;font-family:inherit;appearance:none;cursor:pointer;}
  select:focus{border-color:var(--accent);}
  @media (min-width: 900px){
    .wrap{max-width:720px;padding-top:7vh;}
    h1{font-size:34px;}
    .sub{font-size:16px;}
  }
  .powered{margin-top:36px;text-align:center;font-size:11.5px;color:var(--ter);}
  .powered a{color:var(--ter);}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><style dangerouslySetInnerHTML={{ __html: CSS }} /></head>
      <body>
        {children}
        {CONFIG.poweredBy && (
          <div className="powered">
            <a href={CONFIG.poweredByUrl} target="_blank" rel="noreferrer">{CONFIG.poweredByLabel}</a>
          </div>
        )}
      </body>
    </html>
  );
}
