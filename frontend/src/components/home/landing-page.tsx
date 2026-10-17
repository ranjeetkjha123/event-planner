import Image from "next/image";

const features = [
  ["✿", "Events", "Haldi, Mehndi, Sangeet & more"],
  ["♡", "Guests & RSVP", "Track attendance easily"],
  ["₹", "Expenses", "Stay on budget"],
  ["✓", "Tasks", "Never miss anything"],
  ["◇", "Shopping", "Manage wedding shopping"],
  ["✳", "Vendors", "Find and manage vendors"],
  ["✉", "Invitations", "Beautiful digital invitations"],
  ["▧", "Photos & Gallery", "Upload and share memories"],
  ["▶", "Live Stream", "Share your special moments"],
  ["⌂", "Public Website", "Your wedding story online"],
] as const;

const navigation = [["Home", "#home"], ["Features", "#features"], ["Demo Wedding", "#demo"]] as const;

function Brand() {
  return <a className="brand" href="#home" aria-label="Make My Marriage home"><span className="brand-icon" aria-hidden="true">♡</span><span>Make My <b>Marriage</b></span></a>;
}
function Arrow() { return <span aria-hidden="true">→</span>; }

function DashboardPreview() {
  return (
    <div className="demo-shell" id="demo" aria-label="Illustrative wedding planning dashboard">
      <aside className="demo-sidebar">
        <div className="demo-brand"><span aria-hidden="true">♡</span> Make My Marriage</div>
        <div className="demo-nav-active">▦ &nbsp; Dashboard</div><div>◷ &nbsp; Events</div><div>♧ &nbsp; Guests</div><div>✓ &nbsp; Tasks</div>
        <div>◇ &nbsp; Shopping</div><div>₹ &nbsp; Expenses</div><div>✳ &nbsp; Vendors</div><div>✉ &nbsp; Invitations</div><div>▧ &nbsp; Gallery</div><div>⌂ &nbsp; Website</div><div>⚙ &nbsp; Settings</div>
      </aside>
      <div className="demo-main">
        <div className="demo-topline"><span>ASHU &amp; PRIYA <small>DEMO WEDDING</small></span><span className="demo-avatar">A</span></div>
        <h3>Good morning, Ashu &amp; Priya <span>✿</span></h3><p className="demo-muted">Your celebration is taking shape. Here’s your planning overview.</p>
        <div className="demo-countdown"><span>YOUR WEDDING DAY <b>18 February 2027 · Jaipur</b></span><strong>124 <small>days to go</small></strong></div>
        <div className="demo-stats"><div><small>EVENTS</small><b>6</b><span>celebrations</span></div><div><small>GUESTS</small><b>248</b><span>on your list</span></div><div><small>CONFIRMED</small><b>176</b><span>replies received</span></div><div><small>EXPENSES</small><b>₹18.4L</b><span>of ₹25L budget</span></div><div><small>TASKS</small><b>12</b><span>to complete</span></div></div>
        <div className="demo-lower">
          <section className="demo-panel"><div className="demo-panel-title">Upcoming events <span>View all →</span></div>
            <div className="demo-event"><time>FEB <b>14</b></time><span><b>Mehendi</b><small>Garden courtyard · 4:00 PM</small></span><i>Planned</i></div>
            <div className="demo-event"><time>FEB <b>16</b></time><span><b>Sangeet</b><small>The old palace · 7:00 PM</small></span><i>Planned</i></div>
            <div className="demo-event"><time>FEB <b>18</b></time><span><b>Wedding ceremony</b><small>Jaipur · 5:00 PM</small></span><i>Planned</i></div>
          </section>
          <section className="demo-panel budget-panel"><div className="demo-panel-title">Budget overview <span>Demo data</span></div><div className="budget-total"><b>₹18,40,000</b><small>of ₹25,00,000</small></div><div className="budget-track"><i /></div><small>74% of total budget allocated</small><div className="budget-categories"><span>Venue <b>₹7.2L</b></span><span>Catering <b>₹4.8L</b></span><span>Décor <b>₹3.1L</b></span></div></section>
        </div><div className="demo-disclaimer">Illustrative demo data — not a real couple’s wedding information.</div>
      </div>
    </div>
  );
}

