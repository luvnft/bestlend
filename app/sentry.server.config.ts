// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://71fadd69af3f86ab14439fd9bdd2353e@o981824.ingest.us.sentry.io/4507013845286912",
  tracesSampleRate: 1,
  debug: false,
});
