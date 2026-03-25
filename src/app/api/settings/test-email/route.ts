import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json() as {
    host?: string;
    port?: string;
    user?: string;
    password?: string;
    from?: string;
    to?: string;
  };
  const { host, port, user, from, to } = body;

  if (!host || !port || !user || !from || !to) {
    return NextResponse.json(
      { success: false, error: "Missing required fields (host, port, user, from, to)" },
      { status: 400 }
    );
  }

  // TODO: Actually send test email with nodemailer
  return NextResponse.json({
    success: true,
    message: "SMTP configuration looks valid. (Email sending not yet connected)",
  });
}
