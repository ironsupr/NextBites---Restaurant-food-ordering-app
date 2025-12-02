import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
from app.core.config import settings


async def send_email(to_email: str, subject: str, html_content: str):
    """Send an email using SMTP."""
    message = MIMEMultipart("alternative")
    message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    message["To"] = to_email
    message["Subject"] = subject
    
    html_part = MIMEText(html_content, "html")
    message.attach(html_part)
    
    try:
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=True,
        )
    except Exception as e:
        print(f"Failed to send email to {to_email}: {str(e)}")
        # Don't raise exception to avoid blocking user creation


async def send_new_user_credentials_email(email: str, password: str, role: str):
    """Send credentials to newly created user."""
    template = Template("""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                background-color: #f4f4f4;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: white;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
                color: #FF6B35;
                margin-bottom: 20px;
            }
            .credentials {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .credential-item {
                margin: 10px 0;
            }
            .label {
                font-weight: bold;
                color: #333;
            }
            .value {
                color: #666;
                font-family: 'Courier New', monospace;
                background-color: #e9ecef;
                padding: 5px 10px;
                border-radius: 3px;
                display: inline-block;
            }
            .warning {
                color: #dc3545;
                font-size: 14px;
                margin-top: 20px;
                padding: 10px;
                background-color: #fff3cd;
                border-radius: 5px;
            }
            .footer {
                margin-top: 30px;
                text-align: center;
                color: #999;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Welcome to NextBite! 🍔</h1>
            <p>Hello,</p>
            <p>An account has been created for you on NextBite. Here are your login credentials:</p>
            
            <div class="credentials">
                <div class="credential-item">
                    <span class="label">Email:</span>
                    <span class="value">{{ email }}</span>
                </div>
                <div class="credential-item">
                    <span class="label">Password:</span>
                    <span class="value">{{ password }}</span>
                </div>
                <div class="credential-item">
                    <span class="label">Role:</span>
                    <span class="value">{{ role }}</span>
                </div>
            </div>
            
            <div class="warning">
                ⚠️ <strong>Important:</strong> Please change your password after your first login for security reasons.
            </div>
            
            <p>You can now log in to NextBite and start ordering delicious food!</p>
            
            <div class="footer">
                <p>This is an automated email from NextBite. Please do not reply to this message.</p>
            </div>
        </div>
    </body>
    </html>
    """)
    
    html_content = template.render(
        email=email,
        password=password,
        role=role.replace("_", " ").title()
    )
    
    await send_email(
        to_email=email,
        subject="Welcome to NextBite - Your Login Credentials",
        html_content=html_content
    )
