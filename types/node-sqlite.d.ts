declare module "node:sqlite" {
  interface StatementResultingChanges {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  interface StatementSync {
    run(...params: unknown[]): StatementResultingChanges;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
    expandedSQL?: string;
    sourceSQL?: string;
  }

  class DatabaseSync {
    constructor(
      location: string,
      options?: { open?: boolean; readOnly?: boolean; allowExtension?: boolean }
    );
    open(): void;
    close(): void;
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    createSession(options?: { table?: string; db?: string }): Session;
    applyChangeset(changeset: Uint8Array, options?: object): boolean;
    readonly open: boolean;
    readonly inTransaction: boolean;
  }

  interface Session {
    changeset(): Uint8Array;
    patchset(): Uint8Array;
    close(): void;
  }

  export { DatabaseSync };
}
