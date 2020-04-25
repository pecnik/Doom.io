import { AnyComponents } from "./Components";

export type Entity<T = AnyComponents> = { readonly id: string } & T &
    AnyComponents;
