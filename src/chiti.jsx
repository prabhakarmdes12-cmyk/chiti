import { useState, useEffect, useRef, useCallback } from "react";
import "./tokens.css";

// ─── Utilities ────────────────────────────────────────────────────────────────
const useReducedMotion = () => {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
};

// Shared IntersectionObserver factory
const useInView = (threshold = 0.2) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, visible];
};

// ─── Particle Canvas ───────────────────────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    // Reduced N for performance (was 90 → O(N²) bottleneck)
    const N = 50;
    const CONNECT_DIST = 120;
    const particles = Array.from({ length: N }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.6 + 0.2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Update positions
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      });

      // Connections
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.15 * (1 - dist / CONNECT_DIST)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Particles
      particles.forEach((p) => {
        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        grad.addColorStop(0, `rgba(139, 92, 246, ${p.opacity})`);
        grad.addColorStop(1, `rgba(99, 102, 241, 0)`);
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}

// ─── Orb ──────────────────────────────────────────────────────────────────────
function Orb({ color1, color2, size = 400, style }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at 40% 40%, ${color1}, ${color2}, transparent 70%)`,
        filter: "blur(60px)",
        opacity: 0.35,
        animation: "orbPulse 6s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav({ active, onNav }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const navItems = ["Philosophy", "Products", "Vision"];

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: "var(--z-nav)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 48px",
        height: 72,
        background: scrolled ? "rgba(4, 4, 16, 0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid var(--color-border-brand)" : "none",
        transition: "all 0.4s ease",
      }}
    >
      <button
        aria-label="Chiti — go to homepage"
        onClick={() => onNav("hero")}
        style={{
          background: "none",
          border: "none",
          fontFamily: "var(--font-display)",
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: "0.06em",
          color: "var(--color-text-secondary)",
          cursor: "pointer",
        }}
      >
        चित्ति{" "}
        <span style={{ color: "var(--color-brand-200)", fontSize: 14, fontFamily: "monospace", letterSpacing: "0.2em" }}>
          CHITI
        </span>
      </button>

      {/* Desktop nav */}
      <div style={{ display: "flex", gap: 36, alignItems: "center" }} className="desktop-nav">
        {navItems.map((item) => (
          <button
            key={item}
            onClick={() => onNav(item.toLowerCase())}
            aria-current={active === item.toLowerCase() ? "page" : undefined}
            style={{
              background: "none",
              border: "none",
              color: active === item.toLowerCase() ? "#a5b4fc" : "rgba(200,200,230,0.55)",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              letterSpacing: "0.08em",
              cursor: "pointer",
              transition: "color var(--duration-base)",
            }}
          >
            {item}
          </button>
        ))}
        <button
          aria-label="Experience Chiti products"
          onClick={() => onNav("products")}
          className="btn-primary"
          style={{
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            border: "none",
            borderRadius: "var(--radius-pill)",
            color: "#fff",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            fontWeight: 500,
            padding: "9px 22px",
            cursor: "pointer",
            letterSpacing: "0.05em",
            boxShadow: "0 0 20px rgba(99,102,241,0.3)",
            transition: "box-shadow var(--duration-base), transform var(--duration-fast)",
          }}
        >
          Experience →
        </button>
      </div>

      {/* Mobile hamburger */}
      <button
        className="mobile-menu-btn"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((o) => !o)}
        style={{
          display: "none",
          background: "none",
          border: "1px solid var(--color-border-hover)",
          borderRadius: 8,
          color: "var(--color-brand-400)",
          padding: "6px 10px",
          cursor: "pointer",
          fontFamily: "monospace",
          fontSize: 16,
        }}
      >
        {mobileOpen ? "✕" : "☰"}
      </button>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          style={{
            position: "absolute",
            top: 72,
            left: 0,
            right: 0,
            background: "rgba(4,4,16,0.97)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid var(--color-border-brand)",
            padding: "16px 24px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {navItems.map((item) => (
            <button
              key={item}
              onClick={() => { onNav(item.toLowerCase()); setMobileOpen(false); }}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-brand-400)",
                fontFamily: "var(--font-body)",
                fontSize: 16,
                padding: "10px 0",
                textAlign: "left",
                cursor: "pointer",
                borderBottom: "1px solid var(--color-border-brand)",
              }}
            >
              {item}
            </button>
          ))}
          <button
            onClick={() => { onNav("products"); setMobileOpen(false); }}
            style={{
              marginTop: 8,
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              border: "none",
              borderRadius: "var(--radius-pill)",
              color: "#fff",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              padding: "12px",
              cursor: "pointer",
            }}
          >
            Experience →
          </button>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ id }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleExplore = () => {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCosmicTantra = () => {
    // Route to CosmicTantra — replace with real URL when ready
    console.log("Navigate to CosmicTantra");
  };

  return (
    <section
      id={id}
      aria-label="Hero — Intelligence that understands life"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "var(--color-bg-base)",
        textAlign: "center",
        padding: "0 24px",
      }}
    >
      <ParticleField />

      <div style={{ position: "absolute", top: -100, left: -100, zIndex: 0 }} aria-hidden="true">
        <Orb color1="#6366f1" color2="#7c3aed" size={500} />
      </div>
      <div style={{ position: "absolute", bottom: -120, right: -80, zIndex: 0 }} aria-hidden="true">
        <Orb color1="#312e81" color2="#4f46e5" size={420} />
      </div>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 20%, #040410 80%)",
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 820,
          transition: "all 1.2s var(--ease-spring)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(32px)",
        }}
      >
        <div
          role="status"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: "var(--radius-pill)",
            padding: "6px 18px",
            marginBottom: 36,
            background: "rgba(99,102,241,0.08)",
          }}
        >
          <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: "#818cf8", display: "inline-block", boxShadow: "0 0 8px #818cf8" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#a5b4fc", letterSpacing: "0.12em" }}>
            HUMAN INTELLIGENCE LAYER
          </span>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(54px, 9vw, 110px)",
            fontWeight: 300,
            lineHeight: 1.02,
            color: "var(--color-text-primary)",
            margin: "0 0 8px",
            letterSpacing: "-0.01em",
          }}
        >
          Intelligence that
        </h1>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(54px, 9vw, 110px)",
            fontWeight: 700,
            lineHeight: 1.02,
            background: "linear-gradient(135deg, #818cf8 0%, #c4b5fd 50%, #a5b4fc 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: "0 0 40px",
            letterSpacing: "-0.01em",
          }}
        >
          understands life.
        </h1>

        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "clamp(16px, 1.8vw, 20px)",
            color: "var(--color-text-muted)",
            maxWidth: 520,
            margin: "0 auto 56px",
            lineHeight: 1.7,
            fontWeight: 300,
          }}
        >
          Chiti builds the intelligence layer across mind, systems, and growth —
          a unified AI that evolves with every human it knows.
        </p>

        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={handleExplore}
            aria-label="Explore Chiti products"
            style={{
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              border: "none",
              borderRadius: "var(--radius-pill)",
              color: "#fff",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              fontWeight: 500,
              padding: "14px 36px",
              cursor: "pointer",
              letterSpacing: "0.04em",
              boxShadow: "0 0 40px rgba(99,102,241,0.4), 0 4px 20px rgba(0,0,0,0.4)",
              transition: "transform var(--duration-fast), box-shadow var(--duration-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 0 60px rgba(99,102,241,0.6), 0 8px 30px rgba(0,0,0,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 0 40px rgba(99,102,241,0.4), 0 4px 20px rgba(0,0,0,0.4)";
            }}
          >
            Explore Products
          </button>
          <button
            onClick={handleCosmicTantra}
            aria-label="Experience CosmicTantra — Chiti's AI Guru"
            style={{
              background: "transparent",
              border: "1px solid rgba(99,102,241,0.35)",
              borderRadius: "var(--radius-pill)",
              color: "#a5b4fc",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              fontWeight: 400,
              padding: "14px 36px",
              cursor: "pointer",
              letterSpacing: "0.04em",
              transition: "border-color var(--duration-base), color var(--duration-base)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.8)";
              e.currentTarget.style.color = "#c4b5fd";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)";
              e.currentTarget.style.color = "#a5b4fc";
            }}
          >
            Experience CosmicTantra ✦
          </button>
        </div>
      </div>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          opacity: visible ? 0.5 : 0,
          transition: "opacity 1.5s 1.5s",
        }}
      >
        <div style={{ width: 1, height: 48, background: "linear-gradient(to bottom, transparent, #6366f1)", animation: "scrollHint 2s ease-in-out infinite" }} />
        <span style={{ fontFamily: "monospace", fontSize: 10, color: "#6366f1", letterSpacing: "0.2em" }}>SCROLL</span>
      </div>
    </section>
  );
}

// ─── Philosophy ───────────────────────────────────────────────────────────────
const LAYERS = [
  {
    label: "INNER",
    title: "Mind & Emotion",
    desc: "Intelligence that listens to what you feel, not just what you say. Chiti understands the inner human.",
    icon: "◎",
    color: "#7c3aed",
    rgb: "124,58,237",
  },
  {
    label: "OUTER",
    title: "Systems & Work",
    desc: "Automating the complexity of business and daily life with precision, so humans can focus on what matters.",
    icon: "⬡",
    color: "#4f46e5",
    rgb: "79,70,229",
  },
  {
    label: "GROWTH",
    title: "Learning & Evolution",
    desc: "A companion that learns as you grow. Chiti remembers where you've been and sees where you're going.",
    icon: "✦",
    color: "#818cf8",
    rgb: "129,140,248",
  },
];

function Philosophy({ id }) {
  return (
    <section
      id={id}
      aria-label="Philosophy — Three dimensions of life"
      style={{
        background: "var(--color-bg-base)",
        padding: "var(--space-section) 48px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div aria-hidden="true" style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 1, height: 80, background: "linear-gradient(to bottom, rgba(99,102,241,0.6), transparent)" }} />

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-brand-200)", letterSpacing: "0.25em", marginBottom: 20, textAlign: "center" }}>
          PHILOSOPHY
        </p>

        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(38px, 5vw, 68px)", fontWeight: 300, color: "var(--color-text-primary)", textAlign: "center", marginBottom: 80, lineHeight: 1.1 }}>
          One intelligence.<br />
          <em style={{ fontStyle: "italic", color: "var(--color-brand-300)" }}>Three dimensions of life.</em>
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {LAYERS.map((l, i) => <LayerCard key={l.label} layer={l} delay={i * 120} />)}
        </div>

        <blockquote
          style={{
            marginTop: 80,
            textAlign: "center",
            padding: "56px 40px",
            border: "1px solid rgba(99,102,241,0.15)",
            borderRadius: "var(--radius-lg)",
            background: "rgba(99,102,241,0.04)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div aria-hidden="true" style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(#4f46e5, transparent 70%)", opacity: 0.12 }} />
          <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px, 3vw, 38px)", color: "var(--color-brand-500)", fontStyle: "italic", lineHeight: 1.5, position: "relative", zIndex: 1 }}>
            "Chiti is not a product.<br />It is a presence."
          </p>
        </blockquote>
      </div>
    </section>
  );
}

function LayerCard({ layer, delay }) {
  const [hovered, setHovered] = useState(false);
  const [cardRef, visible] = useInView(0.2);

  return (
    <article
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${hovered ? layer.color + "55" : "rgba(99,102,241,0.12)"}`,
        borderRadius: "var(--radius-md)",
        padding: "44px 36px",
        background: hovered ? `rgba(${layer.rgb}, 0.06)` : "rgba(255,255,255,0.02)",
        transition: "all var(--duration-slow) var(--ease-spring)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transitionDelay: `${delay}ms`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {hovered && (
        <div aria-hidden="true" style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(${layer.color}, transparent 70%)`, opacity: 0.12, pointerEvents: "none" }} />
      )}
      <div aria-hidden="true" style={{ fontFamily: "var(--font-display)", fontSize: 36, color: layer.color, marginBottom: 20, lineHeight: 1 }}>{layer.icon}</div>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: layer.color, letterSpacing: "0.25em", marginBottom: 12 }}>{layer.label}</p>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--color-text-primary)", fontWeight: 500, marginBottom: 16 }}>{layer.title}</h3>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-text-muted)", lineHeight: 1.7, fontWeight: 300 }}>{layer.desc}</p>
    </article>
  );
}

// ─── Products ─────────────────────────────────────────────────────────────────
const PRODUCTS = [
  {
    name: "CosmicTantra",
    tagline: "Your AI Guru",
    desc: "A deep philosophical companion for the mind. Explore consciousness, clarity, and self-knowledge through an intelligence that listens beyond words.",
    gradient: "linear-gradient(135deg, #1a0533 0%, #2d1b69 50%, #0f0a1e 100%)",
    accent: "#a78bfa",
    border: "rgba(167,139,250,0.2)",
    glyph: "☽",
    tags: ["Mindfulness", "Reflection", "Philosophy"],
    href: "#", // Replace with real URL
  },
  {
    name: "BatchFlow",
    tagline: "Automate your business intelligence",
    desc: "Precision-engineered CRM and automation that thinks ahead. Clean data flows, intelligent triggers, and business logic that never sleeps.",
    gradient: "linear-gradient(135deg, #050f2c 0%, #0d1f4a 50%, #040a1a 100%)",
    accent: "#60a5fa",
    border: "rgba(96,165,250,0.2)",
    glyph: "⬡",
    tags: ["CRM", "Automation", "Intelligence"],
    href: "#",
  },
  {
    name: "Bobo",
    tagline: "A companion that grows with your child",
    desc: "Soft, safe, and endlessly curious. Bobo learns your child's world and grows alongside them — a friend made of wonder.",
    gradient: "linear-gradient(135deg, #0d1f0a 0%, #1a3a1a 50%, #081208 100%)",
    accent: "#86efac",
    border: "rgba(134,239,172,0.2)",
    glyph: "✦",
    tags: ["Kids", "Learning", "Companion"],
    href: "#",
  },
];

function Products({ id }) {
  return (
    <section
      id={id}
      aria-label="Product ecosystem"
      style={{
        background: "var(--color-bg-alt)",
        padding: "var(--space-section) 48px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-brand-200)", letterSpacing: "0.25em", marginBottom: 20, textAlign: "center" }}>
          PRODUCT ECOSYSTEM
        </p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(38px, 5vw, 68px)", fontWeight: 300, color: "var(--color-text-primary)", textAlign: "center", marginBottom: 80 }}>
          Three worlds.<br />
          <em style={{ fontStyle: "italic", color: "var(--color-brand-300)" }}>One intelligence.</em>
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24 }}>
          {PRODUCTS.map((p, i) => <ProductCard key={p.name} product={p} delay={i * 100} />)}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product, delay }) {
  const [hovered, setHovered] = useState(false);
  const [cardRef, visible] = useInView(0.15);

  return (
    <article
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => window.location.href = product.href}
      role="link"
      tabIndex={0}
      aria-label={`${product.name} — ${product.tagline}`}
      onKeyDown={(e) => { if (e.key === "Enter") window.location.href = product.href; }}
      style={{
        borderRadius: "var(--radius-lg)",
        border: `1px solid ${hovered ? product.border.replace("0.2", "0.5") : product.border}`,
        background: product.gradient,
        padding: "48px 40px 40px",
        cursor: "pointer",
        transition: "all var(--duration-slow) var(--ease-spring)",
        transform: hovered ? "translateY(-8px) scale(1.01)" : visible ? "translateY(0) scale(1)" : "translateY(28px) scale(0.98)",
        opacity: visible ? 1 : 0,
        transitionDelay: `${delay}ms`,
        boxShadow: hovered ? `0 24px 80px rgba(0,0,0,0.5), 0 0 40px ${product.accent}22` : "0 8px 30px rgba(0,0,0,0.3)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div aria-hidden="true" style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(${product.accent}, transparent 70%)`, opacity: hovered ? 0.15 : 0.07, transition: "opacity var(--duration-slow)", pointerEvents: "none" }} />

      <div aria-hidden="true" style={{ fontFamily: "var(--font-display)", fontSize: 48, color: product.accent, marginBottom: 32, opacity: 0.8 }}>{product.glyph}</div>

      <h3 style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 8 }}>
        {product.name}
      </h3>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: product.accent, letterSpacing: "0.12em", marginBottom: 24, opacity: 0.8 }}>
        {product.tagline}
      </p>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "rgba(200,200,220,0.75)", lineHeight: 1.75, fontWeight: 300, marginBottom: 36 }}>
        {product.desc}
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {product.tags.map((t) => (
          <span
            key={t}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: product.accent,
              border: `1px solid ${product.accent}44`,
              borderRadius: "var(--radius-pill)",
              padding: "4px 12px",
              letterSpacing: "0.1em",
              background: `${product.accent}08`,
            }}
          >
            {t}
          </span>
        ))}
      </div>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 32,
          right: 36,
          color: product.accent,
          fontSize: 20,
          opacity: hovered ? 1 : 0.3,
          transform: hovered ? "translate(4px, -4px)" : "translate(0, 0)",
          transition: "all var(--duration-base)",
        }}
      >
        ↗
      </div>
    </article>
  );
}

