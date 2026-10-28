// Same Web3Forms inbox as the Spider-Verse edition. Access keys are public by design —
// they only identify the destination inbox.
const WEB3FORMS_KEY = '0aa5b3f3-8077-495b-8620-f36c000bd70d'
const WEB3FORMS_URL = 'https://api.web3forms.com/submit'

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches
const hasGsap = !!(window.gsap && window.ScrollTrigger)
const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]

/* ───────── Visit notification ─────────
   One email per browser session. Skipped on localhost so development doesn't
   flood the inbox. ponytail: no bot filtering beyond "runs JS"; Web3Forms free
   tier caps at 250 submissions/month shared with the contact form. */
;(function notifyVisit() {
  if (/^(localhost|127\.|0\.0\.0\.0|192\.168\.)/.test(location.hostname) || location.protocol === 'file:') return
  try {
    if (sessionStorage.getItem('visit-notified')) return
    sessionStorage.setItem('visit-notified', '1')
  } catch { /* storage blocked — still notify once for this load */ }

  const body = new FormData()
  body.append('access_key', WEB3FORMS_KEY)
  body.append('subject', '👀 Someone just visited your portfolio')
  body.append('from_name', 'Portfolio — Visit alert')
  body.append(
    'message',
    [
      `Page: ${location.href}`,
      `Referrer: ${document.referrer || 'Direct / unknown'}`,
      `Time (visitor): ${new Date().toString()}`,
      `Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
      `Language: ${navigator.language}`,
      `Screen: ${screen.width}×${screen.height}`,
      `Device: ${navigator.userAgent}`,
    ].join('\n')
  )
  fetch(WEB3FORMS_URL, { method: 'POST', body, keepalive: true }).catch(() => {})
})()

/* ───────── Contact form ───────── */
;(function contactForm() {
  const form = $('.form')
  const status = $('.form-status')
  const btn = $('button[type="submit"]', form)
  const btnText = $('.btn-text', btn)

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (btn.disabled) return

    const fields = $$('input[required], textarea[required]', form)
    fields.forEach((f) => f.classList.toggle('invalid', !f.checkValidity()))
    const firstBad = fields.find((f) => !f.checkValidity())
    if (firstBad) {
      status.className = 'form-status err'
      status.textContent = firstBad.type === 'email' ? 'Please enter a valid email address.' : 'Please fill in every field.'
      firstBad.focus()
      return
    }

    btn.disabled = true
    btnText.textContent = 'Sending…'
    status.className = 'form-status'
    status.textContent = ''

    const body = new FormData(form)
    body.append('access_key', WEB3FORMS_KEY)
    body.append('subject', `New portfolio message from ${body.get('name')}`)
    body.append('from_name', 'Portfolio — Contact form')

    try {
      const res = await fetch(WEB3FORMS_URL, { method: 'POST', body })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      form.reset()
      status.className = 'form-status ok'
      status.textContent = "Thanks — your message is in my inbox. I'll reply shortly."
    } catch (err) {
      status.className = 'form-status err'
      status.textContent = 'That didn’t go through. Please email nabingupta68@gmail.com directly.'
    } finally {
      btn.disabled = false
      btnText.textContent = 'Send message'
    }
  })
  form.addEventListener('input', (e) => e.target.classList.remove('invalid'))
})()

/* ───────── Navigation ───────── */
;(function nav() {
  const wrap = $('.nav-wrap')
  const links = $$('.nav-links a')
  const pill = $('.nav-pill')
  const toggle = $('.nav-toggle')
  const sheet = $('.nav-sheet')
  let active = null

  const movePill = (a) => {
    if (!a) return (pill.style.opacity = 0)
    pill.style.opacity = 1
    pill.style.width = a.offsetWidth + 'px'
    pill.style.transform = `translateX(${a.offsetLeft}px)`
  }
  links.forEach((a) => a.addEventListener('mouseenter', () => movePill(a)))
  $('.nav-links').addEventListener('mouseleave', () => movePill(active))

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return
        active = links.find((a) => a.hash === '#' + en.target.id) || null
        links.forEach((a) => a.classList.toggle('active', a === active))
        movePill(active)
      })
    },
    { rootMargin: '-45% 0px -50% 0px' }
  )
  $$('main section[id]').forEach((s) => io.observe(s))
  addEventListener('resize', () => movePill(active))

  // Tint the nav dark while it sits over the ThoughtLoom panel.
  new IntersectionObserver(([en]) => wrap.classList.toggle('on-dark', en.isIntersecting), {
    rootMargin: '0px 0px -94% 0px',
  }).observe($('.tl'))

  // Hide on scroll down, reveal on scroll up.
  let lastY = scrollY
  addEventListener('scroll', () => {
    const y = scrollY
    if (sheet.hidden) wrap.classList.toggle('hide', y > lastY && y > 400)
    lastY = y
  }, { passive: true })

  const setOpen = (open) => {
    sheet.hidden = !open
    toggle.setAttribute('aria-expanded', open)
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu')
  }
  toggle.addEventListener('click', () => setOpen(sheet.hidden))
  $$('a', sheet).forEach((a) => a.addEventListener('click', () => setOpen(false)))
  addEventListener('keydown', (e) => e.key === 'Escape' && setOpen(false))
})()

/* ───────── ThoughtLoom film ───────── */
;(function film() {
  const video = $('.tl-video')
  const btn = $('.tl-sound')
  const frame = $('.tl-frame')

  new IntersectionObserver(([en]) => {
    if (en.isIntersecting) video.play().catch(() => {})
    else video.pause()
  }, { threshold: 0.35 }).observe(video)

  // Turning sound on always restarts the film so it's heard from the start; muting just mutes.
  const setSound = (on) => {
    video.muted = !on
    btn.classList.toggle('on', on)
    btn.setAttribute('aria-label', on ? 'Mute' : 'Play with sound')
    $('span', btn).textContent = on ? 'Sound on' : 'Watch with sound'
    if (on) { video.currentTime = 0; video.play().catch(() => {}) }
  }
  btn.addEventListener('click', (e) => { e.stopPropagation(); setSound(video.muted) })
  frame.addEventListener('click', () => setSound(video.muted))
})()

/* ───────── Pointer effects: spotlight, tilt, magnetic, cursor ───────── */
$$('.spot').forEach((el) => {
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  })
})

if (finePointer && !reduced) {
  // 3D tilt — portrait strong, project cards subtle.
  const tilt = (el, max, sheen) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      el.style.transition = 'transform 0.15s ease-out'
      el.style.transform = `rotateY(${x * max}deg) rotateX(${-y * max}deg)`
      if (sheen) sheen.style.setProperty('--sheen', `${(x + 0.5) * 100}%`)
    })
    el.addEventListener('pointerleave', () => {
      el.style.transition = 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)'
      el.style.transform = ''
    })
  }
  $$('.tilt').forEach((el) => tilt(el, 14, $('.sheen', el)))
  $$('.tilt-soft').forEach((el) => tilt(el, 5))

  // Magnetic buttons
  $$('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`
    })
    el.addEventListener('pointerleave', () => (el.style.transform = ''))
  })

  // Cursor: dot follows exactly, ring eases behind.
  const cursor = $('.cursor')
  const dot = $('.cursor-dot')
  const ring = $('.cursor-ring')
  const label = $('.cursor-label')
  let mx = -100, my = -100, rx = -100, ry = -100
  addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY
    dot.style.transform = `translate(${mx}px, ${my}px)`
    const t = e.target
    const labelled = t.closest('[data-cursor]')
    cursor.classList.toggle('label', !!labelled)
    label.textContent = labelled ? labelled.dataset.cursor : ''
    cursor.classList.toggle('hover', !labelled && !!t.closest('a, button, input, textarea, .project'))
    cursor.classList.toggle('dark', !!t.closest('.tl'))
  })
  document.addEventListener('pointerleave', () => cursor.classList.add('hidden'))
  document.addEventListener('pointerenter', () => cursor.classList.remove('hidden'))
  ;(function loop() {
    rx += (mx - rx) * 0.16
    ry += (my - ry) * 0.16
    ring.style.transform = `translate(${rx}px, ${ry}px)`
    requestAnimationFrame(loop)
  })()
}

