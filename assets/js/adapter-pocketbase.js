
// ==== version 40 of adapter-pocketbase.js ====
// adapter-pocketbase.js
// Dev/browser form of adapter-pocketbase.json
// Load BEFORE this file: <script src="https://cdn.jsdelivr.net/npm/pocketbase@latest/dist/pocketbase.umd.js"></script>

globalThis.Adapter = globalThis.Adapter || {};

const _config = {
  url: "http://143.198.29.88:8090/",
  autoCancellation: false,
  defaultCollection: "item"
};

// Initialize PocketBase instance immediately
globalThis.pb = globalThis.pb || new PocketBase(_config.url);
globalThis.pb.autoCancellation(_config.autoCancellation);
console.log("✓ PocketBase initialized:", _config.url);

globalThis.Adapter["pocketbase"] = {
  config: _config,

  init(run_doc) {
    const adapter = run_doc.target.data[0];
    const config = adapter.config;
    globalThis.pb = globalThis.pb || new PocketBase(config.url);
    globalThis.pb.autoCancellation(config.autoCancellation);
    console.log("✓ PocketBase initialized:", config.url);
    return run_doc;
  },

  async select(run_doc) {
    const adapter = run_doc.target.data[0];
    const query = run_doc.query || {};
    const collection = adapter.config.defaultCollection;

    const params = {};
    if (query.filter) params.filter = query.filter;
    if (query.sort) params.sort = query.sort;

    const take = query.take;
    const skip = query.skip;

    let items, metaData;

    if (take !== undefined) {
      const page = skip ? Math.floor(skip / take) + 1 : 1;
      const result = await globalThis.pb.collection(collection).getList(page, take, params);
      items = result.items;
      metaData = {
        total: result.totalItems,
        page: result.page,
        pageSize: result.perPage,
        totalPages: result.totalPages,
        hasMore: result.page < result.totalPages
      };
    } else {
      items = await globalThis.pb.collection(collection).getFullList(params);
      metaData = {
        total: items.length,
        page: 1,
        pageSize: items.length,
        totalPages: 1,
        hasMore: false
      };
    }

    run_doc.output = {
      data: items.map(item => item.data).filter(data => data != null),
      meta: metaData
    };
    run_doc.success = true;
    return run_doc;
  },

  async insert(run_doc) {
    const adapter = run_doc.target.data[0];
    const data = run_doc.input?.data || run_doc.input;
    const collection = adapter.config.defaultCollection;

    const recordId = typeof generateId === "function"
      ? generateId(data.doctype?.toLowerCase() || "record")
      : `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const doctype = data.doctype;
    if (!doctype) throw new Error("CREATE requires doctype");

    const completeData = { id: recordId, name: recordId, doctype, ...data };

    const created = await globalThis.pb.collection(collection).create({
      id: recordId,
      name: recordId,
      doctype,
      data: completeData
    });

    run_doc.output = {
      data: created.data,
      meta: {
        id: created.id,
        name: created.name,
        created: created.created,
        doctype: created.doctype
      }
    };
    run_doc.success = true;
    return run_doc;
  },

  async update(run_doc) {
    const adapter = run_doc.target.data[0];
    const data = run_doc.input?.data || run_doc.input;
    const identifier = run_doc.input?.id || run_doc.input?.name;
    const collection = adapter.config.defaultCollection;

    if (!identifier) throw new Error("UPDATE requires id or name");

    let recordId, recordName, existingRecord;

    const isPocketBaseId = /^[a-z0-9]{15}$/.test(identifier);

    if (isPocketBaseId) {
      recordId = identifier;
      recordName = identifier;
      existingRecord = await globalThis.pb.collection(collection).getOne(recordId);
    } else {
      const records = await globalThis.pb.collection(collection).getFullList({
        filter: `data.name = "${identifier}"`
      });
      if (records.length === 0) throw new Error(`Record not found: ${identifier}`);
      existingRecord = records[0];
      recordId = existingRecord.id;
      recordName = existingRecord.name || existingRecord.id;
    }

    const doctype = data.doctype || existingRecord.doctype;
    if (!doctype) throw new Error("UPDATE requires doctype");

    const completeData = { id: recordId, name: recordName, doctype, ...data };

    const updated = await globalThis.pb.collection(collection).update(recordId, {
      name: recordName,
      doctype,
      data: completeData
    });

    run_doc.output = {
      data: updated.data,
      meta: {
        id: updated.id,
        name: updated.name,
        updated: updated.updated,
        doctype: updated.doctype
      }
    };
    run_doc.success = true;
    return run_doc;
  },

  async delete(run_doc) {
    const adapter = run_doc.target.data[0];
    const identifier = run_doc.input?.id || run_doc.input?.name;
    const collection = adapter.config.defaultCollection;

    if (!identifier) throw new Error("DELETE requires id or name");

    let recordId;

    const isPocketBaseId = /^[a-z0-9]{15}$/.test(identifier);

    if (isPocketBaseId) {
      recordId = identifier;
    } else {
      const records = await globalThis.pb.collection(collection).getFullList({
        filter: `data.name = "${identifier}"`
      });
      if (records.length === 0) throw new Error(`Record not found: ${identifier}`);
      recordId = records[0].id;
    }

    await globalThis.pb.collection(collection).delete(recordId);

    run_doc.output = {
      success: true,
      meta: { id: recordId, deleted: true }
    };
    run_doc.success = true;
    return run_doc;
  }
};

// Also register by doc.name for consistency with _compileDocument
globalThis.Adapter["adapterb7l0z4ur"] = globalThis.Adapter["pocketbase"];

console.log("✓ Adapter registered: pocketbase");