// ─── Intelligence Layer ───────────────────────────────────────────────────────
const NODES = [
  { label: "CosmicTantra", x: "50%", y: "10%", color: "#a78bfa" },
  { label: "Chiti Core",   x: "50%", y: "50%", color: "#6366f1", center: true },
  { label: "BatchFlow",    x: "10%", y: "75%", color: "#60a5fa" },
  { label: "Bobo",         x: "90%", y: "75%", color: "#86efac" },
];

function IntelligenceLayer() {
  return (
    <section
      aria-label="Intelligence Layer — One unified mind"
      style={{ background: "var(--color-bg-base)", padding: "var(--space-section) 48px", position: "relative", overflow: "hidden" }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-brand-200)", letterSpacing: "0.25em", marginBottom: 20, textAlign: "center" }}>
          INTELLIGENCE LAYER
        </p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(34px, 4.5vw, 62px)", fontWeight: 300, color: "var(--color-text-primary)", textAlign: "center", marginBottom: 16 }}>
          Not separate tools.
        </h2>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(34px, 4.5vw, 62px)", fontWeight: 700, fontStyle: "italic", background: "linear-gradient(135deg, #818cf8, #c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textAlign: "center", marginBottom: 80 }}>
          One unified mind.
        </h2>

        <div
          role="img"
          aria-label="Diagram showing CosmicTantra, BatchFlow, and Bobo all connected to a central Chiti Core"
          style={{ position: "relative", height: 400, border: "1px solid rgba(99,102,241,0.1)", borderRadius: 32, background: "rgba(99,102,241,0.03)", overflow: "hidden" }}
        >
          <svg aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            {[
              { x1: "50%", y1: "18%", x2: "50%", y2: "42%" },
              { x1: "18%", y1: "70%", x2: "44%", y2: "52%" },
              { x1: "82%", y1: "70%", x2: "56%", y2: "52%" },
            ].map((line, i) => (
              <line key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="url(#lineGrad)" strokeWidth={1} strokeDasharray="6 4" style={{ animation: `dashAnim 2s linear infinite`, animationDelay: `${i * 0.4}s` }} />
            ))}
          </svg>

          {NODES.map((node, i) => (
            <div key={i} style={{ position: "absolute", left: node.x, top: node.y, transform: "translate(-50%, -50%)", textAlign: "center" }}>
              <div
                aria-hidden="true"
                style={{
                  width: node.center ? 80 : 56,
                  height: node.center ? 80 : 56,
                  borderRadius: "50%",
                  border: `1px solid ${node.color}55`,
                  background: node.center ? `radial-gradient(circle, ${node.color}33, ${node.color}11)` : `${node.color}11`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 10px",
                  boxShadow: node.center ? `0 0 40px ${node.color}44` : `0 0 16px ${node.color}22`,
                  animation: `orbPulse ${node.center ? "3" : "4"}s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                }}
              >
                <div style={{ width: node.center ? 20 : 12, height: node.center ? 20 : 12, borderRadius: "50%", background: node.color, boxShadow: `0 0 12px ${node.color}` }} />
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: node.color, letterSpacing: "0.06em", fontWeight: 500 }}>{node.label}</p>
            </div>
          ))}
        </div>

        <p style={{ fontFamily: "var(--font-body)", fontSize: 17, color: "var(--color-text-hint)", textAlign: "center", marginTop: 48, lineHeight: 1.7, fontWeight: 300, maxWidth: 540, margin: "48px auto 0" }}>
          Every product feeds the core. Every interaction makes the whole smarter.
          Chiti is one intelligence expressed in different forms.
        </p>
      </div>
    </section>
  );
}

// ─── Vision ───────────────────────────────────────────────────────────────────
const VISION_THEMES = [
  { num: "01", title: "Deep Understanding", desc: "AI that reads context, emotion, and intent — not just commands." },
  { num: "02", title: "Personalized Intelligence", desc: "Every system uniquely shaped by the human it serves." },
  { num: "03", title: "Human + AI Evolution", desc: "Not replacement. Enhancement. A partnership across time." },
];

function Vision({ id }) {
  return (
    <section
      id={id}
      aria-label="Chiti Vision"
      style={{ background: "var(--color-bg-alt)", padding: "var(--space-section) 48px", position: "relative", overflow: "hidden" }}
    >
      <div aria-hidden="true" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(#4f46e5, transparent 65%)", opacity: 0.06, pointerEvents: "none" }} />

      <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-brand-200)", letterSpacing: "0.25em", marginBottom: 20, textAlign: "center" }}>
          VISION
        </p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(38px, 5vw, 70px)", fontWeight: 300, color: "var(--color-text-primary)", textAlign: "center", marginBottom: 100, lineHeight: 1.1 }}>
          Building toward a<br />
          <em style={{ fontStyle: "italic", color: "var(--color-brand-300)" }}>more intelligent humanity.</em>
        </h2>

        <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 0 }}>
          {VISION_THEMES.map((t, i) => (
            <VisionRow key={t.num} theme={t} last={i === VISION_THEMES.length - 1} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function VisionRow({ theme, last }) {
  const [hovered, setHovered] = useState(false);
  return (
    <li
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 48,
        padding: "52px 24px",
        borderBottom: last ? "none" : "1px solid rgba(99,102,241,0.1)",
        transition: "background var(--duration-base)",
        borderRadius: 12,
        background: hovered ? "rgba(99,102,241,0.04)" : "transparent",
      }}
    >
      <span aria-hidden="true" style={{ fontFamily: "var(--font-display)", fontSize: 18, color: hovered ? "var(--color-brand-200)" : "rgba(99,102,241,0.4)", transition: "color var(--duration-base)", minWidth: 36, paddingTop: 4 }}>
        {theme.num}
      </span>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 34, color: hovered ? "var(--color-brand-500)" : "var(--color-text-primary)", fontWeight: 500, marginBottom: 12, transition: "color var(--duration-base)" }}>
          {theme.title}
        </h3>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--color-text-muted)", lineHeight: 1.7, fontWeight: 300 }}>
          {theme.desc}
        </p>
      </div>
      <div aria-hidden="true" style={{ color: "var(--color-brand-200)", fontSize: 24, opacity: hovered ? 1 : 0.2, transform: hovered ? "translateX(6px)" : "none", transition: "all var(--duration-base)", paddingTop: 8 }}>→</div>
    </li>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTA() {
  return (
    <section
      aria-label="Call to action — start your journey"
      style={{ background: "var(--color-bg-base)", padding: "160px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}
    >
      <div aria-hidden="true" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(#4f46e5, transparent 65%)", opacity: 0.1 }} />
      <div aria-hidden="true" style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 1, height: 80, background: "linear-gradient(to bottom, transparent, rgba(99,102,241,0.4))" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-brand-200)", letterSpacing: "0.25em", marginBottom: 24 }}>BEGIN</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(44px, 7vw, 88px)", fontWeight: 300, color: "var(--color-text-primary)", marginBottom: 12, lineHeight: 1.05 }}>
          Start your journey
        </h2>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(44px, 7vw, 88px)", fontWeight: 700, fontStyle: "italic", background: "linear-gradient(135deg, #818cf8, #c4b5fd, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 56, lineHeight: 1.05 }}>
          into intelligence.
        </h2>

        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            aria-label="Experience CosmicTantra"
            onClick={() => console.log("Navigate to CosmicTantra")}
            style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", border: "none", borderRadius: "var(--radius-pill)", color: "#fff", fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 500, padding: "16px 44px", cursor: "pointer", letterSpacing: "0.04em", boxShadow: "0 0 50px rgba(99,102,241,0.35), 0 4px 24px rgba(0,0,0,0.4)" }}
          >
            Experience CosmicTantra ✦
          </button>
          <button
            aria-label="Contact Chiti team"
            onClick={() => window.location.href = "mailto:hello@chiti.ai"}
            style={{ background: "transparent", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "var(--radius-pill)", color: "var(--color-brand-400)", fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 400, padding: "16px 44px", cursor: "pointer", letterSpacing: "0.04em" }}
          >
            Contact Chiti →
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const FOOTER_COLS = [
    { title: "Products", links: [{ label: "CosmicTantra", href: "#" }, { label: "BatchFlow", href: "#" }, { label: "Bobo", href: "#" }] },
    { title: "Company",  links: [{ label: "Philosophy",  href: "#philosophy" }, { label: "Vision", href: "#vision" }, { label: "Careers", href: "#" }] },
    { title: "Connect",  links: [{ label: "Contact", href: "mailto:hello@chiti.ai" }, { label: "Twitter", href: "https://twitter.com/chitiapp" }, { label: "LinkedIn", href: "https://linkedin.com/company/chiti" }] },
  ];

  return (
    <footer
      style={{ background: "var(--color-bg-footer)", borderTop: "1px solid var(--color-border-brand)", padding: "60px 48px 40px" }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 60 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--color-text-secondary)", marginBottom: 16 }}>
              चित्ति <span style={{ color: "var(--color-brand-200)", fontSize: 12, fontFamily: "monospace" }}>CHITI</span>
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "rgba(180,180,210,0.55)", lineHeight: 1.7, maxWidth: 260, fontWeight: 300 }}>
              Building the intelligence layer for human life. Mind, systems, growth.
            </p>
          </div>

          {FOOTER_COLS.map((col) => (
            <nav key={col.title} aria-label={`${col.title} links`}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-brand-200)", letterSpacing: "0.2em", marginBottom: 20 }}>{col.title}</p>
              {col.links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  style={{ display: "block", fontFamily: "var(--font-body)", fontSize: 14, color: "rgba(180,180,210,0.5)", marginBottom: 12, textDecoration: "none", transition: "color var(--duration-base)", fontWeight: 300 }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-brand-400)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(180,180,210,0.5)"; }}
                >
                  {l.label}
                </a>
              ))}
            </nav>
          ))}
        </div>

        <div style={{ borderTop: "1px solid rgba(99,102,241,0.08)", paddingTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(99,102,241,0.4)", letterSpacing: "0.1em" }}>© 2025 CHITI INC.</p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(99,102,241,0.3)", letterSpacing: "0.06em" }}>INTELLIGENCE FOR HUMAN LIFE</p>
        </div>
      </div>
    </footer>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function ChitiApp() {
  const [activeSection, setActiveSection] = useState("hero");

  // Scroll-based active section tracking
  useEffect(() => {
    const sections = ["hero", "philosophy", "products", "vision"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { threshold: 0.4 }
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setActiveSection(id);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,700&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400&display=swap');

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }

          footer > div > div:first-child {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (max-width: 600px) {
          footer > div > div:first-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <a href="#main-content" style={{ position: "absolute", top: -100, left: 0, background: "#4f46e5", color: "#fff", padding: "8px 16px", zIndex: 9999, textDecoration: "none", borderRadius: "0 0 8px 0", transition: "top 0.2s" }} onFocus={(e) => { e.currentTarget.style.top = "0"; }} onBlur={(e) => { e.currentTarget.style.top = "-100px"; }}>
        Skip to main content
      </a>

      <Nav active={activeSection} onNav={scrollTo} />

      <main id="main-content">
        <Hero id="hero" />
        <Philosophy id="philosophy" />
        <Products id="products" />
        <IntelligenceLayer />
        <Vision id="vision" />
        <CTA />
      </main>

      <Footer />
    </>
  );
}
