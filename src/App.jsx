import { Fragment, useEffect, useState } from 'react'
import Gradient from './Gradient'
import { COMPANIES, EMAIL, INTRO, PRACTICE, PROJECTS } from './content'

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]')
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.dataset.reveal = 'in'
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

function useScrolled() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return scrolled
}

// Splits words into letters, each carrying its overall index for staggering
function Letters({ words }) {
  let i = 0
  return words.map((word, w) => (
    <Fragment key={word}>
      {w > 0 && ' '}
      <span className="word" aria-hidden="true">
        {[...word].map((char) => (
          <span key={i} className="char" style={{ '--i': i++ }}>
            {char}
          </span>
        ))}
      </span>
    </Fragment>
  ))
}

export default function App() {
  useReveal()
  const scrolled = useScrolled()

  return (
    <>
      <Gradient />

      <header className="header" data-scrolled={scrolled ? '' : undefined}>
        <nav>
          <a href="#work">Work</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero wrap">
          <div className="hero-body">
            <div className="intro">
              {INTRO.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="previously">
              <span>Previously</span>
              <ul>
                {COMPANIES.map((company) => (
                  <li key={company.name}>
                    <a
                      className="logo"
                      href={company.url}
                      target="_blank"
                      rel="noopener"
                      aria-label={company.name}
                      style={{ '--ratio': company.ratio, WebkitMaskImage: `url(${company.logo})`, maskImage: `url(${company.logo})` }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <h1 className="name" aria-label="Ben Wolfram">
            <Letters words={['Ben', 'Wolfram']} />
          </h1>
        </section>

        <section id="work" className="studio wrap" data-reveal>
          <div>
            <h2>Building</h2>
            <ol className="projects">
              {PROJECTS.map((project) => (
                <li key={project.name}>
                  <a className="project" href={project.url} target="_blank" rel="noopener">
                    <span className="project-emoji" aria-hidden="true">{project.emoji}</span>
                    <span className="project-name">
                      {project.name}
                      <span className="project-arrow" aria-hidden="true">↗</span>
                    </span>
                    <span className="project-kind">{project.kind}</span>
                    <span className="project-status">
                      <i aria-hidden="true" />
                      {project.status}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h2>Expertise</h2>
            <ul className="practice">
              {PRACTICE.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section id="contact" className="contact wrap" data-reveal>
          <p className="contact-lede">Have something worth building?</p>
          <a className="email" href={`mailto:${EMAIL}`}>
            {EMAIL}
          </a>
        </section>
      </main>

      <footer className="footer wrap">
        <span>© {new Date().getFullYear()} Ben Wolfram</span>
        <a href="#top">Back to top ↑</a>
      </footer>
    </>
  )
}
