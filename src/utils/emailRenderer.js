class EmailRenderer {
  render(templateName, data = {}) {
    try {
      if (templateName === "order") {
        return this.getOrderTemplate(data);
      } else if (templateName === "verification") {
        return this.getVerificationTemplate(data);
      }
      return this.getFallbackTemplate(data.otp);
    } catch (error) {
      console.error("Error rendering email template:", error);
      return this.getFallbackTemplate(data.otp);
    }
  }

  getOrderTemplate(data) {
    const { userName, order, trackingLink } = data;
    return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Order Confirmation</title>
        <style>
          body { margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: #2563eb; color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 40px; }
          .order-id-box { background: #f8fafc; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .tracking-id { font-size: 28px; font-weight: bold; color: #2563eb; letter-spacing: 2px; margin: 10px 0; }
          .message-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 4px; }
          .info-box { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0; }
          .info-row { display: flex; margin: 10px 0; }
          .info-label { width: 140px; color: #64748b; font-weight: 500; }
          .info-value { flex: 1; color: #1e293b; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
          .whats-next { background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 25px 0; }
          .whats-next h3 { color: #059669; margin-top: 0; }
          .contact-info { text-align: center; margin: 30px 0; padding: 20px; background: #fefce8; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmed! 🎉</h1>
            <p>Thank you for your purchase!</p>
          </div>
          <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            <p>Your order has been successfully received and is now being processed.</p>
            <div class="order-id-box">
              <p style="margin: 0; color: #64748b">Your Tracking ID</p>
              <div class="tracking-id">${order.trackingId}</div>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #64748b">Use this ID to track your order</p>
            </div>
            <div class="message-box">
              <p style="margin: 0">
                <strong>Order Summary:</strong><br />
                • Total: ₹${order.finalAmount.toLocaleString('en-IN')}<br />
                • Payment: ${order.payment_Method}<br />
                • Status: <span style="color: #059669">${order.productStatus}</span>
              </p>
            </div>
            <div class="whats-next">
              <h3>What happens next?</h3>
              <p>1. We're preparing your items<br />2. You'll receive dispatch confirmation<br />3. Delivery executive will contact you<br />4. Enjoy your purchase!</p>
            </div>
            <div class="info-box">
              <h3 style="margin-top: 0; color: #1e293b">Delivery Details</h3>
              <div class="info-row">
                <span class="info-label">Delivery Address:</span>
                <span class="info-value">
                  ${order.address.street}, ${order.address.city}<br />
                  ${order.address.state} - ${order.address.postalCode}<br />
                  ${order.address.country}
                </span>
              </div>
            </div>
            ${order.payment_Method === 'COD' ? `
            <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e">
                💰 <strong>Cash on Delivery:</strong> Please keep ₹${order.finalAmount.toLocaleString('en-IN')} ready for payment upon delivery.
              </p>
            </div>` : ''}
            <div class="contact-info">
              <p style="margin: 0">
                <strong>Need help?</strong><br />Email: support@infinitemart.com<br />Phone: +91 9236-155-156<br />Hours: Mon-Sun, 9 AM - 8 PM
              </p>
            </div>
            <p style="text-align: center; margin-top: 30px">
              <a href="${trackingLink}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">Track Your Order</a>
            </p>
          </div>
          <div class="footer">
            <p style="margin: 5px 0">This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
    </html>`;
  }

  getVerificationTemplate(data) {
    const { otp } = data;
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
            body { margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .email-container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); }
            .email-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; color: white; }
            .header-title { font-size: 24px; margin: 0; font-weight: 600; }
            .email-content { padding: 40px; }
            .otp-container { background: #f8fafc; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; border: 2px dashed #c7d2fe; }
            .otp-label { font-size: 14px; color: #64748b; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
            .otp-code { font-size: 48px; font-weight: 700; letter-spacing: 8px; color: #4f46e5; margin: 15px 0; font-family: 'Courier New', monospace; }
            .expiry-notice { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 25px 0; }
            .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 8px; margin: 25px 0; }
            .instructions { margin: 30px 0; color: #64748b; }
            .email-footer { background: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
            @media (max-width: 640px) { .email-content { padding: 25px; } .otp-code { font-size: 36px; letter-spacing: 6px; } }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-header">
                <h1 class="header-title">Email Verification</h1>
            </div>
            <div class="email-content">
                <p>To verify your email address, please use the One-Time Password (OTP) below:</p>
                <div class="otp-container">
                    <div class="otp-label">Your Verification Code</div>
                    <div class="otp-code">${otp}</div>
                    <div style="color: #64748b; font-size: 14px; margin-top: 10px;">(Valid for 5 minutes)</div>
                </div>
                <div class="expiry-notice">
                    <p style="margin: 0; color: #92400e;">⏰ This code will expire in <strong>5 minutes</strong></p>
                </div>
                <div class="warning">
                    <p style="margin: 0; color: #991b1b;">🔒 Never share this code with anyone</p>
                </div>
                <div class="instructions">
                    <p>Enter this code on the verification page to complete your email verification.</p>
                </div>
                <p style="color: #64748b; font-size: 14px;">If you didn't request this email, please ignore it.</p>
            </div>
            <div class="email-footer">
                <p style="margin: 5px 0;">This is an automated message. Please do not reply.</p>
                <p style="margin: 5px 0;">2024 All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  getFallbackTemplate(otp) {
    return `
        <!DOCTYPE html>
        <html>
        <body>
            <h3>Email Verification</h3>
            <p>Your verification code is: <strong>${otp}</strong></p>
            <p>This code is valid for 5 minutes.</p>
            <p><small>Do not share this code with anyone.</small></p>
        </body>
        </html>
        `;
  }
}

module.exports = new EmailRenderer();
