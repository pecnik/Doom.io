import { AnyComponents } from "./Components";

export type Entity<T = AnyComponents> = { id: string } & T & AnyComponents;
