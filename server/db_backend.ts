import { DenoKvPrimitives } from "../plugos/lib/deno_kv_primitives.ts";
import { KvPrimitives } from "../plugos/lib/kv_primitives.ts";
import { MemoryKvPrimitives } from "../plugos/lib/memory_kv_primitives.ts";
import { path } from "./deps.ts";

/**
 * Environment variables:
 * - SB_DB_BACKEND: "denokv" or "memory" (default: denokv)
 * - SB_KV_DB (denokv only): path to the database file (default .silverbullet.db)
 */

export async function determineDatabaseBackend(
  singleTenantFolder?: string,
): Promise<KvPrimitives> {
  const backendConfig = Deno.env.get("SB_DB_BACKEND") || "denokv";
  switch (backendConfig) {
    case "denokv": {
      let dbFile: string | undefined = Deno.env.get("SB_KV_DB") ||
        ".silverbullet.db";

      if (singleTenantFolder) {
        // If we're running in single tenant mode, we may as well use the tenant's space folder to keep the database
        dbFile = path.resolve(singleTenantFolder, dbFile);
      }

      if (Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined) { // We're running in Deno Deploy
        dbFile = undefined; // Deno Deploy will use the default KV store
      }
      const denoDb = await Deno.openKv(dbFile);
      console.info(
        `Using DenoKV as a database backend (${dbFile || "cloud"}.`,
      );
      return new DenoKvPrimitives(denoDb);
    }
    default:
      console.info(
        "Running in in-memory database mode: index data will be flushed on every restart. Not recommended, but to each their own.",
      );
      return new MemoryKvPrimitives();
  }
}
