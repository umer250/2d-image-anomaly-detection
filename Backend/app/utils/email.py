import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings

def send_email(
    email_to: str,
    subject: str,
    html_content: str,
) -> None:
    """
    Generic function to send email via SMTP.
    """
    print(f"DEBUG: Attempting to send email to {email_to} via {settings.SMTP_HOST}:{settings.SMTP_PORT}")
    print(f"DEBUG: SMTP_TLS={settings.SMTP_TLS}, SMTP_SSL={settings.SMTP_SSL}")
    print(f"DEBUG: SMTP_USER={settings.SMTP_USER}")

    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"DEBUG: SMTP not configured. Would have sent email to {email_to} with subject: {subject}")
        return

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL or settings.SMTP_USER}>"
    message["To"] = email_to

    part = MIMEText(html_content, "html")
    message.attach(part)

    try:
        if settings.SMTP_SSL:
            print("DEBUG: Using SMTP_SSL connection")
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_USER, email_to, message.as_string())
        else:
            print("DEBUG: Using standard SMTP connection")
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                if settings.SMTP_TLS:
                    print("DEBUG: Starting TLS")
                    server.starttls()
                print("DEBUG: Attempting login")
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                print("DEBUG: Sending mail")
                server.sendmail(settings.SMTP_USER, email_to, message.as_string())
        print(f"DEBUG: Email successfully dispatched to {email_to}")
    except Exception as e:
        print(f"CRITICAL ERROR: Failed to send email: {str(e)}")
        # Re-raise to let the caller know it failed
        raise e

def send_reset_password_email(email_to: str, email: str, token: str) -> None:
    """
    Send password reset email with a 6-digit verification code (OTP).
    """
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Verification Code: {token}"
    
    html_content = f"""
    <html>
        <body style="font-family: sans-serif; background-color: #000; color: #fff; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: #111; padding: 30px; border-radius: 10px; border: 1px solid #333; text-align: center;">
                <h2 style="color: #fff;">Verification Code</h2>
                <p style="color: #ccc;">We received a request to reset the password for your account: <br><strong>{email}</strong></p>
                <p style="color: #ccc;">Use the following 6-digit code to verify your identity. This code will expire in 5 minutes.</p>
                
                <div style="margin: 30px 0; padding: 20px; background: #000; border: 2px dashed #333; display: inline-block;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 12px; color: #fff;">{token}</span>
                </div>
                
                <p style="color: #666; font-size: 12px; margin-top: 30px;">If you didn't request this, you can safely ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;">
                <p style="color: #888; font-size: 10px;">{project_name} Monitoring Platform</p>
            </div>
        </body>
    </html>
    """
    
    send_email(
        email_to=email_to,
        subject=subject,
        html_content=html_content,
    )

