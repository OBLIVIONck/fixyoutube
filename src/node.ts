import { serve } from "@hono/node-server";
import app from "./index";

const port = Number(process.env.PORT || 8787);

serve(
  {
    fetch: (request) => app.fetch(request, {}),
    port,
    hostname: "0.0.0.0",
  },
  (info) => {
    console.log(`FixYouTube listening on http://${info.address}:${info.port}`);
  }
);
