import tls from 'node:tls';

export function isEmailConfigured(): boolean {
  return Boolean(
    (process.env.SMTP_USER && process.env.SMTP_PASS) ||
      process.env.RESEND_API_KEY
  );
}

function encodeSubjectUtf8(subject: string): string {
  return `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;
}

async function sendViaSmtpTls(options: {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromName: string;
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      {
        host: options.host,
        port: options.port,
        servername: options.host,
        rejectUnauthorized: true,
      },
      () => {
        // TLS el sıkışması tamamlandı, sunucunun 220 karşılama mesajı bekleniyor
      }
    );

    socket.setTimeout(12000);
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('SMTP sunucusu zaman aşımına uğradı.'));
    });
    socket.on('error', (err) => {
      reject(err);
    });

    let buffer = '';
    let step = 0;

    const sendCommand = (cmd: string) => {
      socket.write(`${cmd}\r\n`);
    };

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split('\r\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line) continue;
        // Çok satırlı yanıtların (örn. 250-...) son satırını (250 ...) bekle
        if (line.length >= 4 && line[3] === '-') {
          continue;
        }

        const code = parseInt(line.slice(0, 3), 10);
        if (code >= 400) {
          socket.end();
          reject(new Error(`SMTP Hatası (${code}): ${line}`));
          return;
        }

        if (step === 0 && code === 220) {
          step = 1;
          sendCommand('EHLO localhost');
        } else if (step === 1 && code === 250) {
          step = 2;
          sendCommand('AUTH LOGIN');
        } else if (step === 2 && code === 334) {
          step = 3;
          sendCommand(Buffer.from(options.user, 'utf8').toString('base64'));
        } else if (step === 3 && code === 334) {
          step = 4;
          // Google Uygulama Şifresindeki boşlukları otomatik temizle
          const cleanPass = options.pass.replace(/\s+/g, '');
          sendCommand(Buffer.from(cleanPass, 'utf8').toString('base64'));
        } else if (step === 4 && code === 235) {
          step = 5;
          sendCommand(`MAIL FROM:<${options.user}>`);
        } else if (step === 5 && code === 250) {
          step = 6;
          sendCommand(`RCPT TO:<${options.to}>`);
        } else if (step === 6 && code === 250) {
          step = 7;
          sendCommand('DATA');
        } else if (step === 7 && code === 354) {
          step = 8;
          const base64Html =
            Buffer.from(options.html, 'utf8')
              .toString('base64')
              .match(/.{1,76}/g)
              ?.join('\r\n') || '';

          const encodedFromName = encodeSubjectUtf8(options.fromName);
          const encodedSubject = encodeSubjectUtf8(options.subject);

          const message = [
            `From: ${encodedFromName} <${options.user}>`,
            `To: <${options.to}>`,
            `Subject: ${encodedSubject}`,
            `Date: ${new Date().toUTCString()}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
            '',
            base64Html,
            '.',
          ].join('\r\n');

          sendCommand(message);
        } else if (step === 8 && code === 250) {
          step = 9;
          sendCommand('QUIT');
          socket.end();
          resolve();
        }
      }
    });
  });
}

export async function sendPasswordResetEmail(input: {
  to: string;
  displayName: string;
  username: string;
  code: string;
  siteName: string;
}): Promise<{ sent: boolean; error?: string }> {
  const subject = `${input.siteName} — Şifre Sıfırlama Doğrulama Kodunuz: ${input.code}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; background-color: #0b0f19; color: #f8fafc; border-radius: 20px; padding: 32px; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; padding: 6px 14px; border-radius: 999px; background-color: rgba(99, 102, 241, 0.15); color: #818cf8; font-size: 12px; font-weight: 700;">
          ${input.siteName} Güvenlik Merkezi
        </span>
        <h2 style="margin: 12px 0 4px; font-size: 22px; color: #ffffff;">Şifre Sıfırlama Talebi</h2>
      </div>
      <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
        Merhaba <strong>${input.displayName}</strong> (<code>@${input.username}</code>),
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
        Hesabınızın şifresini sıfırlamak için aşağıdaki 6 haneli doğrulama kodunu kullanabilirsiniz:
      </p>
      <div style="margin: 24px 0; padding: 20px; border-radius: 16px; background-color: #111827; border: 1px solid #3730a3; text-align: center;">
        <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #10b981;">
          ${input.code}
        </span>
      </div>
      <p style="font-size: 12px; line-height: 1.5; color: #94a3b8;">
        • Bu doğrulama kodu güvenliğiniz için <strong>15 dakika</strong> boyunca geçerlidir.<br/>
        • Eğer bu talebi siz oluşturmadıysanız bu e-postayı dikkate almayınız; hesabınız güvendedir.
      </p>
    </div>
  `;

  try {
    if (process.env.RESEND_API_KEY) {
      const fromAddress =
        process.env.SMTP_FROM || 'onboarding@resend.dev';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${input.siteName} <${fromAddress}>`,
          to: [input.to],
          subject,
          html,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        return { sent: false, error: `Resend hatası: ${errText}` };
      }
      return { sent: true };
    }

    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();
    const smtpHost = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT || 465);

    if (!smtpUser || !smtpPass) {
      return { sent: false, error: 'SMTP_USER veya SMTP_PASS tanımlı değil.' };
    }

    await sendViaSmtpTls({
      host: smtpHost,
      port: smtpPort,
      user: smtpUser,
      pass: smtpPass,
      fromName: input.siteName,
      to: input.to,
      subject,
      html,
    });

    return { sent: true };
  } catch (err) {
    console.error('Send password reset email error:', err);
    return {
      sent: false,
      error: err instanceof Error ? err.message : 'E-posta gönderilemedi.',
    };
  }
}
