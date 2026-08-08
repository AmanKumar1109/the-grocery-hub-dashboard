export const EMAIL_WRAPPER = (content) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body {
    font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    background-color: #f4fdf8;
    margin: 0;
    padding: 0;
    color: #334155;
    line-height: 1.6;
  }
  .container {
    max-width: 600px;
    margin: 40px auto;
    background: #ffffff;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border: 1px solid #e2e8f0;
  }
  .header {
    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
    padding: 30px 20px;
    text-align: center;
  }
  .header h1 {
    color: #ffffff;
    margin: 0;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.5px;
  }
  .content {
    padding: 40px 30px;
    font-size: 16px;
  }
  .content p {
    margin-top: 0;
    margin-bottom: 20px;
  }
  .highlight {
    background: #ecfdf5;
    padding: 15px 20px;
    border-radius: 12px;
    border-left: 4px solid #10b981;
    margin-bottom: 20px;
  }
  .footer {
    background: #f8fafc;
    padding: 20px;
    text-align: center;
    font-size: 13px;
    color: #64748b;
    border-top: 1px solid #f1f5f9;
  }
  .btn {
    display: inline-block;
    background: #10b981;
    color: #ffffff;
    text-decoration: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    margin-top: 10px;
  }
  .order-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    background: #ffffff;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
  }
  .order-table th {
    background: #f8fafc;
    padding: 12px 15px;
    text-align: left;
    font-size: 13px;
    color: #64748b;
    border-bottom: 2px solid #e2e8f0;
  }
  .order-table td {
    padding: 12px 15px;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
    font-size: 14px;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>The Grocery Hub 🛒</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Thank you for shopping with us!<br><strong>The Grocery Hub</strong> - Fresh • Quality • Trust</p>
    </div>
  </div>
</body>
</html>
`;

export const formatOrderItems = (items, totalAmount, address) => {
  if (!items || items.length === 0) return '';
  let html = `<table class="order-table">`;
  html += `<tr><th>Item</th><th style="text-align: right;">Total</th></tr>`;
  items.forEach(item => {
    const qty = item.quantity || 1;
    const name = item.name || 'Item';
    const price = item.finalPrice || item.price || 0;
    const total = (price * qty).toFixed(2);
    html += `
      <tr>
        <td><strong>${qty}x</strong> ${name}</td>
        <td style="text-align: right; font-weight: 600;">₹${total}</td>
      </tr>
    `;
  });
  
  if (totalAmount !== undefined) {
    html += `
      <tr>
        <td style="text-align: right; font-weight: 800; color: #0f172a; font-size: 15px;">Total</td>
        <td style="text-align: right; font-weight: 800; color: #059669; font-size: 16px;">₹${parseFloat(totalAmount).toFixed(2)}</td>
      </tr>
    `;
  }
  
  if (address) {
    html += `
      <tr>
        <td colspan="2" style="padding: 15px; background: #f8fafc; font-size: 13px; color: #475569; line-height: 1.5;">
          <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Delivery Address:</strong>
          ${address}
        </td>
      </tr>
    `;
  }
  
  html += `</table>`;
  return html.replace(/\n/g, '');
};

export const DEFAULT_TEMPLATES = {
  Welcome: {
    subject: "Welcome to The Grocery Hub! 🎉",
    body: `Hi [Customer Name],

Welcome to The Grocery Hub! 🛒💚

We are thrilled to have you join our community. You can now explore fresh groceries and get them delivered straight to your door.

<div class="highlight">
<strong>Your Registered Email:</strong> [Email]
</div>

Start shopping today and enjoy the best quality at the best prices!

Thank you,
The Grocery Hub Team`
  },
  Pending: {
    subject: "Order Received – The Grocery Hub",
    body: `Dear [Customer Name],

Thank you for shopping with The Grocery Hub! 🛒

Your order <strong>#[Order ID]</strong> has been successfully received.

<div class="highlight">
💰 <strong>Order Amount:</strong> ₹[Amount]<br>
📍 <strong>Delivery Address:</strong> [Address]<br>
🕐 <strong>Expected Delivery:</strong> [Time]<br><br>
<strong>🛒 Order Details:</strong>
[Order Items]
</div>

We are now preparing your order. We’ll keep you updated on the next step.

The Grocery Hub
Your Satisfaction, Our Priority. ❤️`
  },
  Prepared: {
    subject: "Your Order is Being Prepared 📦",
    body: `Dear [Customer Name],

Your order <strong>#[Order ID]</strong> has been confirmed and is now being prepared. 📦

Our team is carefully packing your groceries and getting them ready for delivery.

<div class="highlight">
<strong>🛒 Order Details:</strong>
[Order Items]
</div>

Thank you for choosing The Grocery Hub! 💚`
  },
  "Out for delivery": {
    subject: "Your Order is Out for Delivery! 🛵",
    body: `Dear [Customer Name],

Good news! 🎉

Your order <strong>#[Order ID]</strong> is now out for delivery. 🛵

<div class="highlight">
📍 <strong>Delivery Address:</strong> [Address]<br>
💰 <strong>Amount to Pay:</strong> ₹[Amount]<br><br>
<strong>🛒 Order Details:</strong>
[Order Items]
</div>

Please keep your phone available so our delivery partner can contact you if required.

The Grocery Hub
Fresh • Quality • Trust`
  },
  Delivered: {
    subject: "Your Order has been Delivered! ✅",
    body: `Dear [Customer Name],

Your order <strong>#[Order ID]</strong> has been successfully delivered. ✅

Thank you for choosing The Grocery Hub!
We hope you had a great shopping experience with us. 😊

<div class="highlight">
<strong>🛒 Order Details:</strong>
[Order Items]
</div>

<div class="highlight" style="text-align: center;">
<strong>How was your experience with The Grocery Hub? ⭐</strong><br>
We’d love to hear from you!<br>
Your feedback helps us serve you better. 💚
</div>

We look forward to serving you again! 🛒`
  },
  Cancelled: {
    subject: "Order Cancelled - #[Order ID]",
    body: `Dear [Customer Name],

Your order <strong>#[Order ID]</strong> has been cancelled. ❌

<div class="highlight">
<strong>Reason:</strong> [Cancel Reason]
</div>

If you have already paid, your refund will be processed shortly. Please contact support if you need any assistance.

The Grocery Hub`
  }
};
