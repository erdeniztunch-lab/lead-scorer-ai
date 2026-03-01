import { json, type ApiRequest, type ApiResponse } from "./_lib/http";
import { withApiHandler } from "./_lib/handler";

const handler = withApiHandler(
  {
    allowedMethods: ["GET"],
  },
  async (_req: ApiRequest, res: ApiResponse, context) => {
    json(res, 200, {
      ok: true,
      service: "leadspark-api",
      now: new Date().toISOString(),
      environment: process.env.NODE_ENV ?? "development",
      requestId: context.requestId,
    });
  },
);

export default handler;
