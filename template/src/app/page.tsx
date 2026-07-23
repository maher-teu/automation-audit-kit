import { CONFIG } from "@/config";
import Hero from "@/components/hero";
import StartButton from "@/components/start-btn";

// The landing page: one promise, one button. The audit itself does the selling.
export default function Landing() {
  return (
    <main className="wrap" style={{ paddingTop: 64, textAlign: "center" }}>
      <div className="kick fade">{CONFIG.businessName} · free, 5 minutes</div>
      <h1 className="fade" style={{ marginTop: 10, fontSize: 34 }}>
        Find out exactly what AI can automate in your business
      </h1>
      <p className="sub fade" style={{ maxWidth: 480, margin: "12px auto 0" }}>
        Answer a few questions, speak or tap, no typing needed. {CONFIG.agentName}, an AI consultant,
        interviews you like a human would, then hands you a personal map: what to automate, what each
        one saves or makes you, and exactly how to build it.
      </p>
      <Hero />
      <div className="fade" style={{ marginTop: 30 }}>
        <StartButton href="/audit">Start the free audit</StartButton>
      </div>
      <div className="fade" style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <span className="chip">Speak your answers</span>
        <span className="chip">Personal, not generic</span>
        <span className="chip">Copy-paste build plans included</span>
      </div>
      <p className="sub fade" style={{ marginTop: 40, fontSize: 13, color: "var(--ter)" }}>
        Built by {CONFIG.ownerName}. If you want your #1 automation built for you, free, there is a
        button for that at the end.
      </p>
    </main>
  );
}
