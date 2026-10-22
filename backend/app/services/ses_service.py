import boto3
from botocore.exceptions import ClientError
from app.core.config import settings


class SESAlertService:
    def __init__(self):
        client_kwargs = {
            "region_name": settings.AWS_REGION,
        }
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            client_kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
            client_kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY

        self.ses_client = boto3.client("ses", **client_kwargs)

    def send_complaint_acknowledgment(self, recipient_email: str, ticket_id: str, title: str):
        """Sends email confirmation for registered railway complaint."""
        subject = f"[RailAlert] Complaint Registered: {ticket_id}"
        body_html = f"""
        <html>
        <head></head>
        <body style="font-family: Arial, sans-serif; color: #1e293b; background-color: #f0fdf4; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #d1fae5; padding: 24px;">
                <h2 style="color: #059669; margin-top: 0;">RailAlert Confirmation</h2>
                <p>Dear Passenger,</p>
                <p>Your railway grievance has been registered successfully with Ticket ID: <strong>{ticket_id}</strong>.</p>
                <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 12px; margin: 16px 0;">
                    <p style="margin: 0; font-weight: bold;">Issue: {title}</p>
                </div>
                <p>Railway staff and division controllers have been alerted. You can track real-time resolution on the RailAlert portal.</p>
                <p style="color: #64748b; font-size: 13px;">Indian Railways Dedicated Grievance & Lost Item Portal</p>
            </div>
        </body>
        </html>
        """
        self._dispatch_email(recipient_email, subject, body_html)

    def _dispatch_email(self, recipient: str, subject: str, html_content: str):
        # In dev without AWS credentials, log and gracefully skip
        if not settings.AWS_ACCESS_KEY_ID and settings.ENVIRONMENT == "development":
            print(f"[DEV MOCK SES] To: {recipient} | Subject: {subject}")
            return

        try:
            self.ses_client.send_email(
                Source=settings.AWS_SES_SENDER_EMAIL,
                Destination={"ToAddresses": [recipient]},
                Message={
                    "Subject": {"Data": subject, "Charset": "UTF-8"},
                    "Body": {"Html": {"Data": html_content, "Charset": "UTF-8"}},
                },
            )
        except ClientError as e:
            print(f"[SES WARNING] Failed to send email alert: {str(e)}")


ses_alerts = SESAlertService()
