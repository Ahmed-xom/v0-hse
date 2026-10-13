"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

const INTRO_KEY = "amnko-hse-intro-seen"
const INTRO_DURATION = 2200

export function AmnkoIntro() {
  const [visible, setVisible] = useState<boolean | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    setReducedMotion(prefersReducedMotion)

    if (window.sessionStorage.getItem(INTRO_KEY) === "true") {
      setVisible(false)
      return
    }

    window.sessionStorage.setItem(INTRO_KEY, "true")
    const timeout = window.setTimeout(() => setVisible(false), prefersReducedMotion ? 650 : INTRO_DURATION)
    return () => window.clearTimeout(timeout)
  }, [])

  if (visible !== true) return null

  return (
    <div
      className={`amnko-intro ${reducedMotion ? "amnko-intro-reduced" : ""}`}
      role="status"
      aria-label="AMNKO HSE Management System loading"
    >
      <div className="amnko-intro-grid" aria-hidden="true" />
      <div className="amnko-intro-glow" aria-hidden="true" />
      <div className="amnko-intro-lines" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="amnko-intro-content">
        <div className="amnko-intro-logo-wrap">
          <div className="amnko-intro-logo-sweep" aria-hidden="true" />
          <Image
            src="/amnko-hse-logo.png"
            alt="AMNKO HSE"
            width={260}
            height={260}
            priority
            className="amnko-intro-logo"
          />
        </div>
        <p className="amnko-intro-kicker">AMNKO HSE</p>
        <h1>AMNKO | HSE Management System</h1>
        <p className="amnko-intro-tagline">Safety <span aria-hidden="true">•</span> Compliance <span aria-hidden="true">•</span> Excellence</p>
      </div>
    </div>
  )
}

/* Kept local to the intro so the animation cannot affect application layout. */
const introStyles = `
.amnko-intro {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  overflow: hidden;
  isolation: isolate;
  color: #f4f8ff;
  background: #071426;
  animation: amnko-intro-exit 520ms cubic-bezier(.22, 1, .36, 1) 1.78s forwards;
}
.amnko-intro-content { position: relative; z-index: 3; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 1.5rem; }
.amnko-intro-logo-wrap { position: relative; display: grid; place-items: center; width: min(48vw, 260px); height: min(48vw, 260px); animation: amnko-logo-enter 900ms cubic-bezier(.22, 1, .36, 1) both; }
.amnko-intro-logo { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 0 28px rgba(60, 151, 230, .34)); }
.amnko-intro-logo-sweep { position: absolute; z-index: 2; width: 24%; height: 150%; transform: translateX(-250%) rotate(18deg); background: linear-gradient(90deg, transparent, rgba(255,255,255,.48), transparent); mix-blend-mode: screen; animation: amnko-sweep 760ms ease-in 720ms both; }
.amnko-intro-kicker { margin: 1.3rem 0 .55rem; color: #66b5ef; font-size: .7rem; font-weight: 700; letter-spacing: .3em; text-transform: uppercase; animation: amnko-copy-enter 650ms ease-out 550ms both; }
.amnko-intro h1 { margin: 0; max-width: 28rem; font-size: clamp(1.35rem, 3vw, 2rem); font-weight: 600; letter-spacing: -.025em; text-wrap: balance; animation: amnko-copy-enter 650ms ease-out 720ms both; }
.amnko-intro-tagline { margin: .75rem 0 0; color: #a8bdd5; font-size: clamp(.76rem, 1.5vw, .9rem); letter-spacing: .16em; text-transform: uppercase; animation: amnko-copy-enter 650ms ease-out 880ms both; }
.amnko-intro-tagline span { margin: 0 .4em; color: #4a9ddb; }
.amnko-intro-glow { position: absolute; z-index: -1; width: min(72vw, 720px); aspect-ratio: 1; border-radius: 999px; background: radial-gradient(circle, rgba(31, 117, 191, .28), rgba(7, 20, 38, 0) 68%); animation: amnko-glow-in 1.2s ease-out both; }
.amnko-intro-grid { position: absolute; inset: 0; opacity: .16; background-image: linear-gradient(rgba(106, 157, 202, .12) 1px, transparent 1px), linear-gradient(90deg, rgba(106, 157, 202, .12) 1px, transparent 1px); background-size: 52px 52px; mask-image: radial-gradient(ellipse at center, black, transparent 72%); }
.amnko-intro-lines { position: absolute; inset: 0; z-index: -1; opacity: .3; }
.amnko-intro-lines span { position: absolute; display: block; width: 42vw; height: 1px; background: linear-gradient(90deg, transparent, rgba(73, 155, 219, .65), transparent); transform: rotate(-28deg); animation: amnko-line-drift 8s ease-in-out infinite; }
.amnko-intro-lines span:nth-child(1) { top: 22%; left: -8%; }
.amnko-intro-lines span:nth-child(2) { top: 68%; right: -12%; animation-delay: -3s; transform: rotate(24deg); }
.amnko-intro-lines span:nth-child(3) { top: 42%; right: -18%; width: 30vw; animation-delay: -5s; transform: rotate(-12deg); }
.amnko-intro-reduced, .amnko-intro-reduced * { animation-duration: 1ms !important; animation-delay: 0ms !important; }
@keyframes amnko-logo-enter { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: scale(1); } }
@keyframes amnko-sweep { to { transform: translateX(600%) rotate(18deg); } }
@keyframes amnko-copy-enter { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: translateY(0); } }
@keyframes amnko-glow-in { from { opacity: 0; transform: scale(.84); } to { opacity: 1; transform: scale(1); } }
@keyframes amnko-line-drift { 0%, 100% { transform: translateX(-3%) rotate(-28deg); opacity: .28; } 50% { transform: translateX(5%) rotate(-28deg); opacity: .62; } }
@keyframes amnko-intro-exit { to { opacity: 0; visibility: hidden; pointer-events: none; } }
@media (prefers-reduced-motion: reduce) { .amnko-intro { animation-duration: 250ms; animation-delay: 400ms; } .amnko-intro-lines, .amnko-intro-logo-sweep { display: none; } }
`

if (typeof document !== "undefined" && !document.getElementById("amnko-intro-styles")) {
  const style = document.createElement("style")
  style.id = "amnko-intro-styles"
  style.textContent = introStyles
  document.head.appendChild(style)
}

export default AmnkoIntro
