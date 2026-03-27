import { getSyncService, notifySyncComplete } from "../../../../../packages/sync";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await getSyncService().push();
  if (result.success) {
    notifySyncComplete("push", `${result.counts?.projects ?? 0} 项目, ${result.counts?.issues ?? 0} issues`);
  }
  return Response.json(result);
}
