/* scoring.js v4.0 — modular Skill 3.x scoring engine (browser side).
 * - Weight PROFILES: different repo states score differently (product line vs
 *   leverage tool vs study vs infrastructure), auto-selected per board.
 * - Human overrides any weight in the 權重實驗室; overrides persist in
 *   localStorage and the whole panel recomputes live.
 * - T drifts with push freshness; AVS/GRS/SPI/FinalSPI always recomputed.
 * Paired implementation: tools/scoring.mjs (Actions side uses standard profile).
 */
(function (global) {
  const PROFILES = {
    'Skill 3.0 標準': { C: .14, P: .14, L: .14, S: .12, R: .10, M: .10, D: .10, Q: .08, E: .08 },
    '產品線優先（A 湛箴）': { C: .10, P: .18, L: .12, S: .16, R: .12, M: .14, D: .10, Q: .04, E: .04 },
    '槓桿工具優先（B Agent / D 基建）': { C: .10, P: .14, L: .22, S: .10, R: .08, M: .08, D: .14, Q: .08, E: .06 },
    '學習研究優先（C 量化金融）': { C: .20, P: .12, L: .08, S: .10, R: .06, M: .06, D: .16, Q: .12, E: .10 },
    '基礎設施優先（D 區）': { C: .12, P: .08, L: .12, S: .14, R: .18, M: .06, D: .12, Q: .08, E: .10 },
  };
  const RISK_DEFAULT = { T: .40, U: .35 };
  const BOARD_PROFILE = { A: '產品線優先（A 湛箴）', B: '槓桿工具優先（B Agent / D 基建）', C: '學習研究優先（C 量化金融）', D: '基礎設施優先（D 區）' };

  const store = {
    profile: 'Skill 3.0 標準',
    custom: null,
    tryLoad() {
      try {
        const raw = localStorage.getItem('yaMicWeights');
        if (raw) { const d = JSON.parse(raw); this.profile = d.profile || this.profile; this.custom = d.custom || null; }
      } catch (e) { /* storage unavailable */ }
    },
    save() {
      try { localStorage.setItem('yaMicWeights', JSON.stringify({ profile: this.profile, custom: this.custom })); } catch (e) {}
    },
  };

  function weightsFor(board) {
    let base = { ...(PROFILES[BOARD_PROFILE[board] || store.profile] || PROFILES['Skill 3.0 標準']) };
    if (store.custom) {
      for (const k of ['C', 'P', 'L', 'S', 'R', 'M', 'D', 'Q', 'E']) {
        if (typeof store.custom[k] === 'number') base[k] = store.custom[k];
      }
    }
    const sum = Object.values(base).reduce((a, b) => a + b, 0) || 1;
    for (const k of Object.keys(base)) base[k] = base[k] / sum;
    const risk = (store.custom && typeof store.custom.T === 'number')
      ? { T: store.custom.T, U: store.custom.U } : { ...RISK_DEFAULT };
    return { avs: base, risk };
  }

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const r2 = (v) => Math.round(v * 100) / 100;
  const daysSince = (iso) => {
    if (!iso) return null;
    const d = (Date.now() - new Date(iso).getTime()) / 86400000;
    return isFinite(d) ? d : null;
  };
  function dynT(baseT, pushedAt) {
    const d = daysSince(pushedAt);
    if (d === null) return baseT;
    let t = baseT;
    if (d > 14) t += .5;
    if (d > 90) t += 1;
    if (d > 180) t += 1;
    if (d > 365) t += 2;
    if (d <= 7) t -= 1;
    return clamp(t, 0, 10);
  }

  function compute(r, board) {
    const s0 = r.scores || {};
    const { avs: w, risk } = weightsFor(board || r.board);
    const f = { C: s0.C, P: s0.P, L: s0.L, S: s0.S, R: s0.R, M: s0.M, D: s0.D, Q: s0.Q, E: s0.E,
      T: r2(dynT(s0.T, r.pushed_at)), U: s0.U };
    if (Object.values(f).some(v => typeof v !== 'number')) return { scores: s0, delta: 0, dyn: false };
    const AVS = Object.keys(w).reduce((a, k) => a + w[k] * f[k], 0);
    const GRS = risk.T * f.T + risk.U * f.U + .25 * (10 - f.E);
    const SPI = 10 * AVS - 5 * GRS;
    const F = s0.ForkPenalty || 0;
    const FinalSPI = Math.max(0, SPI - F);
    const norm = (o) => { const c = {}; for (const k in o) c[k] = r2(o[k]); return c; };
    return {
      scores: { ...f, AVS: r2(AVS), GRS: r2(GRS), SPI: r2(SPI), ForkPenalty: F, FinalSPI: r2(FinalSPI),
        baseline: (typeof s0.baseline === 'number' ? s0.baseline : s0.FinalSPI),
        scored_at: new Date().toISOString().slice(0, 10) },
      delta: r2(FinalSPI - (s0.FinalSPI || 0)), dyn: true,
      weights: { avs: norm(w), risk: norm(risk) },
    };
  }

  function applyAll(list) {
    let moved = 0;
    for (const r of list) {
      if (!r.scores) continue;
      const before = r.scores.FinalSPI;
      const res = compute(r, r.board);
      if (!res.dyn) continue;
      r.scores = res.scores;
      r.delta = r2(res.scores.FinalSPI - before);
      if (Math.abs(r.delta) >= .5) moved++;
    }
    return moved;
  }

  function setProfile(name) { if (PROFILES[name]) { store.profile = name; store.custom = null; store.save(); } }
  function setCustom(w) { store.custom = w; store.save(); }
  function reset() { store.profile = 'Skill 3.0 標準'; store.custom = null; store.save(); }
  function state() { return { profile: store.profile, custom: store.custom, profiles: Object.keys(PROFILES) }; }

  store.tryLoad();
  global.Scoring = { compute, applyAll, setProfile, setCustom, reset, state, PROFILES, RISK_DEFAULT };
})(window);
