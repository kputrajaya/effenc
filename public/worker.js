const LEVEL_XP = {
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

  // Skip expensive operations (speed up)
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
const PENALTY_LEVEL = {
  0: 0,
  1: 1,
  2: 3,
  3: 7,
  4: 15,
  5: 31,
};

const merge = (a, b) => {
  // Ensure equipment is on the left / cheaper book is on the right
  if (b.isEqu || (!a.isEqu && b.cost > a.cost)) {
    [a, b] = [b, a];
  }

  // Skip if penalty gap is too big (speed up)
  if (Math.abs(a.penalty - b.penalty) > (a.isEqu ? 2 : 1)) return null;

  // Calculate cost
  const levelCost = b.cost + PENALTY_LEVEL[a.penalty] + PENALTY_LEVEL[b.penalty];
  const xpCost = LEVEL_XP[levelCost];
  if (isNaN(xpCost)) return null;

  const item = {
    isEqu: a.isEqu,
    encs: [...a.encs, ...b.encs],
    cost: a.cost + b.cost,
    penalty: Math.max(a.penalty, b.penalty) + 1,
  };
  return { item, step: { a, b, levelCost, xpCost } };
};

const recurse = (items, steps = [], levelCost = 0, xpCost = 0) => {
  // Merge the remaining 2
  if (items.length === 2) {
    const curMerge = merge(items[0], items[1]);
    if (!curMerge) return null;
    return {
      steps: [...steps, curMerge.step],
      levelCost: levelCost + curMerge.step.levelCost,
      xpCost: xpCost + curMerge.step.xpCost,
    };
  }

  // Brute force
  let bestPath = null;
  items.forEach((a, aIdx) => {
    for (let bIdx = aIdx + 1; bIdx < items.length; bIdx++) {
      const curMerge = merge(a, items[bIdx]);
      if (!curMerge) continue;
      const curPath = recurse(
        [...items.filter((_, cIdx) => cIdx !== aIdx && cIdx !== bIdx), curMerge.item],
        [...steps, curMerge.step],
        levelCost + curMerge.step.levelCost,
        xpCost + curMerge.step.xpCost
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

const calculateSteps = (encs) => {
  if (!encs) return null;

  const initialItems = [
    {
      isEqu: true,
      encs: [],
      cost: 0,
      penalty: 0,
    },
    ...encs.map((enc) => ({
      isEqu: false,
      encs: [enc.name],
      cost: enc.max * enc.cost,
      penalty: 0,
    })),
  ];
  return recurse(initialItems);
};

onmessage = (e) => {
  const { encs } = e.data;
  const start = performance.now();
  const result = calculateSteps(encs);
  const duration = performance.now() - start;
  postMessage({ result, duration });
};
