import React from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform
} from 'https://esm.sh/framer-motion@11.11.17?bundle';

const { useMemo, useRef } = React;

// =============================================
// Header scroll fade
// =============================================
const header = document.getElementById('siteHeader');
const HIDE_THRESHOLD = 0.85;
let ticking = false;

function updateHeader() {
  const scrolled = window.scrollY;
  const threshold = window.innerHeight * HIDE_THRESHOLD;
  if (scrolled > threshold) header.classList.add('hidden');
  else header.classList.remove('hidden');
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(updateHeader);
    ticking = true;
  }
}, { passive: true });
updateHeader();

// =============================================
// Reveal-on-scroll
// =============================================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// =============================================
// Number counter animation (supports decimals)
// =============================================
function animateCount(el, target, duration = 1600) {
  const isFloat = !Number.isInteger(target);
  const start = performance.now();
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    const value = target * eased;
    el.textContent = isFloat ? value.toFixed(1) : Math.round(value).toString();
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = isFloat ? target.toFixed(1) : target.toString();
  }
  requestAnimationFrame(tick);
}

document.querySelectorAll('[data-count]').forEach(el => {
  const target = parseFloat(el.dataset.count);
  const host = el.closest('.reveal') || el;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(el, target);
        obs.unobserve(host);
      }
    });
  }, { threshold: 0.4 });
  obs.observe(host);
});

// =============================================
// Hero birds
// =============================================
// One image per bird (no overlapping clip-path copies, which
// is what produced the "two stacked birds" look). The flap is
// faked with a subtle scaleY pulse so the wings appear to lift
// and lower while the body silhouette stays put.
function BirdVisual({ width, depthClass, blur, opacity, flapDuration, flapDelay, reducedMotion }) {
  const flap = reducedMotion
    ? {}
    : {
        // Squish/stretch vertically — reads as wings going down
        // (silhouette compresses) and up (silhouette extends).
        scaleY: [1, 0.78, 1.06, 0.86, 1]
      };

  return React.createElement(
    'div',
    {
      className: `cinematic-bird ${depthClass}`,
      style: {
        width,
        opacity,
        filter: `blur(${blur}px)`
      }
    },
    React.createElement(
      motion.div,
      {
        className: 'bird-flap',
        style: { transformOrigin: '50% 55%' },
        animate: flap,
        transition: reducedMotion
          ? { duration: 0 }
          : {
              duration: flapDuration,
              ease: 'easeInOut',
              repeat: Infinity,
              delay: flapDelay,
              times: [0, 0.28, 0.5, 0.78, 1]
            }
      },
      React.createElement('img', { src: 'seagull.png', alt: '' })
    )
  );
}

function FlyingBird({
  top,
  width,
  duration,
  delay,
  blur,
  opacity,
  flapDuration,
  flapDelay,
  rotateDrift,
  scale,
  parallax,
  depthClass,
  flip
}) {
  const reducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, value => value * parallax);

  // No vertical drift on the bird body itself — only a very tiny
  // rotational sway so the whole bird doesn't bob up and down.
  const swayFrames = useMemo(
    () => ({
      rotate: [-rotateDrift, rotateDrift, -rotateDrift * 0.6, rotateDrift * 0.4, -rotateDrift],
      scale: [scale, scale * 1.004, scale * 0.998, scale * 1.002, scale]
    }),
    [rotateDrift, scale]
  );

  return React.createElement(
    motion.div,
    {
      className: 'bird-track',
      style: {
        top,
        y: parallaxY
      }
    },
    React.createElement(
      motion.div,
      {
        animate: reducedMotion ? { x: '-12vw' } : { x: ['18vw', '-132vw'] },
        transition: reducedMotion
          ? { duration: 0 }
          : {
              duration,
              ease: 'linear',
              repeat: Infinity,
              delay,
              repeatDelay: 0
            }
      },
      React.createElement(
        motion.div,
        {
          style: {
            scaleX: flip ? -1 : 1,
            transformOrigin: 'center center'
          },
          animate: reducedMotion ? {} : swayFrames,
          transition: reducedMotion
            ? { duration: 0 }
            : {
                duration: duration * 0.34,
                ease: 'easeInOut',
                repeat: Infinity,
                times: [0, 0.25, 0.5, 0.75, 1]
              }
        },
        React.createElement(BirdVisual, {
          width,
          depthClass,
          blur,
          opacity,
          flapDuration,
          flapDelay,
          reducedMotion
        })
      )
    )
  );
}

