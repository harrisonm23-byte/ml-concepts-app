import React, { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Svg, { Line, Polygon, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { Btn, Card, Formula, LabeledSlider, Row, Screen, Small } from '../components/ui';
import { C, S, mono, serif, themed } from '../theme';
import { fmt, mulberry32 } from '../math';

// Four entries for the governance essay. Each is a small, exact model of one claim in the text.

// ---------- Increasing returns (Lens 2: information technology) ----------

export function ReturnsScreen() {
  const [F, setF] = useState(100); // fixed cost to train, in millions
  const [c, setC] = useState(0.5); // marginal cost per user, in dollars
  const [logN, setLogN] = useState(4); // users, log10
  const n = Math.pow(10, logN);
  const avg = (F * 1e6) / n + c;
  const W = 320, H = 170, L = 44, B = 24;
  const xs = Array.from({ length: 61 }, (_, i) => 2 + (i * 6) / 60); // log10 users from 100 to 1e8
  const ac = (lg: number) => (F * 1e6) / Math.pow(10, lg) + c;
  const yMax = ac(3);
  const px = (lg: number) => L + ((lg - 2) / 6) * (W - L - 8);
  const py = (v: number) => H - B - (Math.log10(v + 1) / Math.log10(yMax + 1)) * (H - B - 10);
  return (
    <Screen intro="An **information technology** improves the production, transmission, or use of information, and information has a low marginal cost relative to its fixed cost. In ML terms, training a model costs orders of magnitude more than serving one more user. Spread the fixed cost over the users and watch the average cost fall without limit: the arithmetic behind concentrated markets and winner-take-most labour markets.">
      <Card title="Average cost per user">
        <Formula>AC(n) = F / n + c  =  ${fmt(avg, avg < 10 ? 2 : 0)}</Formula>
        <Svg width={W} height={H} style={{ alignSelf: 'center' }}>
          <Line x1={L} y1={H - B} x2={W - 8} y2={H - B} stroke={C.border} />
          <Line x1={L} y1={10} x2={L} y2={H - B} stroke={C.border} />
          <Polyline points={xs.map((lg) => `${px(lg)},${py(ac(lg))}`).join(' ')} fill="none" stroke={C.forest} strokeWidth={2} />
          <Line x1={L} y1={py(c)} x2={W - 8} y2={py(c)} stroke={C.gold} strokeDasharray="4 3" />
          <Rect x={px(logN) - 4} y={py(avg) - 4} width={8} height={8} fill={C.gold} stroke={C.forest} />
          {[2, 4, 6, 8].map((lg) => (
            <SvgText key={lg} x={px(lg)} y={H - 8} fontSize={10} fill={C.dim} textAnchor="middle" fontFamily={serif}>
              {lg === 2 ? '100' : lg === 4 ? '10k' : lg === 6 ? '1M' : '100M'}
            </SvgText>
          ))}
          <SvgText x={W - 10} y={py(c) - 4} fontSize={10} fill={C.dim} textAnchor="end" fontFamily={serif}>marginal cost c</SvgText>
          <SvgText x={L - 4} y={16} fontSize={10} fill={C.dim} textAnchor="end" fontFamily={serif}>$ / user</SvgText>
        </Svg>
        <LabeledSlider label="fixed cost F (training)" value={F} min={1} max={1000} step={1} onChange={setF} format={(v) => `$${v}M`} />
        <LabeledSlider label="marginal cost c (one more user)" value={c} min={0} max={5} step={0.05} onChange={setC} format={(v) => `$${v.toFixed(2)}`} color={C.gold} />
        <LabeledSlider label="users n" value={logN} min={2} max={8} step={0.05} onChange={setLogN} format={(v) => Math.round(Math.pow(10, v)).toLocaleString()} color={C.accent2} />
        <Small>The curve never turns up: a second firm training its own model pays F again to serve the same users, so the cheapest arrangement is one model, many users. The dashed line is the efficient price, marginal cost, near zero. **Increasing returns** push producer markets toward concentration; **non-rival** information pushes consumer prices toward c. Both claims are in the same formula.</Small>
      </Card>
    </Screen>
  );
}

// ---------- Externalities (Governance and Anarchy) ----------

export function ExternalityScreen() {
  const [e, setE] = useState(3); // external cost per unit
  const [tax, setTax] = useState(0); // Pigouvian tax per unit
  // Marginal benefit MB(q) = 10 − q, private marginal cost MC(q) = q, social marginal cost MC + e.
  const qPriv = (10 - tax) / 2; // where the firm actually produces: MB = MC + τ
  const qSoc = (10 - e) / 2; // where society would like it: MB = MC + e
  const dwl = ((e - tax) * (e - tax)) / 4; // area of the welfare-loss triangle
  const W = 320, H = 190, L = 34, B = 24;
  const px = (q: number) => L + (q / 10) * (W - L - 8);
  const py = (v: number) => H - B - (v / 14) * (H - B - 10);
  const mb = (q: number) => 10 - q;
  const mc = (q: number) => q;
  const tri = [`${px(qSoc)},${py(mb(qSoc))}`, `${px(qPriv)},${py(mb(qPriv))}`, `${px(qPriv)},${py(mc(qPriv) + e)}`].join(' ');
  return (
    <Screen intro="An **externality** is a by-product of one actor's behaviour on others, positive or negative, that the actor does not pay for. The one conceptual tool the essay takes from economics: **institutions** raise welfare by discouraging negative externalities and encouraging positive ones. They exist to internalize externalities. Here is the textbook picture with the numbers live.">
      <Card title="Private cost, social cost">
        <Svg width={W} height={H} style={{ alignSelf: 'center' }}>
          <Line x1={L} y1={H - B} x2={W - 8} y2={H - B} stroke={C.border} />
          <Line x1={L} y1={10} x2={L} y2={H - B} stroke={C.border} />
          {Math.abs(e - tax) > 0.01 && <Polygon points={tri} fill={C.neg} fillOpacity={0.25} />}
          <Line x1={px(0)} y1={py(10)} x2={px(10)} y2={py(0)} stroke={C.text} strokeWidth={1.5} />
          <Line x1={px(0)} y1={py(0)} x2={px(10)} y2={py(10)} stroke={C.forest} strokeWidth={1.5} />
          <Line x1={px(0)} y1={py(e)} x2={px(10 - Math.max(0, e - 4))} y2={py(Math.min(14, 10 + e))} stroke={C.neg} strokeWidth={1.5} strokeDasharray="5 3" />
          {tax > 0 && <Line x1={px(0)} y1={py(tax)} x2={px(10 - Math.max(0, tax - 4))} y2={py(Math.min(14, 10 + tax))} stroke={C.gold} strokeWidth={1.5} />}
          <Line x1={px(qPriv)} y1={py(0)} x2={px(qPriv)} y2={py(mb(qPriv))} stroke={C.dim} strokeDasharray="2 2" />
          <Line x1={px(qSoc)} y1={py(0)} x2={px(qSoc)} y2={py(mb(qSoc))} stroke={C.dim} strokeDasharray="2 2" />
          <SvgText x={px(10) - 2} y={py(0) - 4} fontSize={10} fill={C.text} textAnchor="end" fontFamily={serif}>marginal benefit</SvgText>
          <SvgText x={px(10) - 2} y={py(10) + 12} fontSize={10} fill={C.forest} textAnchor="end" fontFamily={serif}>private cost</SvgText>
          <SvgText x={px(0) + 4} y={py(e) - 4} fontSize={10} fill={C.neg} fontFamily={serif}>+ external cost e</SvgText>
          <SvgText x={px(qPriv)} y={H - 8} fontSize={10} fill={C.dim} textAnchor="middle" fontFamily={serif}>q firm</SvgText>
          <SvgText x={px(qSoc)} y={H - 8} fontSize={10} fill={C.dim} textAnchor={qSoc < qPriv - 1 ? 'middle' : 'end'} fontFamily={serif}>q social</SvgText>
        </Svg>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={st.k}>firm produces</Text>
          <Text style={st.v}>q = {fmt(qPriv, 2)}</Text>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={st.k}>society would choose</Text>
          <Text style={st.v}>q = {fmt(qSoc, 2)}</Text>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={st.k}>welfare lost (shaded)</Text>
          <Text style={[st.v, { color: dwl > 0.01 ? C.neg : C.forest }]}>{fmt(dwl, 2)}</Text>
        </Row>
        <LabeledSlider label="external cost per unit e" value={e} min={0} max={6} step={0.1} onChange={setE} color={C.neg} />
        <LabeledSlider label="tax per unit τ (an institution's lever)" value={tax} min={0} max={6} step={0.1} onChange={setTax} color={C.gold} />
        <Row style={{ gap: S.sm }}>
          <Btn label="Internalize: set τ = e" onPress={() => setTax(e)} />
          <Btn label="No institution" kind="ghost" onPress={() => setTax(0)} />
        </Row>
        <Small>The firm stops where its own marginal cost meets marginal benefit, ignoring e, so it over-produces by exactly the width of the triangle. A tax equal to the external cost makes the private line coincide with the social one and the triangle vanishes: the externality is **internalized**. Overshoot the tax and a new triangle appears on the other side. Whether the lever is a tax, a liability rule, a norm, or a treaty, this triangle is what a governance institution is for. The essay's method is to ask which externality needs internalizing, over what political space, and whether any institution has the remit, competence, and influence to hold the lever.</Small>
      </Card>
    </Screen>
  );
}

// ---------- Algorithmic fairness (deeply politicized issues) ----------

// Standard normal CDF (Abramowitz–Stegun 7.1.26, error < 1.5e-7).
function Phi(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x / 2);
  return x >= 0 ? 0.5 + 0.5 * y : 0.5 - 0.5 * y;
}

// Score model: negatives score ~ N(0,1), positives ~ N(d,1); predict positive when score > t.
function rates(p: number, d: number, t: number) {
  const tpr = 1 - Phi(t - d);
  const fpr = 1 - Phi(t);
  const fnr = Phi(t - d);
  const ppv = (p * tpr) / (p * tpr + (1 - p) * fpr);
  return { tpr, fpr, fnr, ppv };
}

export function FairnessScreen() {
  const [pA, setPA] = useState(0.3);
  const [pB, setPB] = useState(0.5);
  const [d, setD] = useState(1.2);
  const [tA, setTA] = useState(0.8);
  const [tB, setTB] = useState(0.8);
  const A = rates(pA, d, tA);
  const B = rates(pB, d, tB);
  const equalizePPV = () => {
    // PPV rises with the threshold, so bisect for the t that matches group A's calibration.
    let lo = -3, hi = 6;
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2;
      if (rates(pB, d, mid).ppv < A.ppv) lo = mid; else hi = mid;
    }
    setTB((lo + hi) / 2);
  };
  const same = (x: number, y: number) => Math.abs(x - y) < 0.005;
  const cell = (x: number, y: number) => [st.v, { color: same(x, y) ? C.forest : C.neg }];
  return (
    <Screen intro="ProPublica reported that a widely used recidivism classifier had a higher false-positive rate for Black defendants than for white defendants. Later work showed that if any demographic difference in false positives, false negatives, or **calibration** counts as bias, then for an imperfect classifier facing different **base rates**, bias is mathematically unavoidable. This is that theorem with sliders. The classifier is identical for both groups; only the base rate differs.">
      <Card title="Three fairness quantities, two groups">
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={st.k}></Text>
          <Text style={st.hdr}>group A</Text>
          <Text style={st.hdr}>group B</Text>
        </Row>
        {([
          ['base rate p', pA, pB],
          ['false-positive rate', A.fpr, B.fpr],
          ['false-negative rate', A.fnr, B.fnr],
          ['calibration (PPV)', A.ppv, B.ppv],
        ] as [string, number, number][]).map(([k, x, y]) => (
          <Row key={k} style={{ justifyContent: 'space-between' }}>
            <Text style={st.k}>{k}</Text>
            <Text style={k === 'base rate p' ? st.v : cell(x, y)}>{fmt(x, 3)}</Text>
            <Text style={k === 'base rate p' ? st.v : cell(x, y)}>{fmt(y, 3)}</Text>
          </Row>
        ))}
        <Small>Green where the two groups match, red where they differ. **False-positive rate**: share of people who would not reoffend that the tool flags. **False-negative rate**: share who would reoffend that it clears. **Calibration** here is the positive predictive value: of those flagged, the share who actually reoffend.</Small>
      </Card>

      <Card title="The classifier and the thresholds">
        <LabeledSlider label="base rate, group A" value={pA} min={0.05} max={0.8} step={0.01} onChange={setPA} />
        <LabeledSlider label="base rate, group B" value={pB} min={0.05} max={0.8} step={0.01} onChange={setPB} color={C.accent2} />
        <LabeledSlider label="classifier quality d (separation of scores)" value={d} min={0.3} max={3} step={0.05} onChange={setD} color={C.gold} />
        <LabeledSlider label="threshold, group A" value={tA} min={-1} max={3} step={0.05} onChange={setTA} />
        <LabeledSlider label="threshold, group B" value={tB} min={-1} max={3} step={0.05} onChange={setTB} color={C.accent2} />
        <Row wrap style={{ gap: S.sm }}>
          <Btn label="Equalize error rates" onPress={() => setTB(tA)} />
          <Btn label="Equalize calibration" kind="ghost" onPress={equalizePPV} />
        </Row>
        <Small>One threshold for both groups equalizes both error rates, because the scores are equally good for both. Then the calibration row turns red unless the base rates match. Equalize calibration instead and the tool must use different thresholds, so the error rates turn red. Push d toward 3 and the classifier approaches perfection, which is the only escape. The identity that forces this:</Small>
        <Formula>FPR = (p / (1 − p)) · ((1 − PPV) / PPV) · (1 − FNR)</Formula>
        <Small>Hold PPV and FNR equal across groups and FPR must scale with p/(1 − p). Fixing the tool means choosing which quantity to prioritize, and that choice is political. The classifier did not create the disagreement; it exposed it.</Small>
      </Card>
    </Screen>
  );
}

