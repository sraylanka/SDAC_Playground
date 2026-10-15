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