/* ───────── Scroll animation (GSAP) ───────── */
// Split the about statement into words so it can light up as you scroll.
$$('[data-words]').forEach((el) => {
  el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ')
})

if (hasGsap && !reduced) {
  document.documentElement.classList.add('anim')
  gsap.registerPlugin(ScrollTrigger)

  if (window.Lenis) {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((t) => lenis.raf(t * 1000))
    gsap.ticker.lagSmoothing(0)
    $$('a[href^="#"]').forEach((a) =>
      a.addEventListener('click', (e) => {
        const target = a.hash === '#top' ? 0 : $(a.hash)
        if (target === null) return
        e.preventDefault()
        lenis.scrollTo(target, { offset: -80 })
      })
    )
  }

  // Hero entrance
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .to('.hero-title .line > span', { y: 0, duration: 1.4, stagger: 0.12 }, 0.15)
    .fromTo('.hero .reveal', { opacity: 0, y: 24, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, stagger: 0.1 }, 0.35)
    .fromTo('.hero .reveal-scale', { opacity: 0, scale: 0.92, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 1.6 }, 0.3)
    .from('.nav-wrap', { y: -40, opacity: 0, duration: 1.2 }, 0.2)

  // Section reveals
  ScrollTrigger.batch('main .reveal:not(.hero .reveal)', {
    start: 'top 88%',
    once: true,
    onEnter: (els) =>
      gsap.fromTo(els, { opacity: 0, y: 40, filter: 'blur(10px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'expo.out', stagger: 0.08, clearProps: 'filter,transform' }),
  })

  // Hero portrait parallax as you leave
  gsap.to('.hero-visual', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })

  // About statement — words light up with scroll
  gsap.to('.about-statement .w', {
    opacity: 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: '.about-statement', start: 'top 80%', end: 'bottom 45%', scrub: true },
  })

  // ThoughtLoom film grows into the viewport
  gsap.fromTo('.tl-frame', { scale: 0.8, borderRadius: 48 }, {
    scale: 1, borderRadius: 32, ease: 'none',
    scrollTrigger: { trigger: '.tl-stage', start: 'top 95%', end: 'top 25%', scrub: true },
  })

  // Architecture nodes cascade
  gsap.from('.flow > *', {
    opacity: 0, x: -16, stagger: 0.07, duration: 0.8, ease: 'expo.out',
    scrollTrigger: { trigger: '.flow', start: 'top 85%', once: true },
  })

  // Reading progress
  gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } })

  // Count-up numbers
  $$('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count)
    const dec = +el.dataset.decimals || 0
    const obj = { v: 0 }
    gsap.to(obj, {
      v: end, duration: 1.8, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => (el.textContent = el.dataset.sep ? Math.round(obj.v).toLocaleString('en-US') : obj.v.toFixed(dec)),
    })
  })
}
