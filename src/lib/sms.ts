// Sends order alert SMS via Twilio. Uses fetch directly against Twilio's REST API
// rather than the twilio npm package, to avoid an extra dependency for one call.
// Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER in .env.
// If not configured, or if the recipient phone isn't set in Site Settings, this
// silently no-ops — SMS is optional, never blocks order creation.

export async function sendOrderSms(toPhone: string | null | undefined, message: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!toPhone) {
    console.log("[SMS] Skipped — no admin notification phone set in Site Settings.");
    return;
  }
  if (!sid || !token || !from) {
    console.log("[SMS] Skipped — TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER not configured.");
    console.log(`[SMS] Would have sent to ${toPhone}: ${message}`);
    return;
  }

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: toPhone, From: from, Body: message }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("[SMS] Twilio error:", errText);
    }
  } catch (err) {
    console.error("[SMS] Failed to send:", err);
  }
}
