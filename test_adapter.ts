import { GFGAdapter } from "./src/lib/coding-platforms/adapters/gfg";

async function test() {
  const adapter = new GFGAdapter();
  try {
    const res = await adapter.fetchProfile("pbmnaidu");
    console.log("GFGAdapter Result:", JSON.stringify(res, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
