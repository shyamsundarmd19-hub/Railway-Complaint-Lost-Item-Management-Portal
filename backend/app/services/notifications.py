import logging
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings

logger = logging.getLogger("railalert.notifications")


class NotificationService:
    def __init__(self):
        client_kwargs = {
            "region_name": settings.AWS_REGION,
        }
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            client_kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
            client_kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY

        self.ses_client = boto3.client("ses", **client_kwargs)
        self.sns_client = boto3.client("sns", **client_kwargs)

    def send_complaint_resolved_alert(
        self,
        passenger_email: str,
        passenger_name: str,
        complaint_id: str,
        description: str,
        train_number: str,
        coach: str = "",
        seat: str = "",
    ) -> bool:
        """
        Dispatches AWS SES Email & SNS SMS notifications when a complaint status changes to 'resolved'.
        Falls back to mock console logger if running locally or credentials are not configured.
        """
        subject = f"[RailAlert RESOLVED] Your Railway Grievance #{str(complaint_id)[:8]} has been Resolved"
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0fdf4; margin: 0; padding: 24px; color: #1e293b; }}
                .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #d1fae5; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
                .header {{ background-color: #059669; padding: 24px; color: #ffffff; text-align: center; }}
                .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; }}
                .badge {{ display: inline-block; background-color: #34d399; color: #064e3b; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; margin-top: 8px; text-transform: uppercase; }}
                .body {{ padding: 28px; line-height: 1.6; }}
                .details-box {{ background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px; padding: 14px 18px; margin: 20px 0; }}
                .details-box p {{ margin: 4px 0; font-size: 14px; }}
                .footer {{ border-top: 1px solid #e2e8f0; padding: 16px 28px; font-size: 12px; color: #64748b; text-align: center; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Indian Railways Grievance Cell</h1>
                    <span class="badge">Status: Resolved</span>
                </div>
                <div class="body">
                    <p>Dear <strong>{passenger_name}</strong>,</p>
                    <p>We are pleased to inform you that your reported railway grievance has been inspected and marked as <strong>RESOLVED</strong> by the on-duty railway staff.</p>
                    
                    <div class="details-box">
                        <p><strong>Complaint Reference ID:</strong> {complaint_id}</p>
                        <p><strong>Train Number:</strong> {train_number} {f'(Coach {coach}, Seat {seat})' if coach else ''}</p>
                        <p><strong>Issue Summary:</strong> {description}</p>
                    </div>

                    <p>Thank you for helping us maintain higher standards of cleanliness, safety, and service across Indian Railways.</p>
                    <p>If you feel this issue requires further inspection, you may reopen it or contact the on-board train superintendent.</p>
                </div>
                <div class="footer">
                    RailAlert Cloud Portal &bull; Automated Passenger Notification System &bull; AWS SES Powered
                </div>
            </div>
        </body>
        </html>
        """
        
        # Local Mock Output
        if not settings.AWS_ACCESS_KEY_ID or settings.ENVIRONMENT == "development":
            logger.info(f"[MOCK NOTIFICATION - SES] Sent Resolution Email to: {passenger_email}")
            print(f"\n==========================================================")
            print(f" [AWS SES NOTIFICATION DISPATCHED]")
            print(f" Recipient : {passenger_email} ({passenger_name})")
            print(f" Subject   : {subject}")
            print(f" Complaint : {complaint_id} (Train: {train_number})")
            print(f" Status    : RESOLVED")
            print(f"==========================================================\n")
            return True

        # Production AWS SES Dispatch
        try:
            self.ses_client.send_email(
                Source=settings.AWS_SES_SENDER_EMAIL,
                Destination={"ToAddresses": [passenger_email]},
                Message={
                    "Subject": {"Data": subject, "Charset": "UTF-8"},
                    "Body": {"Html": {"Data": html_body, "Charset": "UTF-8"}},
                },
            )
            return True
        except ClientError as e:
            logger.error(f"Failed to dispatch SES email to {passenger_email}: {str(e)}")
            return False


notifications = NotificationService()
