import test from 'node:test';
import assert from 'node:assert/strict';
import {convertSample,sampleSignal,holdSeries} from '../public/digital-math.mjs';
const base={period:.1,frequency:1,amplitude:2,offset:2.5,phase:0,bits:3,span:5};
test('three-bit conversion uses weighted binary voltages and saturates',()=>{const s=convertSample(6,3,8);assert.equal(s.binary,'110');assert.equal(s.voltage,6);assert.equal(convertSample(-1,3,8).code,0);assert.equal(convertSample(8,3,8).code,7);assert.equal(convertSample(8,3,8).overload,true);});
test('rounding error is at most half a step within representable range',()=>{for(let v=0;v<=4.375;v+=.007){const s=convertSample(v,3,5);assert.ok(Math.abs(s.error)<=s.delta/2+1e-12);}assert.equal(convertSample(.3125,3,5).code,1);});
test('sampling clock and alias agree at every instant including nonzero phase',()=>{const d=sampleSignal({...base,period:.3,frequency:4,phase:45});assert.equal(d.samples.length,7);assert.ok(Math.abs(d.alias-2/3)<1e-12);for(const s of d.samples)assert.ok(Math.abs(d.aliasSignal(s.t)-s.input)<1e-12);});
test('zero-order hold keeps old value until the next sample then jumps',()=>{assert.deepEqual(holdSeries([{t:0,voltage:1},{t:.2,voltage:3}],.4),[[0,1],[.2,1],[.2,3],[.4,3]]);});
test('sampling refuses invalid and unbounded inputs',()=>{for(const patch of [{period:0},{period:NaN},{frequency:Infinity},{bits:7},{span:0},{amplitude:-1}])assert.throws(()=>sampleSignal({...base,...patch}));});
