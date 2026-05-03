import type { Predicate } from "./Predicate";
import type { IncludeConfigurator } from "./IncludeConfigurator";

export interface IRepository<T extends { id: string }> {
  /** Returns true if any document satisfies the predicate. */
  existsAsync(predicate: Predicate<T>): Promise<boolean>;

  /** Returns the first document satisfying the predicate and eagerly loads any specified includes. Throws if not found. */
  getAsync(
    predicate: Predicate<T>,
    ...includes: IncludeConfigurator<T>[]
  ): Promise<T>;

  /** Returns the first document satisfying the predicate and eagerly loads any specified includes, or null when not found. */
  getOrDefaultAsync(
    predicate: Predicate<T>,
    ...includes: IncludeConfigurator<T>[]
  ): Promise<T | null>;

  /** Returns all documents satisfying the predicate and eagerly loads any specified includes. */
  getAllAsync(
    predicate: Predicate<T>,
    ...includes: IncludeConfigurator<T>[]
  ): Promise<T[]>;

  /** Inserts the entity and persists immediately. */
  createAndSaveAsync(entity: T): Promise<T>;

  /** Builds the entity in memory without persisting it. */
  createAsync(entity: T): T;

  /** Replaces all fields of the document with the given id and persists immediately. Throws if not found. */
  updateByIdAndSaveAsync(id: string, entity: T): Promise<T>;

  /** Applies the full replacement in memory without persisting it. */
  updateByIdAsync(id: string, entity: T): T;

  /** Patches only the provided fields for the document with the given id and persists immediately. Throws if not found. */
  patchByIdAndSaveAsync(id: string, entity: Partial<Omit<T, "id">>): Promise<T>;

  /** Applies a partial patch in memory without persisting it. */
  patchByIdAsync(id: string, current: T, entity: Partial<Omit<T, "id">>): T;

  /** Deletes the document with the given id and persists immediately. Throws if not found. */
  deleteByIdAsync(id: string): Promise<void>;
}
