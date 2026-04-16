"""
Quick SMTP test — run from Backend/ directory:
  python test_email.py your@email.com
"""
import sys
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "umerm8809@gmail.com"
SMTP_PASSWORD = "srpr ghmu jhip ohve"   # App password (no quotes)
TO_EMAIL = sys.argv[1] if len(sys.argv) > 1 else SMTP_USER

print(f"Testing SMTP: {SMTP_HOST}:{SMTP_PORT}")
print(f"From: {SMTP_USER}  →  To: {TO_EMAIL}")

msg = MIMEMultipart("alternative")
msg["Subject"] = "AnomalyDetect — SMTP Test"
msg["From"] = f"AnomalyDetect <{SMTP_USER}>"
msg["To"] = TO_EMAIL
msg.attach(MIMEText("<h2>SMTP is working ✅</h2><p>OTP emails will be delivered.</p>", "html"))

try:
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, TO_EMAIL, msg.as_string())
    print("✅  Email sent successfully!")
except Exception as e:
    print(f"❌  Failed: {e}")
