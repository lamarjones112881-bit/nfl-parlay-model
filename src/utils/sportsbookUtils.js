// ── Sportsbook Utilities ────────────────────────────────────────────────────
function bookWeight(bookName) {
  const profile = BOOK_PROFILES[bookName];
  return profile?.weight || 1.0;
}

// ── True market price (Score-weighted consensus) ───────────────────────
function calcTrueMarketPrice(books) {
  if (!books?.length) return null;
  let weightedSum = 0, totalWeight = 0;
  books.forEach(b => {
    const spread = parseFloat(b.spread || 0);
    const w = bookWeight(b.book);
    if (!isNaN(spread)) { weightedSum += spread * w; totalWeight += w; }
  });
  if (!totalWeight) return null;
  return parseFloat((weightedSum / totalWeight).toFixed(2));
}

// ── Sharp-line gap detector ────────────────────────────────────────────────
function detectSharpLineGaps(books, lines) {
  if (!books?.length) return [];
  // Find sharpest available book as reference
  const sharpRef = books.find(b => BOOK_PROFILES[b.book]?.type === "sharp")
    || books.reduce((best, b) => (bookWeight(b.book) > bookWeight(best.book) ? b : best), books[0]);

  if (!sharpRef?.spread) return [];
  const refSpread = parseFloat(sharpRef.spread);
  const gaps = [];

  books.forEach(b => {
    if (b.book === sharpRef.book) return;
    const spread = parseFloat(b.spread || 0);
    if (isNaN(spread)) return;
    const gap = Math.abs(refSpread - spread);
    if (gap < 0.4) return;

    const severity = gap >= 2.0 ? "EXPLOIT" : gap >= 1.5 ? "STRONG" : gap >= 1.0 ? "OPPORTUNITY" : "WATCH";
    const color = severity === "EXPLOIT" ? "#ef4444" : severity === "STRONG" ? "#f87171" : severity === "OPPORTUNITY" ? "#f59e0b" : "#888";

    // Which side to bet: if soft book has bigger number, bet the favorite there
    const betSide = spread > refSpread
      ? `Bet ${lines?.favTeam ? abb(lines.favTeam) : "FAV"} at ${b.book} (${b.book} has +${gap.toFixed(1)} pts)`
      : `Bet dog at ${b.book} (${gap.toFixed(1)} pt gift vs sharp line)`;

    gaps.push({
      sharpBook: sharpRef.book, sharpSpread: refSpread,
      softBook: b.book, softSpread: spread,
      gap: parseFloat(gap.toFixed(1)),
      severity, color, betSide,
      valueNote: `${b.book} hasn't adjusted to ${sharpRef.book}'s line — ${gap.toFixed(1)} pts of free value`,
    });
  });

  return gaps.sort((a, b) => b.gap - a.gap);
}

// ── Middle opportunity detector ────────────────────────────────────────────
function detectMiddles(books, lines) {
  if (!books?.length || books.length < 2) return [];
  const middles = [];
  for (let i = 0; i < books.length; i++) {
    for (let j = i + 1; j < books.length; j++) {
      const a = books[i], b = books[j];
      const sA = parseFloat(a.spread || 0), sB = parseFloat(b.spread || 0);
      if (isNaN(sA) || isNaN(sB)) continue;
      const window = Math.abs(sA - sB);
      if (window < 0.5) continue;

      // A middle exists when one book has FAV -X and other has FAV -(X-N)
      // Bet FAV at better number and DOG at other — win if margin lands in window
      const higherSpread = Math.max(sA, sB);
      const lowerSpread  = Math.min(sA, sB);
      const bookHigher   = sA > sB ? a.book : b.book;
      const bookLower    = sA > sB ? b.book : a.book;

      // Estimate middle hit probability (rough: NFL margins are near-uniform)
      // Each point of window ≈ 5-7% chance of hitting for common spreads
      const hitPct = Math.min(Math.round(window * 6), 45);
      // Worst-case: lose both sides (standard juice) = -10%
      // Best-case: hit middle = +200%+
      const ev = hitPct * 2.0 - (100 - hitPct) * 0.1;

      middles.push({
        bookA: bookHigher, spreadA: higherSpread,
        bookB: bookLower,  spreadB: lowerSpread,
        window: parseFloat(window.toFixed(1)),
        hitPct, ev: parseFloat(ev.toFixed(1)),
        instruction: `Bet ${lines?.favTeam ? abb(lines.favTeam) : "FAV"} ${higherSpread} at ${bookLower} AND ${lines?.favTeam ? abb(lines.favTeam) : "FAV"} ${lowerSpread} at ${bookHigher}`,
        winCondition: `Win if ${lines?.favTeam ? abb(lines.favTeam) : "FAV"} wins by ${lowerSpread + 0.5}–${higherSpread - 0.5} pts`,
        worstCase: `Both sides lose (score outside window) — lose ~10 cents per $1 wagered`,
        isKeyNumber: [3,7,4,6,10,14].some(kn => lowerSpread <= kn && kn <= higherSpread),
      });
    }
  }
  return middles.sort((a, b) => b.hitPct - a.hitPct);
}

// ─────────────────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────

// ── Sportsbook Profile Panel ──────────────────────────────────────────────
function SportsbookProfilePanel({ ensemble, lines }) {

export { bookWeight, calcTrueMarketPrice, detectSharpLineGaps, detectMiddles };
