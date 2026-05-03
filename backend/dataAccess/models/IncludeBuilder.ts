import type { IIncludeBuilder } from "./IIncludeBuilder";
import type { IThenIncludeBuilder } from "./IThenIncludeBuilder";
import type { IncludeNode } from "./IncludeNode";
import type { IncludeConfigurator } from "./IncludeConfigurator";

// ─── Key extractor ───────────────────────────────────────────────────────────

function extractKey<T, R>(selector: (obj: T) => R): string {
  const src = selector.toString();
  // Handles: o => o.key  |  (o) => o.key  |  (o) => { return o.key; }
  const match = src.match(/(?:=>|return)\s*\w+\.(\w+)/);
  if (!match) {
    throw new Error(`Cannot extract property key from selector: ${src}`);
  }
  return match[1];
}

// ─── ThenIncludeBuilder ──────────────────────────────────────────────────────

class ThenIncludeBuilder<TRoot, TRelated>
  implements IThenIncludeBuilder<TRoot, TRelated>
{
  constructor(public readonly node: IncludeNode) {}

  ThenInclude<TNext>(
    selector: (related: TRelated) => TNext,
  ): IThenIncludeBuilder<TRoot, TNext> {
    const key = extractKey(selector);
    const child: IncludeNode = { key, children: [] };
    this.node.children.push(child);
    return new ThenIncludeBuilder<TRoot, TNext>(child);
  }
}

// ─── IncludeBuilder ──────────────────────────────────────────────────────────

class IncludeBuilder<T> implements IIncludeBuilder<T> {
  readonly nodes: IncludeNode[] = [];

  Include<TRelated>(
    selector: (entity: T) => TRelated,
  ): IThenIncludeBuilder<T, TRelated> {
    const key = extractKey(selector);
    const node: IncludeNode = { key, children: [] };
    this.nodes.push(node);
    return new ThenIncludeBuilder<T, TRelated>(node);
  }
}

// ─── resolveIncludes ─────────────────────────────────────────────────────────

export function resolveIncludes<T>(
  configurators: IncludeConfigurator<T>[],
): IncludeNode[] {
  const builder = new IncludeBuilder<T>();
  for (const cfg of configurators) {
    cfg(builder);
  }
  return builder.nodes;
}
