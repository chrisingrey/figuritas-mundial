import type { IncludeNode } from "./IncludeNode";
import type { IThenIncludeBuilder } from "./IThenIncludeBuilder";

export interface IIncludeBuilder<T> {
  Include<TRelated>(
    selector: (entity: T) => TRelated,
  ): IThenIncludeBuilder<T, TRelated>;
  readonly nodes: IncludeNode[];
}
