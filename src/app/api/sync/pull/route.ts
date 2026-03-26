import { getSyncService } from "../../../../../packages/sync";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await getSyncService().pull();
  return Response.json(result);
}
