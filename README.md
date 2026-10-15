# Flight Controls Design Explorer

Private browser-based study tool for continuous-time, single-input/single-output controls coursework. Static site with no external scripts, analytics, or server-side input collection. All input persistence uses the visitor's localStorage.

Enter percent overshoot or its fractional Mp equivalent, select explored damping and a settling-time target, and inspect response, poles, or the damping tradeoff. The linked second-order loop follows these inputs. Custom real polynomial coefficients, positive gain, and frequency bounds analyze the actual open loop under unity negative feedback.

The analyzer reports system type, closed-loop poles, all detected gain crossovers, phase margins, error constants, and sampled response metrics. Proper transfer functions only, degrees 0–6. Assumptions and numerical limits are documented in the page.

## Verification

`npm test` runs numerical tests. Browser checks use Playwright and a local server (`npm start`). Six independent transfer-function comparisons against SciPy validated polynomial roots and step responses, including the motor loop, double integrator, direct feedthrough, and a sixth-order model.

Source assets are in `public`; `npm run build` copies them to the static deployment directory `dist`; Sites identity is in `.openai/hosting.json`. Preserve owner-only access on subsequent deployments.

## Topic playgrounds

The sidebar groups Overshoot & Damping and Settling Time & Poles under Time Response, Frequency Response under its own group, and System Type under Steady-State Error. Each topic has a direct hash URL and a focused field guide. Inputs are shared across topics and preserved in localStorage; the last topic is restored when no topic is specified in the URL.

Edit `public/topics.mjs` to assign textbook chapter/section labels or extend the topic catalog. Navigation and responsive-menu behavior live in `public/navigation.mjs`. The hosted Site remains owner-private; authentication is supplied by Sites rather than by the static application itself.

## Digital control playground

The `#digital-control` topic follows Nise, Chapter 13, §§13.1–13.2 (printed pp. 707–714). Explore sample period, aliasing, unsigned nearest-level A/D quantization, binary-weighted D/A conversion, and zero-order hold. Select a sample to inspect its voltage, binary code, conversion error, and hold interval. Presets demonstrate adequate sampling, aliasing, coarse quantization, and converter overload.

`public/digital-math.mjs` contains pure sampling and conversion functions; `public/digital.mjs` connects the controls to the shared chart renderer. The source textbook stays outside the published assets. No digital compensator, closed-loop plant, conversion delay, or reconstruction filter is simulated.

## Chapters 9 and 10

Thirteen additional playgrounds follow Nise's printed section/page references. The sidebar groups Chapter 9 compensation and Chapter 10 frequency-response tools; every section has a direct hash URL and a local field guide.

- Chapter 9: `#lead-design`, `#lag-design`, `#combined-design`, `#rate-feedback`, and `#compensator-circuits`.
- Chapter 10: `#sinusoidal-response`, `#bode-builder`, `#nyquist-stability`, `#bandwidth-resonance`, `#bode-tracking`, `#time-delay`, `#nichols-chart`, and `#system-identification`.

`chapter-math.mjs` contains pure numerical functions; `chapter9.mjs` and `chapter10.mjs` define experiments; `lab-ui.mjs` supplies form validation, plots, and local persistence; `chapter-catalog.mjs` supplies topic metadata. Compensation and Bode Builder can send their loop into the original Frequency Response analyzer. Identification observations are simulated and stored locally; they can be cleared or reset.

Root loci sample positive gain from 0 to 500 and omit unresolved root solutions. Target design uses second-order estimates, while comparison metrics use the full finite-horizon response. Nyquist counts use a complete clockwise right-half-plane contour, with origin indentation, and cross-check against rational closed-loop poles; marginal or unresolved counts are labeled. The displayed frequency image can be clipped independently of the contour calculation. Pure delay plots use the exact exponential; the first delay boundary is reported only for the stable, single-crossover preset cases. Circuit models assume ideal components and unloaded passive networks. Model identification is a manual educational exercise, not an automatic or hardware-based estimator.

`npm test` covers analytic margins, Nyquist winding signs and boundary cases, root-locus geometry, exact origin factors, bandwidth, circuit limits, tracking, navigation, and finite plots for every new lab. `tests/browser.mjs` additionally exercises chapter navigation and representative interactions when Playwright/Chromium is installed.