function HeroBirds() {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(FlyingBird, {
      top: '18%',
      width: 'clamp(120px, 13vw, 220px)',
      duration: 44,
      delay: -21,
      blur: 0.7,
      opacity: 0.55,
      flapDuration: 1.1,
      flapDelay: 0.0,
      rotateDrift: 1.2,
      scale: 0.78,
      parallax: -0.02,
      depthClass: 'bird-depth-mid',
      flip: true
    }),
    React.createElement(FlyingBird, {
      top: '6%',
      width: 'clamp(82px, 9vw, 150px)',
      duration: 55,
      delay: -34,
      blur: 1.4,
      opacity: 0.32,
      flapDuration: 1.4,
      flapDelay: 0.4,
      rotateDrift: 0.7,
      scale: 0.6,
      parallax: -0.012,
      depthClass: 'bird-depth-far',
      flip: true
    }),
    React.createElement(FlyingBird, {
      top: '38%',
      width: 'clamp(64px, 7.5vw, 120px)',
      duration: 68,
      delay: -12,
      blur: 1.9,
      opacity: 0.22,
      flapDuration: 1.7,
      flapDelay: 0.8,
      rotateDrift: 0.5,
      scale: 0.5,
      parallax: -0.008,
      depthClass: 'bird-depth-far',
      flip: true
    }),
    // A close, larger gull cutting across the upper frame
    React.createElement(FlyingBird, {
      top: '28%',
      width: 'clamp(160px, 17vw, 280px)',
      duration: 36,
      delay: -8,
      blur: 0.3,
      opacity: 0.7,
      flapDuration: 0.95,
      flapDelay: 0.25,
      rotateDrift: 1.6,
      scale: 0.92,
      parallax: -0.028,
      depthClass: 'bird-depth-near',
      flip: true
    }),
    // A tiny distant speck near the horizon
    React.createElement(FlyingBird, {
      top: '11%',
      width: 'clamp(48px, 5.5vw, 90px)',
      duration: 78,
      delay: -50,
      blur: 2.2,
      opacity: 0.18,
      flapDuration: 1.9,
      flapDelay: 1.1,
      rotateDrift: 0.35,
      scale: 0.42,
      parallax: -0.006,
      depthClass: 'bird-depth-far',
      flip: true
    }),
    // A mid-depth gull, offset timing so the flock doesn't sync
    React.createElement(FlyingBird, {
      top: '44%',
      width: 'clamp(100px, 11vw, 180px)',
      duration: 50,
      delay: -28,
      blur: 0.9,
      opacity: 0.45,
      flapDuration: 1.25,
      flapDelay: 0.55,
      rotateDrift: 1.0,
      scale: 0.68,
      parallax: -0.018,
      depthClass: 'bird-depth-mid',
      flip: true
    })
  );
}

const heroBirdsMount = document.getElementById('heroBirds');
if (heroBirdsMount) {
  createRoot(heroBirdsMount).render(React.createElement(HeroBirds));
}

// =============================================
// Fish schools (opportunity + education)
// =============================================
// Same layered-depth idea as the seagulls: each fish is one image,
// pulsed with a subtle swim wiggle (rotation), drifting horizontally
// across the section. Mixed sizes, speeds, depths, and directions.
function FishVisual({ width, image, blur, opacity, swimDuration, swimDelay, reducedMotion }) {
  const swim = reducedMotion
    ? {}
    : {
        // A gentle side-to-side wag — reads as swimming.
        rotate: [-2.4, 2.4, -1.6, 2.0, -2.4]
      };

  return React.createElement(
    'div',
    {
      className: 'cinematic-fish',
      style: { width, opacity, filter: `blur(${blur}px)` }
    },
    React.createElement(
      motion.div,
      {
        className: 'fish-flap',
        style: { transformOrigin: '40% 50%' },
        animate: swim,
        transition: reducedMotion
          ? { duration: 0 }
          : {
              duration: swimDuration,
              ease: 'easeInOut',
              repeat: Infinity,
              delay: swimDelay,
              times: [0, 0.25, 0.5, 0.75, 1]
            }
      },
      React.createElement('img', { src: image, alt: '' })
    )
  );
}

