// Reference computation for receipts rule v1 (rule sha256 f79b227ab7c99b4566e3ccfce944b77cac1085e56facc36736abd419505b824f).
// Input: the rows array from /api/v1/receipts/rows for one agent and day.
export function computeReceipts(rows) {
  const keys = new Set(), human = new Set(), viewed = new Set();
  let opens = 0;
  for (const r of rows) {
    opens += r.opens;
    keys.add(r.client_key);
    if (r.tier === 'human') {
      human.add(r.client_key);
      if (r.target === 'october' && r.viewed) viewed.add(r.client_key);
    }
  }
  return { delivered_opens: opens, delivered_clients: keys.size, received_open: human.size, received_viewed: viewed.size };
}
