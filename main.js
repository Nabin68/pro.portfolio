// Web3Forms access keys are public by design - they only identify the destination inbox.
const WEB3FORMS_KEY = '5ae40758-57aa-4ed1-8fc4-de130f6d6aed'
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
  } catch { /* storage blocked - still notify once for this load */ }

  const body = new FormData()
  body.append('access_key', WEB3FORMS_KEY)
  body.append('subject', '👀 Someone just visited your portfolio')
  body.append('from_name', 'Portfolio - Visit alert')
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
    body.append('from_name', 'Portfolio - Contact form')

    try {
      const res = await fetch(WEB3FORMS_URL, { method: 'POST', body })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      form.reset()
      status.className = 'form-status ok'
      status.textContent = "Thanks - your message is in my inbox. I'll reply shortly."
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
  // 3D tilt - portrait strong, project cards subtle.
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
    cursor.classList.toggle('off', !!t.closest('.deck-scene, .cab-scene, .pc-scene'))
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
    // clearProps: a leftover inline transform would override .nav-wrap.hide and pin the nav.
    .from('.nav-wrap', { y: -40, opacity: 0, duration: 1.2, clearProps: 'transform,opacity' }, 0.2)

  // Section reveals
  ScrollTrigger.batch('main .reveal:not(.hero .reveal)', {
    start: 'top 88%',
    once: true,
    onEnter: (els) =>
      gsap.fromTo(els, { opacity: 0, y: 40, filter: 'blur(10px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'expo.out', stagger: 0.08, clearProps: 'filter,transform' }),
  })

  // Hero portrait parallax as you leave
  gsap.to('.hero-visual', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })

  // About statement - words light up with scroll
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

/* ───────── Foley for the list <-> 3D switches ─────────
   Synthesised with Web Audio (no files). Only ever plays from a toggle click, so autoplay
   rules are satisfied. drop = something falls in, tap = something settles back in a list. */
const sfx = (() => {
  const VOLUME = 0.3 // a hint that something happened, not an effect track
  let ctx, out
  const ac = () => {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)()
      out = ctx.createGain()
      out.gain.value = VOLUME
      out.connect(ctx.destination)
    }
    return ctx
  }
  const tone = (dur, f0, f1, gain, type = 'sine') => {
    const c = ac(), t = c.currentTime
    const o = c.createOscillator(), g = c.createGain()
    o.type = type
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur)
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g).connect(out)
    o.start(t); o.stop(t + dur)
  }
  const safe = (fn) => (...a) => { try { fn(...a) } catch { /* no audio: stay silent */ } }
  return {
    drop: safe((i) => tone(0.1, 220 - i * 14, 90, 0.2)), // soft thunk
    tap: safe((i) => tone(0.07, 340 + i * 22, 140, 0.18)), // lighter tuk
  }
})()

/* ───────── More on GitHub: list / file deck ─────────
   Files are built from the list rows, so the list stays the single source of repos.
   The hovered file lifts out of the box and its neighbours follow with a falloff. */
