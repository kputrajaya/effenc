export const SHEET_URL = `https://opensheet.elk.sh/1jVwBONNQYHBehcw_LbfVzaKOkbGqd6CJighwQvpdKBk`;
export const LEVEL_XP = {
  1: 7,
  2: 16,
  3: 27,
  4: 40,
  5: 55,
  6: 72,
  7: 91,
  8: 112,
  9: 135,
  10: 160,
  11: 187,
  12: 216,
  13: 247,
  14: 280,
  15: 315,
  16: 352,
  17: 394,
  18: 441,
  19: 493,
  20: 550,
  // 21: 612,
  // 22: 679,
  // 23: 751,
  // 24: 828,
  // 25: 910,
  // 26: 997,
  // 27: 1089,
  // 28: 1186,
  // 29: 1288,
  // 30: 1395,
};
export const PENALTY_LEVEL = {
  0: 0,
  1: 1,
  2: 3,
  3: 7,
  4: 15,
  5: 31,
};

export const fetcher = (url) => fetch(url).then((res) => res.json());

export const formatEnc = (enc) =>
  enc.max === '1' ? enc.name : `${enc.name} ${{ 2: 'II', 3: 'III', 4: 'IV', 5: 'V' }[enc.max]}`;

export function calculateSteps(encs) {
  if (!encs) return null;

  const merge = (a, b) => {
    if (b.isEqu || (!a.isEqu && b.cost > a.cost)) {
      [a, b] = [b, a];
    }
    if (Math.abs(a.penalty - b.penalty) > (a.isEqu ? 2 : 1)) return null;
    const levelCost = b.cost + PENALTY_LEVEL[a.penalty] + PENALTY_LEVEL[b.penalty];
    const xpCost = LEVEL_XP[levelCost];
    if (isNaN(xpCost)) return null;

    const item = {
      isEqu: a.isEqu,
      encs: [...a.encs, ...b.encs],
      cost: a.cost + b.cost,
      penalty: Math.max(a.penalty, b.penalty) + 1,
    };
    return { a, b, item, levelCost, xpCost };
  };
  const recurse = (items, steps = [], levelCost = 0, xpCost = 0) => {
    if (items.length === 2) {
      const curMerge = items[0].isEqu ? merge(items[0], items[1]) : merge(items[1], items[0]);
      if (!curMerge) return null;
      return {
        steps: [...steps, { a: curMerge.a, b: curMerge.b, levelCost: curMerge.levelCost, xpCost: curMerge.xpCost }],
        levelCost: levelCost + curMerge.levelCost,
        xpCost: xpCost + curMerge.xpCost,
      };
    }

    let bestPath = null;
    items.forEach((a, aIdx) => {
      for (let bIdx = aIdx + 1; bIdx < items.length; bIdx++) {
        const b = items[bIdx];
        const curMerge = merge(a, b);
        if (!curMerge) continue;
        const curPath = recurse(
          [...items.filter((c, cIdx) => cIdx !== aIdx && cIdx !== bIdx), curMerge.item],
          [...steps, { a: curMerge.a, b: curMerge.b, levelCost: curMerge.levelCost, xpCost: curMerge.xpCost }],
          levelCost + curMerge.levelCost,
          xpCost + curMerge.xpCost
        );
        if (!curPath) continue;
        if (
          !bestPath ||
          curPath.levelCost < bestPath.levelCost ||
          (curPath.levelCost === bestPath.levelCost && curPath.xpCost < bestPath.xpCost)
        ) {
          bestPath = curPath;
        }
      }
    });
    return bestPath;
  };

  const initialItems = [
    {
      isEqu: true,
      encs: [],
      cost: 0,
      penalty: 0,
    },
    ...encs.map((enc) => ({
      isEqu: false,
      encs: [formatEnc(enc)],
      cost: enc.max * enc.cost,
      penalty: 0,
    })),
  ];
  return recurse(initialItems);
}
