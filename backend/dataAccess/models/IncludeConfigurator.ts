import type { IIncludeBuilder } from "./IIncludeBuilder";

export type IncludeConfigurator<T> = (builder: IIncludeBuilder<T>) => void;
