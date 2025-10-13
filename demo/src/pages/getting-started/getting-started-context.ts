import { createContext } from 'mve-core';
import { StoreRef } from 'wy-helper';

const gettingStartedContext = createContext<{
  name: StoreRef<string>;
  count: StoreRef<number>;
  trackingLog: StoreRef<string[]>;
}>(undefined!);

export default gettingStartedContext;
