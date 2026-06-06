//boot only 
// boot.js
async function bootstrap() {
  await globalThis.Adapter.pocketbase.init();

  const schemaRun = await CW.run({
    operation: 'select',
    target_doctype: 'Schema',
    query: { filter: 'doctype = "Schema"' }
  });
  CW.Schema = {};
  for (const s of schemaRun.target?.data || []) {
    CW.Schema[s.schema_name] = s;
  }

  CW._compileSchemas();
  if (typeof authRestore === "function") authRestore();
  if (typeof appBoot    === "function") appBoot();
}

bootstrap().catch(console.error);