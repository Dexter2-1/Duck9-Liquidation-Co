import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

// Always returns a generic success message, whether or not the email exists —
// this prevents leaking which admin emails are registered to anyone probing the form.
export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const genericResponse = NextResponse.json({
    ok: true,
    message: "If that email is registered, a reset link has been sent.",
  });

  if (!email) return genericResponse;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return genericResponse; // don't reveal whether the account exists

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  try {
    await sendEmail(
      user.email,
      "Reset your Dock9 admin password",
      `<p>Hi ${user.name},</p>
       <p>Someone requested a password reset for your Dock9 admin account. Click below to set a new password — this link expires in 1 hour:</p>
       <p><a href="${resetUrl}">${resetUrl}</a></p>
       <p>If you didn't request this, you can safely ignore this email — your password won't change unless you click the link and set a new one.</p>`
    );
  } catch (err) {
    console.error("Password reset email failed:", err);
  }

  return genericResponse;
}
