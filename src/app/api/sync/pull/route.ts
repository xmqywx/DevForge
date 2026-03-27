import { getSyncService, notifySyncComplete } from "../../../../../packages/sync";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await getSyncService().pull();
  if (result.counts && (result.counts.feedback > 0 || result.counts.comments > 0)) {
    notifySyncComplete("pull", `${result.counts.feedback} 反馈, ${result.counts.comments} 评论`);
  }
  return Response.json(result);
}
