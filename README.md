# Flight Controls Design Explorer

Private browser-based study tool for continuous-time, single-input/single-output controls coursework. Static site with no external scripts, analytics, or server-side input collection. All input persistence uses the visitor's localStorage.

Enter percent overshoot or its fractional Mp equivalent, select explored damping and a settling-time target, and inspect response, poles, or the damping tradeoff. The linked second-order loop follows these inputs. Custom real polynomial coefficients, positive gain, and frequency bounds analyze the actual open loop under unity negative feedback.

The analyzer reports system type, closed-loop poles, all detected gain crossovers, phase margins, error constants, and sampled response metrics. Proper transfer functions only, degrees 0–6. Assumptions and numerical limits are documented in the page.

## Verification

`npm test` runs numerical tests. Browser checks use Playwright and a local server (`npm start`). Six independent transfer-function comparisons against SciPy validated polynomial roots and step responses, including the motor loop, double integrator, direct feedthrough, and a sixth-order model.

Source assets are in `public`; `npm run build` copies them to the static deployment directory `dist`; Sites identity is in `.openai/hosting.json`. Preserve owner-only access on subsequent deployments.