;(function fileDeck() {
  const more = $('.more')
  const deck = more && $('.deck', more)
  if (!deck) return
  const box = $('.deck-box', deck)
  const caption = $('.deck-caption', deck)
  const front = $('.wall.front', box)
  const rows = $$('.row', more)
  const GAP = 46
  box.style.setProperty('--d', `${rows.length * GAP + 40}px`)
  const files = rows.map((row, i) => {
    const f = document.createElement('a')
    f.className = 'file'
    f.href = row.href
    f.target = '_blank'
    f.rel = 'noopener'
    f.style.setProperty('--i', i)
    f.style.setProperty('--y', `${i * GAP + 40}px`)
    f.style.setProperty('--tab', `${8 + (i % 3) * 24}%`)
    f.innerHTML = '<span class="file-tab"></span><div class="file-body"><b></b><span></span></div>'
    $('.file-tab', f).textContent = $('b', row).textContent
    $('b', f).textContent = $('b', row).textContent
    $('.file-body span', f).textContent = $('span', row).textContent
    box.insertBefore(f, front)
    return f
  })
  const lift = (h) => files.forEach((f, i) => {
    const d = h < 0 ? 9 : Math.abs(i - h)
    f.style.setProperty('--lift', Math.max(0, 120 - d * 45))
    f.classList.toggle('on', i === h)
    if (i === h) caption.innerHTML = `<b>${f.querySelector('b').textContent}</b>Click to open on GitHub ↗`
  })
  box.addEventListener('pointerover', (e) => {
    const f = e.target.closest('.file')
    if (f) lift(files.indexOf(f))
  })
  box.addEventListener('focusin', (e) => lift(files.indexOf(e.target)))
  deck.addEventListener('pointerleave', () => { lift(-1); caption.textContent = 'Move across the files' })

  // List <-> deck: rows drop into the box one after another (files then rise), and climb back out.
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
  const FALL = 'cubic-bezier(0.55, 0, 0.85, 0.35)' // gravity: slow start, fast landing
  const STEP = 110 // matches the files' own stagger (--i * 110ms)
  // Where row r should end up: centred over file f, shrunk to the file's width.
  const aim = (r, f) => {
    const s = Math.min(1, f.width / r.width)
    return { s, dx: f.left + f.width / 2 - (r.left + (r.width * s) / 2), dy: f.top + 30 - r.top }
  }
  let busy = false
  more.switchView = (to) => {
    if (busy) return false
    const from = more.dataset.view
    if (reduced || from === to) {
      more.dataset.view = to
      deck.classList.toggle('in', to === 'deck')
      deck.classList.toggle('live', to === 'deck')
      return
    }
    busy = true
    if (to === 'deck') {
      const starts = rows.map((r) => [r.getBoundingClientRect(), r.offsetTop, r.offsetLeft, r.offsetWidth])
      deck.classList.remove('in', 'live')
      more.dataset.view = to
      const targets = files.map((f) => f.getBoundingClientRect())
      // Rows are hidden in deck view, so fly copies of them.
      const flights = rows.map((row, i) => {
        const [r, top, left, width] = starts[i]
        const ghost = row.cloneNode(true)
        ghost.removeAttribute('href')
        ghost.classList.add('row-ghost')
        ghost.style.cssText = `display:grid;position:absolute;z-index:60;margin:0;top:${top}px;left:${left}px;width:${width}px;transform-origin:0 0;pointer-events:none`
        more.append(ghost)
        const { s, dx, dy } = aim(r, targets[i])
        return ghost.animate([
          { transform: 'none', opacity: 1, easing: EASE },
          { transform: `translate(${dx}px, ${dy - 110}px) scale(${s})`, opacity: 1, offset: 0.6, easing: FALL },
          { transform: `translate(${dx}px, ${dy + 40}px) scale(${s * 0.92})`, opacity: 0 },
        ], { duration: 900, delay: i * STEP, fill: 'both' }).finished.then(() => { ghost.remove(); sfx.drop(i) })
      })
      // Files start rising as the first row lands.
      setTimeout(() => deck.classList.add('in'), 760)
      Promise.all(flights).then(() => setTimeout(() => { deck.classList.add('live'); busy = false }, 600))
    } else {
      const sources = files.map((f) => f.getBoundingClientRect())
      const top = deck.offsetTop, width = deck.offsetWidth
      deck.classList.remove('live', 'in') // files sink back into the box
      more.dataset.view = to
      // The box lingers behind the list as a fading ghost.
      deck.style.cssText = `display:block;position:absolute;z-index:-1;top:${top}px;left:0;width:${width}px;pointer-events:none`
      deck.animate([{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], { duration: 900 + rows.length * STEP }).finished.then(() => { deck.style.cssText = '' })
      const flights = rows.map((row, i) => {
        const { s, dx, dy } = aim(row.getBoundingClientRect(), sources[i])
        row.style.transformOrigin = '0 0'
        setTimeout(() => sfx.tap(i), 150 + i * STEP + 900 * 0.64) // tuk on the visual settle (ease-out ends late)
        return row.animate([
          { transform: `translate(${dx}px, ${dy + 40}px) scale(${s * 0.92})`, opacity: 0, easing: EASE },
          { transform: `translate(${dx}px, ${dy - 110}px) scale(${s})`, opacity: 1, offset: 0.35, easing: EASE },
          { transform: 'none', opacity: 1 },
        ], { duration: 900, delay: 150 + i * STEP, fill: 'backwards' }).finished.then(() => { row.style.transformOrigin = '' })
      })
      Promise.all(flights).then(() => { busy = false })
    }
  }
})()

/* ───────── Contact: list / drawer ─────────
   A filing cabinet built from the contact links; the drawer under the pointer slides out,
   its neighbours follow a little. */
;(function cabinet() {
  const cab = $('.cab')
  if (!cab) return
  const box = $('.cab-box', cab)
  const caption = $('.cab-caption', cab)
  const links = $$('.direct a')
  const idle = caption.textContent
  box.style.setProperty('--n', links.length)
  const drawers = links.map((l, i) => {
    const d = document.createElement('a')
    d.className = 'drw'
    d.href = l.href
    if (l.target) { d.target = l.target; d.rel = 'noopener' }
    d.style.setProperty('--i', i)
    const label = $('span', l).textContent
    const value = l.textContent.replace(label, '').replace('↗', '').trim()
    // Front shows only the channel; the card inside carries the actual address.
    d.innerHTML = '<span class="drw-floor"></span><span class="drw-back"></span><span class="drw-side"></span><span class="drw-side-r"></span><span class="drw-card"><small></small><b></b></span><span class="drw-front"><span class="drw-label"></span><i class="drw-handle"></i></span>'
    $('.drw-label', d).textContent = label
    $('small', d).textContent = label
    $('b', d).textContent = value
    d.setAttribute('aria-label', `${label}: ${value}`)
    d.dataset.label = label
    d.dataset.value = value
    box.append(d)
    return d
  })
  const pull = (h) => drawers.forEach((d, i) => {
    const dist = h < 0 ? 9 : Math.abs(i - h)
    d.style.setProperty('--out', [124, 22, 6][dist] || 0)
    d.classList.toggle('on', i === h)
    if (i === h) caption.innerHTML = `<b>${d.dataset.value}</b>${d.dataset.label} · click to open ↗`
  })
  box.addEventListener('pointerover', (e) => {
    const d = e.target.closest('.drw')
    if (d) pull(drawers.indexOf(d))
  })
  box.addEventListener('focusin', (e) => pull(drawers.indexOf(e.target)))
  cab.addEventListener('pointerleave', () => { pull(-1); caption.textContent = idle })

  // List <-> drawer: one by one, a drawer opens, its contact drops in, and it shuts (and the reverse).
  const reach = cab.closest('.reach')
  const rows = links
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
  const FALL = 'cubic-bezier(0.55, 0, 0.85, 0.35)'
  const STEP = 110 // whole show lands in about a second
  const OPEN = 124
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const setOpen = (d, open) => {
    d.style.setProperty('--out', open ? OPEN : 0)
    d.classList.toggle('on', open)
    if (open) caption.innerHTML = `<b>${d.dataset.value}</b>${d.dataset.label}`
  }
  // Where each drawer's card sits when the drawer is open: snap it open unanimated, measure, snap back.
  const cardSpots = () => drawers.map((d) => {
    const card = $('.drw-card', d)
    d.style.transition = card.style.transition = 'none'
    setOpen(d, true)
    const r = card.getBoundingClientRect()
    setOpen(d, false)
    card.getBoundingClientRect() // commit the closed state before transitions come back
    d.style.transition = card.style.transition = ''
    return r
  })
  const aim = (r, c) => {
    const s = Math.min(1, c.width / r.width)
    return { s, dx: c.left + c.width / 2 - (r.left + (r.width * s) / 2), dy: c.top + 8 - r.top }
  }
  let busy = false
  reach.switchView = (to) => {
    if (busy) return false
    const from = reach.dataset.view
    if (reduced || from === to) { reach.dataset.view = to; return }
    busy = true
    box.style.pointerEvents = 'none' // no hover pulls mid-show
    box.classList.add('quick')
    if (to === 'drawer') {
      const starts = rows.map((r) => [r.getBoundingClientRect(), r.offsetTop, r.offsetLeft, r.offsetWidth])
      reach.dataset.view = to
      const spots = cardSpots()
      const runs = rows.map(async (row, i) => {
        const d = drawers[i]
        await wait(i * STEP)
        setOpen(d, true)
        const [r, top, left, width] = starts[i]
        // Wrapped in .direct so the copy keeps the list row's look while it flies.
        const ghost = document.createElement('div')
        ghost.className = 'direct'
        ghost.append(row.cloneNode(true))
        ghost.firstChild.removeAttribute('href')
        ghost.style.cssText = `display:grid;position:absolute;z-index:60;margin:0;top:${top}px;left:${left}px;width:${width}px;transform-origin:0 0;pointer-events:none;background:var(--bg);border-radius:12px`
        reach.append(ghost)
        const { s, dx, dy } = aim(r, spots[i])
        await ghost.animate([
          { transform: 'none', opacity: 1, easing: EASE },
          { transform: `translate(${dx}px, ${dy - 90}px) scale(${s})`, opacity: 1, offset: 0.6, easing: FALL },
          { transform: `translate(${dx}px, ${dy + 30}px) scale(${s * 0.9})`, opacity: 0 },
        ], { duration: 520, delay: 90, fill: 'both' }).finished
        ghost.remove()
        setOpen(d, false)
        sfx.drop(i)
      })
      Promise.all(runs).then(() => wait(150)).then(() => { box.classList.remove('quick'); caption.textContent = idle; box.style.pointerEvents = ''; busy = false })
    } else {
      const spots = cardSpots()
      const top = cab.offsetTop, width = cab.offsetWidth
      reach.dataset.view = to
      // Cabinet stays on as a ghost behind the list while the contacts climb out, then fades.
      cab.style.cssText = `display:block;position:absolute;z-index:-1;top:${top}px;left:0;width:${width}px;pointer-events:none`
      const runs = rows.map(async (row, i) => {
        const d = drawers[i]
        const { s, dx, dy } = aim(row.getBoundingClientRect(), spots[i])
        row.style.transformOrigin = '0 0'
        const flight = row.animate([
          { transform: `translate(${dx}px, ${dy + 30}px) scale(${s * 0.9})`, opacity: 0, easing: EASE },
          { transform: `translate(${dx}px, ${dy - 90}px) scale(${s})`, opacity: 1, offset: 0.35, easing: EASE },
          { transform: 'none', opacity: 1 },
        ], { duration: 560, delay: i * STEP + 150, fill: 'backwards' }).finished
        // The ease-out has the row visually settled ~62% through; 'finished' comes later, so cue the tuk on the settle.
        setTimeout(() => sfx.tap(i), i * STEP + 150 + 560 * 0.62)
        await wait(i * STEP)
        setOpen(d, true)
        await wait(410)
        setOpen(d, false)
        await flight
        row.style.transformOrigin = ''
      })
      Promise.all(runs).then(() => cab.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250 }).finished).then(() => {
        cab.style.cssText = ''
        box.classList.remove('quick')
        caption.textContent = idle
        box.style.pointerEvents = ''
        busy = false
      })
    }
  }
})()