export function LandingPage() {
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <Brand />
      <nav className="desktop-nav" aria-label="Main navigation">{navigation.map(([label, href], i) => <a className={i === 0 ? "active" : ""} href={href} key={label}>{label}</a>)}</nav>
      <div className="header-actions"><a className="button button-primary header-start" href="#account">Get Started</a><a className="button button-outline header-signin" href="#account">Sign In</a></div>
      <details className="mobile-menu"><summary aria-label="Open navigation menu"><span aria-hidden="true">☰</span></summary><nav aria-label="Mobile navigation">{navigation.map(([label, href]) => <a href={href} key={label}>{label}</a>)}<a href="#account">Get Started / Sign In</a></nav></details>
    </header>
    <main id="main">
      <section className="hero" id="home">
        <div className="hero-copy"><p className="eyebrow"><span>✿</span> MADE FOR YOUR BIG, BEAUTIFUL DAY</p>
          <h1>Plan. Organize.<br />Celebrate.<br /><em>Your Dream Indian Wedding.</em></h1>
          <p className="hero-description">Make My Marriage is an all-in-one wedding management platform for Indian weddings. Manage your events, guests, expenses, tasks, shopping, vendors, invitations, photos and more — all in one place.</p>
          <div className="hero-actions"><a className="button button-primary" href="#account">Create Your Wedding <Arrow /></a><a className="button button-video" href="#video-note"><span className="play-icon">▶</span> Watch Video</a></div>
          <div className="trust-notes"><span><i>✓</i> Free to start</span><span><i>✓</i> One account per wedding</span><span><i>✓</i> No guest login required</span></div>
        </div>
        <div className="hero-visual"><Image src="/images/indian-wedding-hero.png" alt="A joyful Indian couple in traditional wedding attire beneath marigold decorations" fill priority sizes="(max-width: 760px) 100vw, 56vw" />
          <div className="hero-image-caption"><span>✿</span><div>MADE FOR EVERY CELEBRATION<small>And all the people who make it yours</small></div></div><span className="hero-flower" aria-hidden="true">✳</span>
        </div>
      </section>
      <section className="feature-strip" id="features" aria-label="Wedding planning features">{features.map(([icon, title, description]) => <article className="feature-item" key={title}><span className="feature-icon" aria-hidden="true">{icon}</span><div><h2>{title}</h2><p>{description}</p></div></article>)}</section>
      <section className="overview section-wrap">
        <div className="overview-copy"><p className="eyebrow">ALL-IN-ONE WEDDING PLANNER</p><h2>Everything You Need<br />for Your <em>Big Day</em></h2><p>Bring events, guests, expenses, vendors, tasks and memories together in one shared workspace. Keep family in the loop and make every detail easier to find.</p>
          <div className="overview-actions"><a className="button button-primary" href="#demo">Explore Interactive Demo <Arrow /></a><a className="text-link" href="#features">See All Features</a></div>
          <div className="demo-note"><span aria-hidden="true">✿</span><p><b>A preview made for exploring.</b><br />Names, dates and figures shown here are illustrative demo data.</p></div>
        </div><DashboardPreview />
      </section>
      <section className="steps-section section-wrap" id="how-it-works"><p className="eyebrow">HOW IT WORKS</p><h2>Get Started in <em>3 Simple Steps</em></h2><p className="steps-intro">Start with a shared wedding space, then build your plans together.</p>
        <div className="steps"><article><span className="step-number">01</span><span className="step-icon" aria-hidden="true">♡</span><h3>Create your account</h3><p>Set up an account using the project’s email and password sign-in flow.</p></article><span className="step-arrow" aria-hidden="true">→</span>
          <article><span className="step-number">02</span><span className="step-icon" aria-hidden="true">✿</span><h3>Set up your wedding</h3><p>Add your details, create celebrations and invite your family members.</p></article><span className="step-arrow" aria-hidden="true">→</span>
          <article><span className="step-number">03</span><span className="step-icon" aria-hidden="true">✳</span><h3>Plan together</h3><p>Manage the details in one place and make room to enjoy your day.</p></article></div>
      </section>
      <section className="account-note" id="account"><span aria-hidden="true">♡</span><div><h2>Start your wedding workspace</h2><p>The documented account flow uses email and password. Sign-in and onboarding routes are not available from this homepage build yet.</p></div><a className="button button-outline" href="#home">Homepage preview</a></section>
      <p className="video-note" id="video-note">A product overview video will appear here when one is available.</p>
    </main>
    <footer className="site-footer"><Brand /><p>One shared place for your wedding plans.</p><span>© Make My Marriage</span></footer>
  </>;
}
