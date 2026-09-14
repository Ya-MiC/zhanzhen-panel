// scoring.mjs — Skill 3.0 dynamic scoring (Actions side). Mirror of assets/scoring.js.
// Authored factors come from the last governance Run; T drifts with push staleness;
// AVS/GRS/SPI/FinalSPI always recomputed from the formula.

const W = { C: .14, P: .14, L: .14, S: .12, R: .10, M: .10, D: .10, Q: .08, E: .08 };
// v4.0: per-board weight profiles — keep Actions-side rescore in sync with the browser lab
const PROFILES = {
  'Skill 3.0 標準': { C: .14, P: .14, L: .14, S: .12, R: .10, M: .10, D: .10, Q: .08, E: .08 },
  '產品線優先（A 湛箴）': { C: .10, P: .18, L: .12, S: .16, R: .12, M: .14, D: .10, Q: .04, E: .04 },
  '槓桿工具優先（B Agent / D 基建）': { C: .10, P: .14, L: .22, S: .10, R: .08, M: .08, D: .14, Q: .08, E: .06 },
  '學習研究優先（C 量化金融）': { C: .20, P: .12, L: .08, S: .10, R: .06, M: .06, D: .16, Q: .12, E: .10 },
  '基礎設施優先（D 區）': { C: .12, P: .08, L: .12, S: .14, R: .18, M: .06, D: .12, Q: .08, E: .10 },
};
const BOARD_PROFILE = { A: '產品線優先（A 湛箴）', B: '槓桿工具優先（B Agent / D 基建）', C: '學習研究優先（C 量化金融）', D: '基礎設施優先（D 區）' };
function weightsFor(board) {
  const prof = PROFILES[BOARD_PROFILE[board] || 'Skill 3.0 標準'] || W;
  const sum = Object.values(prof).reduce((a, b) => a + b, 0) || 1;
  const out = {}; for (const k in prof) out[k] = prof[k] / sum;
  return out;
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const r2 = (v) => Math.round(v * 100) / 100;

function daysSince(iso) {
  if (!iso) return null;
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  return isFinite(d) ? d : null;
}

function dynT(baseT, pushedAt) {
  const d = daysSince(pushedAt);
  if (d === null) return baseT;
  let t = baseT;
  if (d > 14) t += 0.5;
  if (d > 90) t += 1;
  if (d > 180) t += 1;
  if (d > 365) t += 2;
  if (d <= 7) t -= 1;
  return clamp(t, 0, 10);
}

export function computeScores(r) {
  const s0 = r.scores || {};
  const f = {
    C: s0.C, P: s0.P, L: s0.L, S: s0.S, R: s0.R, M: s0.M, D: s0.D, Q: s0.Q,
    E: s0.E, T: r2(dynT(s0.T, r.pushed_at)), U: s0.U,
  };
  if (Object.values(f).some((v) => typeof v !== 'number')) return { changed: false };
  const w = weightsFor(r.board);
  const AVS = w.C * f.C + w.P * f.P + w.L * f.L + w.S * f.S + w.R * f.R +
    w.M * f.M + w.D * f.D + w.Q * f.Q + w.E * f.E;
  const GRS = .40 * f.T + .35 * f.U + .25 * (10 - f.E);
  const SPI = 10 * AVS - 5 * GRS;
  const F = s0.ForkPenalty || 0;
  const FinalSPI = Math.max(0, SPI - F);
  const scores = { ...f, AVS: r2(AVS), GRS: r2(GRS), SPI: r2(SPI), ForkPenalty: F, FinalSPI: r2(FinalSPI) };
  const changed = Math.abs((s0.FinalSPI || 0) - scores.FinalSPI) >= 0.01 ||
    Math.abs((s0.T || 0) - scores.T) >= 0.01;
  return { changed, scores };
}

export function rescorePortfolio(pf) {
  let changed = 0;
  for (const r of pf.repositories || []) {
    if (!r.scores) continue;
    const res = computeScores(r);
    if (res.changed) {
      res.scores.baseline = r.scores.FinalSPI;
      res.scores.scored_at = new Date().toISOString().slice(0, 10);
      r.scores = res.scores;
      changed++;
    }
  }
  if (changed) pf.scored_at = new Date().toISOString().slice(0, 16) + 'Z';
  return changed;
}
