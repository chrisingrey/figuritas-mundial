import type { IncludeNode } from "./IncludeNode";

export interface IThenIncludeBuilder<TRoot, TRelated> {
  ThenInclude<TNext>(
    selector: (related: TRelated) => TNext,
  ): IThenIncludeBuilder<TRoot, TNext>;
  readonly node: IncludeNode;
}
