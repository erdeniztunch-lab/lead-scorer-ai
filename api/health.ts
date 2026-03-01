import { json, type ApiRequest, type ApiResponse } from "./_lib/http.js";
import { withApiHandler } from "./_lib/handler.js";

const handler = withApiHandler(
  {
    allowedMethods: ["GET"],
  },
  async (_req: ApiRequest, res: ApiResponse, context) => {
    json(res, 200, {
      ok: true,
      service: "leadspark-api",
      now: new Date().toISOString(),
      requestId: context.requestId,
    });
  },
);

export default handler;

