import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Text as SvgText } from 'react-native-svg';
import { Btn, Card, Chip, Formula, LabeledSlider, P, Row, Screen, Small } from '../components/ui';
import { C, S, mono } from '../theme';
import { clamp, fmt } from '../math';
import HtmlView from '../components/HtmlView';
import { GD_HTML } from '../gd3d/sceneHtml';

// A loss landscape with a shallow local minimum on the right and the true valley on the left.
const L = (t: number) => 0.05 * t ** 4 - 0.5 * t ** 2 + 0.15 * t + 1.6;
const dL = (t: number) => 0.2 * t ** 3 - t + 0.15;
const TMIN = -3.6, TMAX = 3.6;

export default function GradientScreen() {
  const [theta, setTheta] = useState(3.0);
  const [lr, setLr] = useState(0.15);
  const [noise, setNoise] = useState(false);
  const [path, setPath] = useState<number[]>([3.0]);
  const [auto, setAuto] = useState(false);
  const [lastStep, setLastStep] = useState<{ g: number; dt: number } | null>(null);

  const step = () => {
    const g = dL(theta) + (noise ? (Math.random() * 2 - 1) * 1.2 : 0);
    const dt = -lr * g;
    const nt = clamp(theta + dt, TMIN, TMAX);
    setTheta(nt);
    setPath((p) => [...p, nt]);
    setLastStep({ g, dt });
  };
  const stepRef = useRef(step);
  stepRef.current = step;
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => stepRef.current(), 350);
    return () => clearInterval(id);
  }, [auto]);
  useEffect(() => {
    if (path.length > 120) setAuto(false);
  }, [path.length]);

  const reset = (t: number) => {
    setAuto(false);
    setTheta(t);
    setPath([t]);
    setLastStep(null);
  };

  const losses = path.map(L);
  const recent = losses.slice(-6);
  const rising = recent.length >= 4 && recent[recent.length - 1] > recent[recent.length - 2] && recent[recent.length - 2] > recent[recent.length - 3];
  const stuck = lastStep && Math.abs(lastStep.dt) < 0.004 && Math.abs(lastStep.g) > 0.02;
  const diag = rising ? 'Loss climbing: the learning rate is too large and each step overshoots to the far slope.' : stuck ? 'Steps are microscopic: the learning rate is too small. Convergence will take, in the lecturer\'s phrase, a million years.' : Math.abs(dL(theta)) < 0.02 ? (theta > 0 ? 'Slope ≈ 0, so the ball has stopped. But this is the shallow local minimum, not the valley floor. Try SGD noise or a larger learning rate to jostle out.' : 'Slope ≈ 0 at the global minimum. Training has converged.') : 'Loss is, on the whole, going down. That is what you want to see.';

  return (
    <Screen intro="You are on a mountain in dense fog. You cannot see the landscape, only feel the slope under your feet, and measuring it is expensive. So: take a reading, step downhill, repeat. That is **gradient** descent, and the fog is why nobody ever sees the whole loss surface.">
      <Card title="The loss landscape in two weights">
        <P dim>Height is the loss L(w₁, w₂); the two horizontal axes are the weights. Higher means a worse prediction, lower a better one. The sphere is the current weights. Take steps, or tap anywhere on the terrain to move the weights there and step from that point. Switch to the ravine to see why the zigzag motivates **momentum** and Adam.</P>
        <HtmlView html={GD_HTML} height={760} />
        <Small>Requires an internet connection the first time, to fetch the 3-D engine.</Small>
      </Card>

      <Card title="One weight: the loss as a curve">
        <Landscape theta={theta} path={path} lr={lr} g={lastStep?.g ?? dL(theta)} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Btn label="Step" onPress={() => { setAuto(false); step(); }} />
          <Btn label={auto ? 'Pause' : 'Run'} kind="ghost" onPress={() => setAuto((a) => !a)} />
          <Btn label="Reset" kind="ghost" onPress={() => reset(3.0)} />
        </Row>
        <Row wrap>
          <Chip label="start right (θ = 3)" onPress={() => reset(3.0)} active={path[0] === 3.0} />
          <Chip label="start left (θ = −3.4)" onPress={() => reset(-3.4)} active={path[0] === -3.4} />
          <Chip label="start near the hump (θ = 0.4)" onPress={() => reset(0.4)} active={path[0] === 0.4} />
        </Row>
      </Card>

      <Card title="One step of gradient descent">
        <Formula>θ ← θ − η ∇L(θ)</Formula>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={st.k}>θ (the weight)</Text>
          <Text style={st.v}>{fmt(theta, 3)}</Text>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={st.k}>L(θ) (the loss)</Text>
          <Text style={st.v}>{fmt(L(theta), 3)}</Text>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={st.k}>∇L(θ) (the slope here)</Text>
          <Text style={[st.v, { color: dL(theta) > 0 ? C.neg : C.pos }]}>{fmt(dL(theta), 3)}</Text>
        </Row>
        {lastStep && (
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={st.k}>last step −η·g</Text>
            <Text style={[st.v, { color: C.warn }]}>−{fmt(lr)} × {fmt(lastStep.g, 3)} = {fmt(lastStep.dt, 3)}</Text>
          </Row>
        )}
        <LabeledSlider label="learning rate η" value={lr} min={0.01} max={1.2} step={0.01} onChange={setLr} color={C.warn} />
        <Row>
          <Chip label={noise ? 'SGD noise: on' : 'SGD noise: off'} active={noise} color={C.accent2} onPress={() => setNoise(!noise)} />
        </Row>
        <Small>The sign of the slope tells you the direction of increase, so you move against it. Positive slope: step left. Negative slope: step right. Either way you head downhill, and because this holds in every dimension independently the same rule works for one weight or a hundred billion.</Small>
      </Card>

      <Card title="The loss curve">
        <LossChart losses={losses} />
        <P style={{ color: rising ? C.neg : stuck ? C.warn : C.text }}>{diag}</P>
        <Small>Flat for hundreds of iterations: η too small. Skyrocketing: η too large. In between there is a regime where steps overshoot but shrink, and the model converges anyway. The **learning rate** is the most consequential knob in training and the first suspect when training fails.</Small>
      </Card>

      <Card title="Local minima and stochastic gradients">
        <P dim>Gradient descent stops wherever the slope is zero, and that marks any minimum, local or global. Start on the right with a small learning rate and the ball settles in the shallow dip. Turn on SGD noise: a mini-batch gradient is a rough estimate of the true one, and that jostling is one of the reasons local minima matter less in practice than in theory. Momentum does the same job by carrying velocity from previous steps.</P>
        <P dim>The gradient itself comes from **backpropagation**: the **chain rule** applied layer by layer from the loss backwards, with intermediate results stored and reused. In PyTorch it is one line, loss.backward().</P>
      </Card>
    </Screen>
  );
}

