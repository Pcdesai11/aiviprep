import type { Drill } from "../types";
import { applyTransfers } from "./applyTransfers";
import { cartCheckout } from "./cartCheckout";
import { encodeRuns } from "./encodeRuns";
import { groupAnagrams } from "./groupAnagrams";
import { searchInsert } from "./searchInsert";
import { uniqueInOrder } from "./uniqueInOrder";

export const drills: Drill[] = [
  searchInsert,
  uniqueInOrder,
  applyTransfers,
  groupAnagrams,
  encodeRuns,
  cartCheckout,
];

export function getDrill(id: string): Drill {
  const drill = drills.find((item) => item.id === id);
  if (!drill) throw new Error(`Unknown drill: ${id}`);
  return drill;
}