/* ───────── Research: desk + computer reader ─────────
   The desk is a handful of CSS 3D cuboids; only the faces the camera can see are drawn
   (top, front = +y, left = -x). Clicking it opens the paper on a close-up monitor. */
;(function desk() {
  const pc = $('.pc')
  if (!pc) return
  const box = $('.pc-box', pc)
  const add = (cls, x, y, z, w, d, h, faces = {}) => {
    const c = document.createElement('div')
    c.className = cls
    c.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${d}px;transform:translateZ(${z}px)`
    c.innerHTML =
      `<div class="f top" style="width:${w}px;height:${d}px;transform:translateZ(${h}px)">${faces.top || ''}</div>` +
      `<div class="f front" style="width:${w}px;height:${h}px;transform:translate3d(0,${d}px,${h}px) rotateX(-90deg)">${faces.front || ''}</div>` +
      `<div class="f left" style="width:${d}px;height:${h}px;transform:translate3d(0,0,${h}px) rotateZ(90deg) rotateX(-90deg)">${faces.left || ''}</div>`
    box.append(c)
  }
  const flat = (cls, x, y, z, w, d) => {
    const c = document.createElement('div')
    c.className = cls
    c.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${d}px;transform:translateZ(${z}px)`
    box.append(c)
  }
  const keys = Array.from({ length: 70 }, (_, i) => (i === 64 ? '<span class="wide"></span>' : i > 64 ? '' : '<span></span>')).join('')
  const page = '<b>MLESA-Net</b><small>Attention-Enhanced Multi-Label Emotion &amp; Sentiment Analysis</small>' + '<i></i>'.repeat(14)
  const T = 184 // desk surface height
  flat('pc-shadow', -60, -60, 0, 680, 400)
  ;[[16, 16], [530, 16], [16, 250], [530, 250]].forEach(([x, y]) => add('leg', x, y, 0, 14, 14, 170))
  add('desk', 0, 0, 170, 560, 280, 14)
  add('tower', 452, 26, T, 92, 124, 236, {
    front: '<span class="power"></span><span class="ports"></span><span class="vent"></span><span class="strip rgb"></span><b class="brand">NABIN</b>',
    left: '<span class="fan"></span><span class="fan"></span>',
  })
  add('mon-base', 200, 34, T, 110, 50, 5)
  add('mon-neck', 247, 40, T + 5, 16, 12, 120)
  add('monitor', 84, 56, T + 52, 340, 14, 196, { front: `<div class="scr"><div class="scr-scroll" data-lenis-prevent><div class="scr-pages"><div class="scr-page">${page}</div></div></div><span class="scr-cta">Scroll to read · click to zoom ↗</span></div>` })
  add('mug', 40, 150, T, 28, 28, 30)
  flat('glow rgb', 104, 150, T + 1, 252, 104)
  add('kbd', 116, 162, T, 228, 80, 9, { top: keys, front: '<span class="rgb" style="position:absolute;inset:auto 0 0;height:2px"></span>' })
  add('pad', 372, 168, T, 150, 100, 2)
  flat('glow', 420, 190, T + 2.5, 56, 72)
  box.lastChild.style.background = '#0a84ff'
  add('mouse', 432, 200, T + 2, 30, 48, 11)

  // PDF: one document, drawn into the little desk screen and the zoomed reader.
  const dialog = $('.reader')
  const PDF = 'assets/MLESA-Net.pdf'
  const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/'
  const loadScript = (src) => new Promise((res, rej) => {
    const s = document.createElement('script')
    s.src = src; s.onload = res; s.onerror = rej
    document.head.append(s)
  })
  let docP
  const doc = () => (docP ||= loadScript(PDFJS + 'pdf.min.js').then(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js'
    return pdfjsLib.getDocument(PDF).promise
  }))
  // density: extra resolution so the small 3D screen stays crisp when it is scaled/rotated.
  const draw = async (into, density) => {
    const pdf = await doc()
    const width = into.clientWidth - parseFloat(getComputedStyle(into).paddingLeft) * 2
    into.innerHTML = ''
    for (let n = 1; n <= pdf.numPages; n++) {
      const p = await pdf.getPage(n)
      const vp = p.getViewport({ scale: (width / p.getViewport({ scale: 1 }).width) * density })
      const canvas = document.createElement('canvas')
      canvas.width = vp.width
      canvas.height = vp.height
      into.append(canvas)
      await p.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise
      await new Promise(requestAnimationFrame) // let other frames through between pages
    }
  }
  let deskDrawn = false, readerDrawn = false
  const deskPdf = () => {
    if (deskDrawn) return
    deskDrawn = true
    draw($('.scr-pages', pc), Math.min(devicePixelRatio * 1.5, 2)).catch(() => { deskDrawn = false }) // keeps the placeholder page
  }
  const open = () => {
    dialog.showModal()
    if (readerDrawn) return
    readerDrawn = true
    const pages = $('.reader-pages', dialog)
    draw(pages, Math.min(devicePixelRatio, 2)).catch(() => {
      // PDF.js unavailable (offline / blocked CDN): fall back to the browser's own viewer.
      pages.innerHTML = `<iframe src="${PDF}#view=FitH" title="MLESA-Net paper"></iframe>`
    })
  }
  const scene = $('.pc-scene', pc)
  scene.addEventListener('click', open)
  scene.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() } })
  $('.reader-close', dialog).addEventListener('click', () => dialog.close())
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close() })

  // Overview <-> computer: the overview card shrinks into the monitor screen (and grows back out).
  const host = pc.closest('.research')
  const card = $('.paper', host)
  const screen = () => $('.scr', pc).getBoundingClientRect()
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
  const fit = (from, to) => `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width}, ${to.height / from.height})`
  let busy = false
  host.switchView = (to) => {
    const from = host.dataset.view
    if (busy) return false // mid-switch: ignore rather than snap to the end
    if (reduced || from === to) {
      host.dataset.view = to
      if (to === 'computer') deskPdf()
      return
    }
    busy = true
    card.classList.add('morphing')
    if (to === 'computer') {
      const r0 = card.getBoundingClientRect()
      const top = card.offsetTop, left = card.offsetLeft
      host.dataset.view = to
      // Keep the card on screen, floating where it was, while it flies into the monitor.
      card.style.cssText = `display:grid;position:absolute;z-index:5;margin:0;top:${top}px;left:${left}px;width:${r0.width}px;transform-origin:0 0;pointer-events:none`
      pc.animate([{ opacity: 0, transform: 'translateY(40px) scale(0.96)' }, { opacity: 1, transform: 'none' }], { duration: 700, easing: EASE })
      card.animate([
        { transform: 'none', opacity: 1 },
        { opacity: 1, offset: 0.7 },
        { transform: fit(r0, screen()), opacity: 0 },
      ], { duration: 1100, easing: EASE }).finished.then(() => {
        card.style.cssText = ''
        card.classList.remove('morphing')
        deskPdf()
        $('.monitor .front', pc).animate([{ boxShadow: '0 0 0 2px #0a84ff, 0 0 30px 6px rgba(10,132,255,.5)' }, { boxShadow: 'none' }], { duration: 700 })
        busy = false
      })
    } else {
      const s = screen()
      const top = pc.offsetTop, w = pc.offsetWidth
      host.dataset.view = to
      // The desk lingers as a fading ghost while the card grows back out of its screen.
      pc.style.cssText = `display:block;position:absolute;z-index:-1;top:${top}px;left:0;width:${w}px;pointer-events:none`
      pc.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(30px) scale(0.97)' }], { duration: 500, easing: EASE }).finished.then(() => { pc.style.cssText = '' })
      const r1 = card.getBoundingClientRect()
      card.style.transformOrigin = '0 0'
      card.animate([
        { transform: fit(r1, s), opacity: 0 },
        { opacity: 1, offset: 0.35 },
        { transform: 'none', opacity: 1 },
      ], { duration: 900, easing: EASE }).finished.then(() => { card.style.transformOrigin = ''; card.classList.remove('morphing'); busy = false })
    }
  }
})()

/* List / 3D view switches (file deck, drawer) */
$$('.views').forEach((host) => {
  const buttons = $$('.view-toggle button', host)
  buttons.forEach((b) => b.addEventListener('click', () => {
    if (host.switchView) { if (host.switchView(b.dataset.view) === false) return }
    else host.dataset.view = b.dataset.view
    buttons.forEach((x) => x.setAttribute('aria-pressed', x === b))
    if (window.ScrollTrigger) ScrollTrigger.refresh()
  }))
})
