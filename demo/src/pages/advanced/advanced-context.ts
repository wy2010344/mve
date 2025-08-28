import { createContext } from "mve-core";
import { StoreRef, GetValue } from "wy-helper";

interface DataItem {
  id: number;
  name: string;
  value: number;
  category: string;
  status: "active" | "inactive";
  timestamp: Date;
}

const advancedContext = createContext<{
  dataItems: StoreRef<DataItem[]>;
  filterCategory: StoreRef<string>;
  sortBy: StoreRef<"name" | "value" | "timestamp">;
  sortOrder: StoreRef<"asc" | "desc">;
  performanceMetrics: StoreRef<any>;
  filteredAndSortedItems: GetValue<DataItem[]>;
  dataStatistics: GetValue<any>;
  generateTestData: () => void;
  clearData: () => void;
  performStressTest: () => void;
}>(undefined!)

export default advancedContext