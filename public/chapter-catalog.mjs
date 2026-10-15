const entries=[
 ['lead-design','Chapter 9 · Root locus','PD & Lead Compensation','PD & Lead','Compensation','Reshape the root locus, meet a target pole, and compare the full response with the second-order estimate.','§9.3 · pp. 462–473'],
 ['lag-design','Chapter 9 · Root locus','PI & Lag Compensation','PI & Lag','Compensation','Move a pole and zero near the origin. Compare tracking accuracy, slow tails, and transient response.','§9.2 · pp. 453–461'],
 ['combined-design','Chapter 9 · Root locus','PID & Lag–Lead Design','PID & Lag–Lead','Design','Design in stages: improve the transient response, then improve steady-state tracking. Check every stage.','§9.4 · pp. 474–486'],
 ['rate-feedback','Chapter 9 · Root locus','Rate Feedback','Rate','Feedback','Close an inner velocity loop around a motor, then tune the outer position loop.','§9.5 · pp. 487–494'],
 ['compensator-circuits','Chapter 9 · Root locus','Compensator Circuits','Compensator','Circuits','Connect resistor and capacitor values to physical PI, PD, lead, and lag networks.','§9.6 · pp. 495–499'],
 ['sinusoidal-response','Chapter 10 · Frequency response','Sinusoidal Response','Sinusoidal','Response','Watch gain and phase turn an input sine into an output sine. Scrub frequency to connect time and frequency.','§10.1 · pp. 526–530'],
 ['bode-builder','Chapter 10 · Frequency response','Bode Builder & Margins','Bode Builder &','Margins','Build a transfer function from factors, add their contributions, and compare exact curves with asymptotes.','§§10.2, 10.6–10.7 · pp. 531–549, 564–569'],
 ['nyquist-stability','Chapter 10 · Frequency response','Nyquist & Stability','Nyquist &','Stability','Follow frequency around the curve. Connect the critical point, encirclements, and unstable closed-loop poles.','§§10.3–10.6 · pp. 550–565'],
 ['bandwidth-resonance','Chapter 10 · Frequency response','Bandwidth & Resonance','Bandwidth &','Resonance','Link frequency resonance, bandwidth, damping, overshoot, and the speed of a step response.','§§10.8–10.10 · pp. 570–581'],
 ['bode-tracking','Chapter 10 · Frequency response','Tracking Error from Bode','Tracking Error','from Bode','Read the low-frequency slope, recover the error constants, and compare step, ramp, and parabolic tracking.','§10.11 · pp. 582–585'],
 ['time-delay','Chapter 10 · Frequency response','Time Delay & Stability','Time Delay &','Stability','Add transport delay. Magnitude stays fixed while phase and stability margin change.','§10.12 · pp. 586–590'],
 ['nichols-chart','Chapter 10 · Frequency response','Nichols & M/N Circles','Nichols &','M/N Circles','Map the same frequency from the open-loop plane to closed-loop gain and phase contours.','§10.9 · pp. 573–577'],
 ['system-identification','Chapter 10 · Frequency response','Identify the Transfer Function','Identify the','Transfer Function','Collect simulated sine measurements, estimate poles and zeros, and test your model against an unknown plant.','§10.13 · pp. 591–594']
];
export const chapterTopics=entries.map(([id,group,title,lead,accent,description,reference])=>({id,group,title,lead,accent,description,model:'Nise · '+reference,reference,workspace:'chapter',chart:id}));
