import Dexie, { Table } from "dexie";

export type PublishedAction = {
  message: string;
  details: string;
  ts: string;
  amount: number;
  signature: string;
  address: string;
};

export class MySubClassedDexie extends Dexie {
  publishedActions!: Table<PublishedAction>;

  constructor() {
    super("bestlendDB");
    this.version(1).stores({
      publishedActions: "++signature, address",
    });
  }
}

export const db = new MySubClassedDexie();