function SwimmingFish({
  top,
  width,
  duration,
  delay,
  blur,
  opacity,
  swimDuration,
  swimDelay,
  rotateDrift,
  scale,
  parallax,
  image,
  direction
}) {
  const reducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, value => value * parallax);

  // 'left' = swims right-to-left; 'right' = swims left-to-right.
  // The source PNGs are assumed to face right by default, so we flip
  // when the fish is heading left.
  const goingLeft = direction === 'left';
  const xFrames = goingLeft ? ['18vw', '-132vw'] : ['-132vw', '18vw'];

  const swayFrames = useMemo(
    () => ({
      rotate: [-rotateDrift, rotateDrift, -rotateDrift * 0.6, rotateDrift * 0.4, -rotateDrift],
      scale: [scale, scale * 1.005, scale * 0.997, scale * 1.003, scale]
    }),
    [rotateDrift, scale]
  );

  return React.createElement(
    motion.div,
    {
      className: 'bird-track',
      style: { top, y: parallaxY }
    },
    React.createElement(
      motion.div,
      {
        animate: reducedMotion ? { x: goingLeft ? '-12vw' : '12vw' } : { x: xFrames },
        transition: reducedMotion
          ? { duration: 0 }
          : {
              duration,
              ease: 'linear',
              repeat: Infinity,
              delay,
              repeatDelay: 0
            }
      },
      React.createElement(
        motion.div,
        {
          style: {
            scaleX: goingLeft ? -1 : 1,
            transformOrigin: 'center center'
          },
          animate: reducedMotion ? {} : swayFrames,
          transition: reducedMotion
            ? { duration: 0 }
            : {
                duration: duration * 0.34,
                ease: 'easeInOut',
                repeat: Infinity,
                times: [0, 0.25, 0.5, 0.75, 1]
              }
        },
        React.createElement(FishVisual, {
          width,
          image,
          blur,
          opacity,
          swimDuration,
          swimDelay,
          reducedMotion
        })
      )
    )
  );
}

// Opportunity scene — friendlier shallower waters, nemo + dory
function OpportunityFish() {
  return React.createElement(
    React.Fragment,
    null,
    // Big nemo, close, swims right
    React.createElement(SwimmingFish, {
      top: '68%',
      width: 'clamp(110px, 12vw, 200px)',
      duration: 42,
      delay: -8,
      blur: 0.2,
      opacity: 0.92,
      swimDuration: 0.9,
      swimDelay: 0.0,
      rotateDrift: 1.4,
      scale: 0.95,
      parallax: -0.025,
      image: 'nemo.png',
      direction: 'right'
    }),
    // Mid dory, swims left
    React.createElement(SwimmingFish, {
      top: '38%',
      width: 'clamp(90px, 10vw, 170px)',
      duration: 56,
      delay: -32,
      blur: 0.6,
      opacity: 0.78,
      swimDuration: 1.1,
      swimDelay: 0.35,
      rotateDrift: 1.1,
      scale: 0.78,
      parallax: -0.018,
      image: 'dory.png',
      direction: 'left'
    }),
    // Small distant nemo, swims right
    React.createElement(SwimmingFish, {
      top: '22%',
      width: 'clamp(50px, 6vw, 100px)',
      duration: 78,
      delay: -45,
      blur: 1.4,
      opacity: 0.4,
      swimDuration: 1.4,
      swimDelay: 0.7,
      rotateDrift: 0.7,
      scale: 0.5,
      parallax: -0.01,
      image: 'nemo.png',
      direction: 'right'
    }),
    // Medium dory low, swims left
    React.createElement(SwimmingFish, {
      top: '82%',
      width: 'clamp(70px, 8vw, 140px)',
      duration: 62,
      delay: -20,
      blur: 0.4,
      opacity: 0.75,
      swimDuration: 1.0,
      swimDelay: 0.5,
      rotateDrift: 1.0,
      scale: 0.66,
      parallax: -0.014,
      image: 'dory.png',
      direction: 'left'
    }),
    // Tiny far nemo
    React.createElement(SwimmingFish, {
      top: '52%',
      width: 'clamp(40px, 5vw, 80px)',
      duration: 88,
      delay: -60,
      blur: 1.8,
      opacity: 0.3,
      swimDuration: 1.6,
      swimDelay: 1.0,
      rotateDrift: 0.5,
      scale: 0.42,
      parallax: -0.008,
      image: 'nemo.png',
      direction: 'right'
    }),
    // ---- Right-side fillers ----
    // Mid nemo just entering from the right edge, swims left
    React.createElement(SwimmingFish, {
      top: '50%',
      width: 'clamp(90px, 10vw, 170px)',
      duration: 48,
      delay: -2,
      blur: 0.5,
      opacity: 0.82,
      swimDuration: 1.0,
      swimDelay: 0.2,
      rotateDrift: 1.2,
      scale: 0.78,
      parallax: -0.02,
      image: 'nemo.png',
      direction: 'left'
    }),
    // Medium dory approaching the right edge (late in rightward loop)
    React.createElement(SwimmingFish, {
      top: '30%',
      width: 'clamp(80px, 9vw, 150px)',
      duration: 54,
      delay: -50,
      blur: 0.6,
      opacity: 0.78,
      swimDuration: 1.05,
      swimDelay: 0.4,
      rotateDrift: 1.0,
      scale: 0.72,
      parallax: -0.017,
      image: 'dory.png',
      direction: 'right'
    }),
    // Small dory at the top-right, fresh leftward
    React.createElement(SwimmingFish, {
      top: '14%',
      width: 'clamp(55px, 6.5vw, 100px)',
      duration: 70,
      delay: -4,
      blur: 1.0,
      opacity: 0.55,
      swimDuration: 1.3,
      swimDelay: 0.55,
      rotateDrift: 0.8,
      scale: 0.55,
      parallax: -0.011,
      image: 'dory.png',
      direction: 'left'
    }),
    // Small nemo bottom-right, just finishing rightward
    React.createElement(SwimmingFish, {
      top: '76%',
      width: 'clamp(60px, 7vw, 110px)',
      duration: 60,
      delay: -55,
      blur: 0.7,
      opacity: 0.7,
      swimDuration: 1.0,
      swimDelay: 0.3,
      rotateDrift: 1.1,
      scale: 0.6,
      parallax: -0.015,
      image: 'nemo.png',
      direction: 'right'
    })
  );
}