function Landscape({ theta, path, lr, g }: { theta: number; path: number[]; lr: number; g: number }) {
  const W = 340, H = 220, pad = 24;
  const X = (t: number) => pad + ((t - TMIN) / (TMAX - TMIN)) * (W - 2 * pad);
  const Y = (l: number) => H - pad - (clamp(l, 0, 4.2) / 4.2) * (H - 2 * pad);
  const pts = Array.from({ length: 121 }, (_, i) => TMIN + (i * (TMAX - TMIN)) / 120);
  const d = pts.map((t, i) => `${i ? 'L' : 'M'} ${X(t)} ${Y(L(t))}`).join(' ');
  const slope = dL(theta);
  const tx = 0.6;
  const y0 = L(theta);
  const arrowT = clamp(theta - lr * g, TMIN, TMAX);
  return (
    <Svg width={W} height={H} style={{ alignSelf: 'center' }}>
      <Line x1={pad} y1={Y(0)} x2={W - pad} y2={Y(0)} stroke={C.border} />
      <Path d={d} stroke={C.accent} strokeWidth={2.5} fill="none" />
      <Polyline points={path.slice(-30).map((t) => `${X(t)},${Y(L(t))}`).join(' ')} stroke={C.warn} strokeWidth={1} fill="none" strokeOpacity={0.6} />
      {path.slice(-30).map((t, i) => (
        <Circle key={i} cx={X(t)} cy={Y(L(t))} r={2} fill={C.warn} fillOpacity={0.5} />
      ))}
      <Line x1={X(theta - tx)} y1={Y(y0 - slope * tx)} x2={X(theta + tx)} y2={Y(y0 + slope * tx)} stroke={C.neg} strokeWidth={1.5} strokeDasharray="4,3" />
      <Line x1={X(theta)} y1={Y(y0)} x2={X(arrowT)} y2={Y(y0)} stroke={C.pos} strokeWidth={3} />
      <Circle cx={X(theta)} cy={Y(y0)} r={8} fill={C.warn} stroke={C.bg} strokeWidth={2} />
      <SvgText x={X(-2.2)} y={Y(L(-2.2)) + 16} fill={C.dim} fontSize={9} textAnchor="middle" fontFamily={mono}>global min</SvgText>
      <SvgText x={X(2.2)} y={Y(L(2.2)) + 16} fill={C.dim} fontSize={9} textAnchor="middle" fontFamily={mono}>local min</SvgText>
      <SvgText x={W - pad} y={H - 6} fill={C.dim} fontSize={9} textAnchor="end" fontFamily={mono}>θ (weight) →</SvgText>
      <SvgText x={pad + 2} y={pad - 6} fill={C.dim} fontSize={9} fontFamily={mono}>loss L(θ) ↑</SvgText>
      <SvgText x={X(theta) + 10} y={Y(y0) - 10} fill={C.neg} fontSize={9} fontFamily={mono}>slope {fmt(slope)}</SvgText>
    </Svg>
  );
}

function LossChart({ losses }: { losses: number[] }) {
  const W = 320, H = 100, pad = 20;
  const n = Math.max(2, losses.length);
  const maxL = Math.max(1, ...losses);
  const X = (i: number) => pad + (i / (n - 1)) * (W - 2 * pad);
  const Y = (l: number) => H - pad + 6 - (l / maxL) * (H - 2 * pad);
  const pts = losses.map((l, i) => `${X(i)},${Y(l)}`).join(' ');
  return (
    <Svg width={W} height={H} style={{ alignSelf: 'center' }}>
      <Line x1={pad} y1={Y(0)} x2={W - pad} y2={Y(0)} stroke={C.border} />
      <Polyline points={pts} stroke={C.warn} strokeWidth={2} fill="none" />
      <SvgText x={W - pad} y={H - 2} fill={C.dim} fontSize={9} textAnchor="end" fontFamily={mono}>step →  ({losses.length - 1} taken)</SvgText>
      <SvgText x={pad} y={12} fill={C.dim} fontSize={9} fontFamily={mono}>loss {fmt(losses[losses.length - 1])}</SvgText>
    </Svg>
  );
}

const st = StyleSheet.create({
  k: { color: C.text, fontFamily: mono, fontSize: 13 },
  v: { color: C.text, fontFamily: mono, fontSize: 13 },
});