// ---------- The AI race (war of attrition as an all-pay auction) ----------

export function RaceScreen() {
  const [V, setV] = useState(1); // prize relative to the status quo, in units where nuclear war = −1
  const [naive, setNaive] = useState(0); // share of players who bid their whole value
  const [honor, setHonor] = useState(0); // intrinsic value of winning, as a share of V
  const [seed, setSeed] = useState(1);
  const N = 3000;
  const sim = useMemo(() => {
    const rnd = mulberry32(seed);
    // Private values v ~ Uniform[0, V]. Equilibrium all-pay bid with an added prize wV: b(v) = ((v + wV)² − (wV)²) / 2V.
    const bid = (v: number) => {
      const w = honor * V;
      return ((v + w) * (v + w) - w * w) / (2 * V);
    };
    const totals: number[] = [];
    let sum = 0;
    for (let i = 0; i < N; i++) {
      let tot = 0;
      for (let k = 0; k < 2; k++) {
        const v = rnd() * V;
        const b = rnd() < naive ? v : bid(v);
        tot += b;
      }
      totals.push(tot);
      sum += tot;
    }
    const bins = new Array(24).fill(0);
    const maxT = Math.max(1.6, V * 1.2);
    totals.forEach((t) => { bins[Math.min(23, Math.floor((t / maxT) * 24))] += 1; });
    return { mean: sum / N, bins, maxT, pWar: Math.min(1, sum / N) };
  }, [V, naive, honor, seed]);
  const W = 320, H = 150, L = 8, B = 22;
  const bw = (W - 2 * L) / 24;
  const bmax = Math.max(...sim.bins);
  return (
    <Screen intro="The **AI race**: great powers believe leadership in AI decides future wealth and power, so investment rises and corners get cut. The one formula of the lecture models it as a **war of attrition**, two players bidding up the risk of conflict until one concedes, which is equivalent to an **all-pay auction** whose revenue is the risk both have accepted. With rational players and common knowledge, the expected bid is one third of the prize. Here that race is run three thousand times.">
      <Card title="Expected risk accepted">
        <Formula>E[bid] = ⅓ · V     simulated: {fmt(sim.mean, 3)}  ({fmt(sim.mean / V, 2)} V)</Formula>
        <Svg width={W} height={H} style={{ alignSelf: 'center' }}>
          {sim.bins.map((b, i) => (
            <Rect key={i} x={L + i * bw + 1} y={H - B - (b / bmax) * (H - B - 12)} width={bw - 2} height={(b / bmax) * (H - B - 12)} fill={C.forest} opacity={0.85} />
          ))}
          <Line x1={L + (V / 3 / sim.maxT) * (W - 2 * L)} y1={8} x2={L + (V / 3 / sim.maxT) * (W - 2 * L)} y2={H - B} stroke={C.gold} strokeWidth={2} />
          <Line x1={L + (1 / sim.maxT) * (W - 2 * L)} y1={8} x2={L + (1 / sim.maxT) * (W - 2 * L)} y2={H - B} stroke={C.neg} strokeWidth={1.5} strokeDasharray="4 3" />
          <SvgText x={L + (V / 3 / sim.maxT) * (W - 2 * L) + 4} y={16} fontSize={10} fill={C.gold} fontFamily={serif}>V/3</SvgText>
          <SvgText x={L + (1 / sim.maxT) * (W - 2 * L) - 4} y={16} fontSize={10} fill={C.neg} textAnchor="end" fontFamily={serif}>nuclear war</SvgText>
          <SvgText x={L} y={H - 6} fontSize={10} fill={C.dim} fontFamily={serif}>0</SvgText>
          <SvgText x={W - L} y={H - 6} fontSize={10} fill={C.dim} textAnchor="end" fontFamily={serif}>risk accepted by the race →</SvgText>
        </Svg>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={st.k}>chance of catastrophe a rational leader accepts</Text>
          <Text style={[st.v, { color: sim.pWar > 0.5 ? C.neg : C.text }]}>{fmt(sim.pWar * 100, 0)}%</Text>
        </Row>
        <LabeledSlider label="value of the prize V (nuclear war = −1, status quo = 0)" value={V} min={0.1} max={1.5} step={0.05} onChange={setV} color={C.gold} />
        <Row style={{ gap: S.sm }}>
          <Btn label="Run again" kind="ghost" onPress={() => setSeed((s) => s + 1)} />
        </Row>
        <Small>Each player draws a private value for winning from zero up to V and bids the equilibrium amount, v²/2V. The bids are paid whether or not the player wins: that is what makes the auction all-pay, and what makes the revenue a risk everyone bears. Set V to one, a prize as far above the status quo as nuclear war is below it, and the race accepts a one-in-three chance of nuclear war. A neighbouring **rent-seeking contest** dissipates half rather than a third. So the glass is half full: a rational, informed race is survivable, but only because the players stop.</Small>
      </Card>

      <Card title="Conceptual check">
        <LabeledSlider label="players who do not know the game (bid their whole value)" value={naive} min={0} max={1} step={0.05} onChange={setNaive} format={(v) => `${Math.round(v * 100)}%`} color={C.neg} />
        <LabeledSlider label="intrinsic value of winning (honour, regime survival), as a share of V" value={honor} min={0} max={1} step={0.05} onChange={setHonor} format={(v) => `${Math.round(v * 100)}%`} color={C.neg} />
        <Small>Every assumption in the model is false in the real world, and each failure makes the race worse. **Common knowledge**: leaders meet this game for the first time. The fastest way to raise a hundred dollars is to auction a ten in an all-pay format, because someone always fails to realize the right move is not to play. A naive player who bids their whole value pushes the mean up from V/3. **Rationality**: leaders place intrinsic value on winning, so backing down costs more than the material stakes; add it to the prize and the equilibrium bid rises. **Observability** and **shared understanding of risk** cannot be fitted with a slider: if risk-taking has no public signal, norms of restraint cannot form, and if each side sees its own conduct as safer than the other's, the spiral has no rational floor. Treat one third as a floor on risk, not a ceiling.</Small>
      </Card>
    </Screen>
  );
}

const st = themed(() => StyleSheet.create({
  k: { color: C.dim, fontFamily: serif, fontSize: 14, flex: 1 },
  v: { color: C.text, fontFamily: mono, fontSize: 13, minWidth: 64, textAlign: 'right' },
  hdr: { color: C.dim, fontFamily: serif, fontSize: 12, minWidth: 64, textAlign: 'right', letterSpacing: 0.5 },
}));