// Education scene — deeper, more exotic: lionfish + dory + nemo
function EducationFish() {
  return React.createElement(
    React.Fragment,
    null,
    // Big lionfish, dramatic, swims left
    React.createElement(SwimmingFish, {
      top: '72%',
      width: 'clamp(130px, 14vw, 230px)',
      duration: 50,
      delay: -10,
      blur: 0.25,
      opacity: 0.9,
      swimDuration: 1.3,
      swimDelay: 0.0,
      rotateDrift: 1.0,
      scale: 0.98,
      parallax: -0.022,
      image: 'lionfish.png',
      direction: 'left'
    }),
    // Mid dory, swims right
    React.createElement(SwimmingFish, {
      top: '46%',
      width: 'clamp(85px, 9.5vw, 160px)',
      duration: 58,
      delay: -30,
      blur: 0.7,
      opacity: 0.7,
      swimDuration: 1.05,
      swimDelay: 0.4,
      rotateDrift: 1.1,
      scale: 0.72,
      parallax: -0.016,
      image: 'dory.png',
      direction: 'right'
    }),
    // Small lionfish far, swims left
    React.createElement(SwimmingFish, {
      top: '28%',
      width: 'clamp(60px, 7vw, 110px)',
      duration: 82,
      delay: -52,
      blur: 1.5,
      opacity: 0.4,
      swimDuration: 1.55,
      swimDelay: 0.85,
      rotateDrift: 0.6,
      scale: 0.55,
      parallax: -0.009,
      image: 'lionfish.png',
      direction: 'left'
    }),
    // Small nemo, swims right
    React.createElement(SwimmingFish, {
      top: '60%',
      width: 'clamp(55px, 6.5vw, 100px)',
      duration: 68,
      delay: -22,
      blur: 0.9,
      opacity: 0.6,
      swimDuration: 0.95,
      swimDelay: 0.6,
      rotateDrift: 0.9,
      scale: 0.52,
      parallax: -0.012,
      image: 'nemo.png',
      direction: 'right'
    }),
    // Tiny far dory
    React.createElement(SwimmingFish, {
      top: '14%',
      width: 'clamp(42px, 5vw, 85px)',
      duration: 94,
      delay: -68,
      blur: 1.9,
      opacity: 0.28,
      swimDuration: 1.7,
      swimDelay: 1.2,
      rotateDrift: 0.45,
      scale: 0.44,
      parallax: -0.007,
      image: 'dory.png',
      direction: 'right'
    }),
    // ---- Right-side fillers ----
    // Mid lionfish entering from the right, swims left
    React.createElement(SwimmingFish, {
      top: '38%',
      width: 'clamp(100px, 11vw, 180px)',
      duration: 56,
      delay: -3,
      blur: 0.5,
      opacity: 0.82,
      swimDuration: 1.2,
      swimDelay: 0.15,
      rotateDrift: 1.0,
      scale: 0.8,
      parallax: -0.02,
      image: 'lionfish.png',
      direction: 'left'
    }),
    // Mid nemo approaching the right edge (late in rightward loop)
    React.createElement(SwimmingFish, {
      top: '24%',
      width: 'clamp(70px, 8vw, 130px)',
      duration: 62,
      delay: -56,
      blur: 0.7,
      opacity: 0.7,
      swimDuration: 0.95,
      swimDelay: 0.4,
      rotateDrift: 1.1,
      scale: 0.66,
      parallax: -0.015,
      image: 'nemo.png',
      direction: 'right'
    }),
    // Larger dory bottom-right, fresh leftward
    React.createElement(SwimmingFish, {
      top: '80%',
      width: 'clamp(95px, 10.5vw, 175px)',
      duration: 52,
      delay: -5,
      blur: 0.45,
      opacity: 0.85,
      swimDuration: 1.05,
      swimDelay: 0.3,
      rotateDrift: 1.2,
      scale: 0.82,
      parallax: -0.02,
      image: 'dory.png',
      direction: 'left'
    }),
    // Small lionfish mid-right, late in rightward loop
    React.createElement(SwimmingFish, {
      top: '56%',
      width: 'clamp(70px, 8vw, 125px)',
      duration: 64,
      delay: -58,
      blur: 0.8,
      opacity: 0.65,
      swimDuration: 1.35,
      swimDelay: 0.6,
      rotateDrift: 0.9,
      scale: 0.62,
      parallax: -0.013,
      image: 'lionfish.png',
      direction: 'right'
    })
  );
}

