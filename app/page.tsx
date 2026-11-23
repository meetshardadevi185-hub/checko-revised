import SiteHeader from './components/site-header';
import Problem from './components/problem';
import { About, Contact, Hero, SiteFooter } from './components/sections';
import Industries from './components/industries';
import Reveal from './components/reveal';
import Solutions from './components/solutions';
import TopoHero from './components/topo-hero';

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="site-shell" id="top">
        <SiteHeader />
        <main id="main">
          <TopoHero />
          <Hero />
          <Problem />
          <Solutions />
          <Industries />
          <About />
          <Contact />
        </main>
        <SiteFooter />
        <Reveal />
      </div>
    </>
  );
}
