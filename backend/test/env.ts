process.env.AUTH_SECRET ??= "test-auth-secret-at-least-32-characters!!";
process.env.HANDOFF_SECRET ??= "test-handoff-secret-at-least-32-chars!";
// Do not default HANDOFF_STORE=memory — with DATABASE_URL, config selects postgres
// so CI exercises the Postgres handoff path. Explicit HANDOFF_STORE still wins.
process.env.NODE_ENV ??= "test";
process.env.SKIP_AUTH = "false";
