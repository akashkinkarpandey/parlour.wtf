// Minimal ambient shim for the `cloudflare:workers` module specifier, just
// enough to type the `DurableObject` base class our Durable Objects extend.
// Avoids pulling in the full @cloudflare/workers-types package (which
// globally redeclares Request/Response/etc. and can conflict with DOM lib
// types) for what is otherwise a very small, loosely-typed codebase.
declare module 'cloudflare:workers' {
  export class DurableObject<Env = unknown> {
    protected ctx: unknown;
    protected env: Env;
    constructor(ctx: unknown, env: Env);
  }
}
