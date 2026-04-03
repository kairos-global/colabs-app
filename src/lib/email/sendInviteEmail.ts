import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInviteEmail({
  toEmail,
  inviterName,
  spaceName,
  joinUrl,
}: {
  toEmail: string;
  inviterName: string;
  spaceName: string;
  joinUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const fullJoinUrl = `https://colabsai.com${joinUrl}`;

  try {
    const { error } = await resend.emails.send({
      from: "CoLabs <invites@colabsai.com>",
      to: toEmail,
      subject: `${inviterName} invited you to collaborate on "${spaceName}"`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e4e4e0;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #e4e4e0;">
              <p style="margin:0;font-size:18px;font-weight:700;letter-spacing:-0.02em;color:#0a0a0a;">CoLabs</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#0a0a0a;">
                You're invited to collaborate
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">
                <strong style="color:#0a0a0a;">${inviterName}</strong> has invited you to join
                <strong style="color:#0a0a0a;">${spaceName}</strong> on CoLabs — a shared creative workspace.
              </p>
              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:100px;background:#00cefc;border:1.5px solid #0a0a0a;">
                    <a href="${fullJoinUrl}"
                       style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:700;color:#0a0a0a;text-decoration:none;letter-spacing:-0.01em;">
                      Accept invite →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;color:#a1a1aa;">
                Or paste this link into your browser:<br />
                <a href="${fullJoinUrl}" style="color:#0a0a0a;word-break:break-all;">${fullJoinUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #e4e4e0;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.5;">
                You received this because someone used your email to send a CoLabs invite.
                If you weren't expecting this, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