const oppFishMount = document.getElementById('oppFish');
if (oppFishMount) {
  createRoot(oppFishMount).render(React.createElement(OpportunityFish));
}

const eduFishMount = document.getElementById('eduFish');
if (eduFishMount) {
  createRoot(eduFishMount).render(React.createElement(EducationFish));
}

// =============================================
// Abyss shark — scroll-driven, left to right
// =============================================
// The shark's horizontal position is bound to the user's scroll
// progress through the #abyss section. Scrolling the section into
// view drags the shark across the screen; pausing the scroll
// pauses the swim (its tail keeps wagging subtly).
function AbyssShark() {
  // Hook the scroll progress to the abyss section element.
  const sectionRef = useRef(null);
  if (!sectionRef.current && typeof document !== 'undefined') {
    sectionRef.current = document.getElementById('abyss');
  }

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start']  // section entering → fully past
  });

  // Shark starts off-screen right. As the user scrolls into the
  // abyss section, it swims in and parks at its resting position.
  // It does not exit — once docked it stays there for the rest of
  // the section.
  //   0    → 0.5 : enter from off-screen right (120vw) → rest (60vw)
  //   0.5  → 1   : holds at 60vw
  const x = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    ['120vw', '60vw', '60vw']
  );

  // Subtle continuous tail wag — independent of scroll.
  const tailWag = {
    rotate: [-1.5, 1.5, -0.8, 1.2, -1.5]
  };

  return React.createElement(
    motion.div,
    {
      style: {
        position: 'absolute',
        top: '40%',
        left: 0,
        width: 'clamp(280px, 38vw, 620px)',
        aspectRatio: '3 / 2',
        x,
        scaleX: -1,           // mirror so the shark faces its travel direction (right→left)
        opacity: 0.92,
        filter: 'blur(0.4px)',
        willChange: 'transform'
      }
    },
    React.createElement(
      motion.div,
      {
        style: {
          width: '100%',
          height: '100%',
          transformOrigin: '40% 50%'
        },
        animate: tailWag,
        transition: {
          duration: 2.6,
          ease: 'easeInOut',
          repeat: Infinity,
          times: [0, 0.25, 0.5, 0.75, 1]
        }
      },
      React.createElement('img', {
        src: 'shark.png',
        alt: '',
        style: {
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          userSelect: 'none'
        }
      })
    )
  );
}

const sharkMount = document.getElementById('abyssShark');
if (sharkMount) {
  createRoot(sharkMount).render(React.createElement(AbyssShark));
}
