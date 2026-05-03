import { Collection, ObjectId } from "mongodb";
import type { IRepository, Predicate, IncludeConfigurator, IncludeNode } from "../models";
import { resolveIncludes } from "../models";
import { AppError, ErrorCode } from "@errors";

/**
 * Generic MongoDB repository.
 *
 * T must have an `id: string` field — this maps to MongoDB's `_id` (ObjectId)
 * so documents stay plain JSON throughout the rest of the app.
 *
 * Include support:
 *   Pass a `relatedCollections` map to enable eager loading of related documents.
 *   Each include key must match a key in the map and a field naming convention:
 *   the related collection documents must have a `{singular(key)}Id` field pointing
 *   to the parent entity id.
 *
 *   Example:
 *     new Repository<Album>(db.collection("albums"), {
 *       members: db.collection("members"),
 *     })
 *
 *   Usage:
 *     repo.getAsync(h => h.id === id, c => c.Include(h => h.members))
 */
export class Repository<T extends { id: string }>
  implements IRepository<T>
{
  constructor(
    protected readonly collection: Collection,
    private readonly relatedCollections: Record<string, Collection> = {},
  ) {}

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private toEntity(doc: Record<string, unknown>): T {
    const { _id, ...rest } = doc;
    return { id: (_id as ObjectId).toHexString(), ...rest } as T;
  }

  private toObjectId(id: string) {
    return { _id: new ObjectId(id) };
  }

  private async applyIncludes(entity: T, nodes: IncludeNode[]): Promise<T> {
    const record = entity as unknown as Record<string, unknown>;

    for (const node of nodes) {
      const relatedCollection = this.relatedCollections[node.key];
      if (!relatedCollection) continue;

      // Many-to-one: entity has a {key}Id field pointing to the related entity's id.
      // e.g. member.albumId → albums collection
      const manyToOneFk = `${node.key}Id`;
      if (record[manyToOneFk] !== undefined) {
        const relatedId = record[manyToOneFk] as string;
        const doc = await relatedCollection.findOne({ _id: new ObjectId(relatedId) });
        if (doc) {
          const { _id, ...rest } = doc as Record<string, unknown>;
          let related: Record<string, unknown> = { id: (_id as ObjectId).toHexString(), ...rest };
          if (node.children.length) {
            related = await this.applyIncludes(related as unknown as T, node.children) as unknown as Record<string, unknown>;
          }
          record[node.key] = related;
        }
      } else {
        // One-to-many: related entities have a {singular(key)}Id field pointing to entity.id.
        // e.g. album → members collection where member.albumId === album.id
        const oneToManyFk = `${node.key.replace(/s$/, "")}Id`;
        const relatedDocs: Record<string, unknown>[] = [];
        for await (const doc of relatedCollection.find({ [oneToManyFk]: entity.id })) {
          relatedDocs.push(doc as Record<string, unknown>);
        }
        const related: Record<string, unknown>[] = relatedDocs.map(doc => {
          const { _id, ...rest } = doc;
          return { id: (_id as ObjectId).toHexString(), ...rest };
        });
        if (node.children.length) {
          for (let i = 0; i < related.length; i++) {
            related[i] = await this.applyIncludes(related[i] as unknown as T, node.children) as unknown as Record<string, unknown>;
          }
        }
        record[node.key] = related;
      }
    }
    return entity;
  }

  // ---------------------------------------------------------------------------
  // IRepository
  // ---------------------------------------------------------------------------

  async existsAsync(predicate: Predicate<T>): Promise<boolean> {
    for await (const doc of this.collection.find()) {
      const entity = this.toEntity(doc as Record<string, unknown>);
      if (predicate(entity)) return true;
    }
    return false;
  }

  async getAsync(predicate: Predicate<T>, ...includes: IncludeConfigurator<T>[]): Promise<T> {
    const nodes = resolveIncludes(includes);
    for await (const doc of this.collection.find()) {
      const entity = this.toEntity(doc as Record<string, unknown>);
      if (predicate(entity)) {
        return nodes.length ? this.applyIncludes(entity, nodes) : entity;
      }
    }
    throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, "No entity matching the given predicate was found.");
  }

  async getOrDefaultAsync(predicate: Predicate<T>, ...includes: IncludeConfigurator<T>[]): Promise<T | null> {
    const nodes = resolveIncludes(includes);
    for await (const doc of this.collection.find()) {
      const entity = this.toEntity(doc as Record<string, unknown>);
      if (predicate(entity)) {
        return nodes.length ? this.applyIncludes(entity, nodes) : entity;
      }
    }
    return null;
  }

  async getAllAsync(predicate: Predicate<T>, ...includes: IncludeConfigurator<T>[]): Promise<T[]> {
    const nodes = resolveIncludes(includes);
    const results: T[] = [];
    for await (const doc of this.collection.find()) {
      const entity = this.toEntity(doc as Record<string, unknown>);
      if (predicate(entity)) {
        results.push(nodes.length ? await this.applyIncludes(entity, nodes) : entity);
      }
    }
    return results;
  }

  async createAndSaveAsync(entity: T): Promise<T> {
    const { id: _id, ...fields } = entity as Record<string, unknown>;
    const result = await this.collection.insertOne(fields);
    return { ...entity, id: result.insertedId.toHexString() };
  }

  createAsync(entity: T): T {
    return { ...entity };
  }

  async updateByIdAndSaveAsync(id: string, entity: T): Promise<T> {
    const { id: _id, ...fields } = entity as Record<string, unknown>;
    const result = await this.collection.replaceOne(this.toObjectId(id), fields);
    if (result.matchedCount === 0) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, `Entity with id '${id}' was not found.`);
    }
    return { ...entity, id };
  }

  updateByIdAsync(id: string, entity: T): T {
    return { ...entity, id };
  }

  async patchByIdAndSaveAsync(id: string, entity: Partial<Omit<T, "id">>): Promise<T> {
    const result = await this.collection.updateOne(this.toObjectId(id), { $set: entity });
    if (result.matchedCount === 0) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, `Entity with id '${id}' was not found.`);
    }
    const updated = await this.collection.findOne(this.toObjectId(id));
    if (!updated) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, `Entity with id '${id}' was not found.`);
    }
    return this.toEntity(updated as Record<string, unknown>);
  }

  patchByIdAsync(id: string, current: T, entity: Partial<Omit<T, "id">>): T {
    return { ...current, ...entity, id };
  }

  async deleteByIdAsync(id: string): Promise<void> {
    const result = await this.collection.deleteOne(this.toObjectId(id));
    if (result.deletedCount === 0) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, `Entity with id '${id}' was not found.`);
    }
  }
}
