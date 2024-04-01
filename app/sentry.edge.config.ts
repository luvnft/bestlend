// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://71fadd69af3f86ab14439fd9bdd2353e@o981824.ingest.us.sentry.io/4507013845286912",
  tracesSampleRate: 0,
  debug: false,
});
