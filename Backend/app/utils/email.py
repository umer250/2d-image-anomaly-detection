import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


def send_email(email_to: str, subject: str, html_content: str) -> None:
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"[email] SMTP not configured — OTP for {email_to}: {subject}")
        return

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL or settings.SMTP_USER}>"
    message["To"] = email_to
    message.attach(MIMEText(html_content, "html"))

    try:
        if settings.SMTP_SSL:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_USER, email_to, message.as_string())
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                if settings.SMTP_TLS:
                    server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_USER, email_to, message.as_string())
        print(f"[email] Sent to {email_to}")
    except Exception as e:
        print(f"[email] FAILED to send to {email_to}: {e}")
        raise


def send_reset_password_email(email_to: str, email: str, token: str) -> None:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} — Your Verification Code: {token}"

    html_content = f"""
    <html>
    <body style="font-family: 'Segoe UI', sans-serif; background:#000; color:#fff; padding:20px; margin:0;">
      <div style="max-width:520px; margin:auto; background:#111; padding:40px 32px; border-radius:12px; border:1px solid #222;">
        <div style="text-align:center; margin-bottom:28px;">
          <h2 style="color:#fff; font-size:22px; margin:0 0 8px;">Verification Code</h2>
          <p style="color:#888; font-size:14px; margin:0;">2D Image Anomaly Detection Platform</p>
        </div>
        <p style="color:#ccc; font-size:14px; line-height:1.6;">
          We received a request to reset the password for your account:<br>
          <strong style="color:#fff;">{email}</strong>
        </p>
        <p style="color:#ccc; font-size:14px;">Use the code below to verify your identity. It expires in <strong style="color:#fff;">5 minutes</strong>.</p>
        <div style="text-align:center; margin:32px 0; padding:24px; background:#000; border:2px dashed #333; border-radius:8px;">
          <span style="font-size:36px; font-weight:900; letter-spacing:14px; color:#fff; font-family:monospace;">{token}</span>
        </div>
        <p style="color:#555; font-size:12px; text-align:center;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border:0; border-top:1px solid #222; margin:24px 0;">
        <p style="color:#444; font-size:11px; text-align:center;">{project_name}</p>
      </div>
    </body>
    </html>
    """
    send_email(email_to=email_to, subject=subject, html_content=html_content)
