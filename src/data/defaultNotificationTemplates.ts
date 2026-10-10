import { NotificationTemplate } from '../types/erp';

export const DEFAULT_NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  // ==========================================
  // CUSTOMER NOTIFICATIONS (10 Standard Types)
  // ==========================================
  {
    id: 'customer_new_sale',
    templateType: 'new_sale',
    category: 'customer_notifications',
    name: 'New Sale',
    description: 'Notification triggered automatically when a new POS checkout or sales order invoice is completed.',
    autoSendEmail: true,
    autoSendSms: true,
    attachPdf: true,
    emailSubject: 'Invoice #{invoice_number} from {business_name}',
    emailCc: '',
    emailBcc: '',
    emailBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px;">
  <h2 style="color: #4f46e5; margin-bottom: 8px;">Thank You for Your Order!</h2>
  <p>Dear <strong>{contact_name}</strong>,</p>
  <p>We are pleased to confirm your transaction with <strong>{business_name}</strong>. Your invoice details are summarized below:</p>
  
  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 6px 0; color: #64748b;">Invoice Number:</td>
        <td style="padding: 6px 0; font-weight: bold; text-align: right;">#{invoice_number}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #64748b;">Total Amount:</td>
        <td style="padding: 6px 0; font-weight: bold; text-align: right;">{total_amount}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #64748b;">Amount Paid:</td>
        <td style="padding: 6px 0; font-weight: bold; color: #16a34a; text-align: right;">{paid_amount}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #64748b;">Balance Due:</td>
        <td style="padding: 6px 0; font-weight: bold; color: #dc2626; text-align: right;">{due_amount}</td>
      </tr>
    </table>
  </div>

  <p>Branch / Location: <strong>{location_name}</strong><br/>{location_address}<br/>Phone: {location_phone} | Email: {location_email}</p>
  
  <p style="margin-top: 10px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px;">Invoice Layout: Standard (Default)</p>

  <p style="margin-top: 24px;">Warm regards,<br/><strong>{business_name} Team</strong></p>
</div>`,
    smsBody: `Dear {contact_name}, thank you for shopping at {business_name}! Invoice #{invoice_number} generated. Total: {total_amount}, Paid: {paid_amount}, Due: {due_amount}. Visit again!`,
    availableTags: [
      '{contact_name}',
      '{invoice_number}',
      '{total_amount}',
      '{paid_amount}',
      '{due_amount}',
      '{due_date}',
      '{business_name}',
      '{business_logo}',
      '{location_name}',
      '{location_address}',
      '{location_email}',
      '{location_phone}',
      '{service_staff}',
      '{custom_field_1}',
      '{custom_field_2}',
      '{custom_field_3}',
      '{custom_field_4}',
      '{location_custom_field_1}',
      '{location_custom_field_2}',
      '{location_custom_field_3}',
      '{location_custom_field_4}',
    ],
  },
  {
    id: 'customer_payment_received',
    templateType: 'payment_received',
    category: 'customer_notifications',
    name: 'Payment Received',
    description: 'Notification sent when customer clears due balance or partial invoice payment.',
    autoSendEmail: true,
    autoSendSms: true,
    attachPdf: false,
    emailSubject: 'Payment Confirmation for Invoice #{invoice_number} - {business_name}',
    emailCc: '',
    emailBcc: '',
    emailBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px;">
  <h2 style="color: #16a34a; margin-bottom: 8px;">Payment Received Successfully</h2>
  <p>Dear <strong>{contact_name}</strong>,</p>
  <p>We have acknowledged and processed your payment with thanks. Details of the transaction:</p>
  
  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
    <p><strong>Invoice Number:</strong> #{invoice_number}</p>
    <p><strong>Amount Received:</strong> <span style="color: #16a34a; font-weight: bold;">{received_amount}</span></p>
    <p><strong>Payment Reference:</strong> {payment_ref_no}</p>
    <p><strong>Payment Method:</strong> {payment_method}</p>
    <p><strong>Remaining Outstanding Due:</strong> <span style="color: #dc2626; font-weight: bold;">{due_amount}</span></p>
  </div>

  <p>Thank you for your prompt remittance.</p>
  <p>Best regards,<br/><strong>{business_name}</strong></p>
</div>`,
    smsBody: `Dear {contact_name}, payment of {received_amount} received for invoice #{invoice_number} via {payment_method}. Remaining Due: {due_amount}. Thanks, {business_name}.`,
    availableTags: [
      '{contact_name}',
      '{invoice_number}',
      '{received_amount}',
      '{due_amount}',
      '{payment_ref_no}',
      '{payment_method}',
      '{business_name}',
      '{business_logo}',
      '{location_name}',
      '{location_phone}',
    ],
  },
  {
    id: 'customer_payment_reminder',
    templateType: 'payment_reminder',
    category: 'customer_notifications',
    name: 'Payment Reminder',
    description: 'Notification sent to remind customers about pending credit dues or upcoming invoice due dates.',
    autoSendEmail: false,
    autoSendSms: true,
    attachPdf: true,
    emailSubject: 'Payment Reminder: Outstanding Due for Invoice #{invoice_number}',
    emailCc: '',
    emailBcc: '',
    emailBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px;">
  <h2 style="color: #eab308; margin-bottom: 8px;">Payment Reminder Notice</h2>
  <p>Dear <strong>{contact_name}</strong>,</p>
  <p>This is a friendly reminder that an outstanding payment of <strong>{due_amount}</strong> for Invoice <strong>#{invoice_number}</strong> is due on <strong>{due_date}</strong>.</p>
  
  <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 16px; margin: 16px 0;">
    <p><strong>Invoice Number:</strong> #{invoice_number}</p>
    <p><strong>Due Amount:</strong> <strong style="color: #b45309;">{due_amount}</strong></p>
    <p><strong>Due Date:</strong> {due_date}</p>
  </div>

  <p>Kindly arrange payment at your earliest convenience to maintain an uninterrupted credit balance.</p>
  <p>Best regards,<br/><strong>{business_name}</strong><br/>{location_phone}</p>
</div>`,
    smsBody: `Dear {contact_name}, gentle reminder: payment of {due_amount} for invoice #{invoice_number} is due on {due_date}. Please clear at earliest. - {business_name}`,
    availableTags: [
      '{contact_name}',
      '{invoice_number}',
      '{due_amount}',
      '{due_date}',
      '{business_name}',
      '{business_logo}',
      '{location_name}',
      '{location_phone}',
    ],
  },
  {
    id: 'customer_new_quotation',
    templateType: 'new_quotation',
    category: 'customer_notifications',
    name: 'New Quotation / Estimate',
    description: 'Notification triggered when a quotation or sales estimate proposal is created.',
    autoSendEmail: true,
    autoSendSms: false,
    attachPdf: true,
    emailSubject: 'Quotation #{invoice_number} from {business_name}',
    emailCc: '',
    emailBcc: '',
    emailBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px;">
  <h2 style="color: #4f46e5; margin-bottom: 8px;">Quotation Proposal</h2>
  <p>Dear <strong>{contact_name}</strong>,</p>
  <p>Thank you for reaching out to us. We are pleased to provide quotation <strong>#{invoice_number}</strong> with total estimated value of <strong>{total_amount}</strong>.</p>
  
  <p>Please review the attached formal quotation. Should you have any questions or require modifications, please contact our team.</p>
  <p>Best regards,<br/><strong>{business_name}</strong><br/>{location_name} | {location_phone}</p>
</div>`,
    smsBody: `Dear {contact_name}, quotation #{invoice_number} totaling {total_amount} is ready from {business_name}. Thank you for your inquiry.`,
    availableTags: ['{contact_name}', '{invoice_number}', '{total_amount}', '{business_name}', '{location_name}'],
  },
  {
    id: 'customer_new_booking',
    templateType: 'new_booking',
    category: 'customer_notifications',
    name: 'New Booking / Service Order',
    description: 'Notification sent upon appointment reservation, table reservation, or service booking.',
    autoSendEmail: true,
    autoSendSms: true,
    attachPdf: false,
    emailSubject: 'Booking Confirmation - {business_name}',
    emailCc: '',
    emailBcc: '',
    emailBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px;">
  <h2 style="color: #059669; margin-bottom: 8px;">Booking Confirmed</h2>
  <p>Dear <strong>{contact_name}</strong>,</p>
  <p>Your booking with <strong>{business_name}</strong> has been successfully scheduled:</p>
  
  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
    <p><strong>Service Staff / Desk:</strong> {service_staff}</p>
    <p><strong>Scheduled Time:</strong> {start_time} to {end_time}</p>
    <p><strong>Status:</strong> {booking_status}</p>
    <p><strong>Location:</strong> {location_name}</p>
  </div>

  <p>We look forward to welcoming you.</p>
  <p>Warm regards,<br/><strong>{business_name}</strong></p>
</div>`,
    smsBody: `Dear {contact_name}, your booking for {start_time} with {service_staff} is {booking_status}. Location: {location_name}. - {business_name}`,
    availableTags: [
      '{contact_name}',
      '{service_staff}',
      '{start_time}',
      '{end_time}',
      '{booking_status}',
      '{business_name}',
      '{location_name}',
    ],
  },
  {
    id: 'customer_new_order',
    templateType: 'new_order',
    category: 'customer_notifications',
    name: 'New Order / Sales Order',
    description: 'Notification triggered when a customer sales order is registered or placed into processing queue.',
    autoSendEmail: true,
    autoSendSms: true,
    attachPdf: true,
    emailSubject: 'Order Confirmation #{invoice_number} - {business_name}',
    emailCc: '',
    emailBcc: '',
    emailBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px;">
  <h2 style="color: #4f46e5; margin-bottom: 8px;">Order Confirmation</h2>
  <p>Dear <strong>{contact_name}</strong>,</p>
  <p>We are pleased to confirm your order <strong>#{invoice_number}</strong> with total value of <strong>{total_amount}</strong>.</p>
  <p>Current Order Status: <strong style="color: #2563eb;">{order_status}</strong></p>
  <p>Our fulfillment team is processing your items promptly.</p>
  <p>Warm regards,<br/><strong>{business_name}</strong></p>
</div>`,
    smsBody: `Dear {contact_name}, your order #{invoice_number} ({total_amount}) is confirmed. Status: {order_status}. - {business_name}`,
    availableTags: ['{contact_name}', '{order_status}', '{invoice_number}', '{total_amount}', '{business_name}'],
  },
  {
    id: 'customer_order_status',
    templateType: 'order_status',
    category: 'customer_notifications',
    name: 'Order Status Update / Delivered',
    description: 'Notification sent when order status transitions (Packed, Shipped, Delivered, or Ready for Pickup).',
    autoSendEmail: true,
    autoSendSms: true,
    attachPdf: false,
    emailSubject: 'Order Status Updated: #{invoice_number} is {order_status}',
    emailCc: '',
    emailBcc: '',
    emailBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px;">
  <h2 style="color: #4f46e5; margin-bottom: 8px;">Order Progress Update</h2>
  <p>Dear <strong>{contact_name}</strong>,</p>
  <p>The status of your order <strong>#{invoice_number}</strong> has been updated to: <strong>{order_status}</strong>.</p>
  <p>Location: {location_name}</p>
  <p>Thank you for choosing <strong>{business_name}</strong>!</p>
</div>`,
    smsBody: `Dear {contact_name}, order #{invoice_number} status is now {order_status}. Thank you, {business_name}.`,
    availableTags: ['{contact_name}', '{order_status}', '{invoice_number}', '{business_name}', '{location_name}'],
  },
  {
    id: 'customer_recurring_invoice',
    templateType: 'recurring_invoice',
    category: 'customer_notifications',
    name: 'Recurring Invoice Notification',
    description: 'Notification triggered automatically when subscription or auto-renew billing invoices generate.',
    autoSendEmail: true,
    autoSendSms: false,
    attachPdf: true,
    emailSubject: 'Recurring Subscription Invoice #{invoice_number}',
    emailCc: '',
    emailBcc: '',
    emailBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px;">
  <h2 style="color: #4f46e5; margin-bottom: 8px;">Subscription Invoice Generated</h2>
  <p>Dear <strong>{contact_name}</strong>,</p>
  <p>Your recurring subscription <strong>{subscription_no}</strong> has generated invoice <strong>#{invoice_number}</strong> for <strong>{total_amount}</strong>.</p>
  <p>Best regards,<br/><strong>{business_name}</strong></p>
</div>`,
    smsBody: `Dear {contact_name}, your subscription {subscription_no} invoice #{invoice_number} for {total_amount} is ready. - {business_name}`,
    availableTags: ['{contact_name}', '{subscription_no}', '{invoice_number}', '{total_amount}', '{business_name}'],
  },
  {
    id: 'customer_send_payment_link',
    templateType: 'send_payment_link',
    category: 'customer_notifications',
    name: 'Send Payment Link',
    description: 'Direct payment gateway checkout link sent to customers for fast online settlement.',
    autoSendEmail: true,
    autoSendSms: true,
    attachPdf: false,
    emailSubject: 'Payment link for Invoice #{invoice_number} - {business_name}',
    emailCc: '',
    emailBcc: '',
    emailBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px;">
  <h2 style="color: #4f46e5; margin-bottom: 8px;">Secure Online Payment Link</h2>
  <p>Dear <strong>{contact_name}</strong>,</p>
  <p>Please use the following secure payment link to complete payment of <strong>{due_amount}</strong> for Invoice <strong>#{invoice_number}</strong>:</p>
  
  <p style="margin: 20px 0;"><a href="{payment_link}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Pay Now ({due_amount})</a></p>
  
  <p>Direct Link: <a href="{payment_link}">{payment_link}</a></p>
  <p>Regards,<br/><strong>{business_name}</strong></p>
</div>`,
    smsBody: `Dear {contact_name}, pay {due_amount} for invoice #{invoice_number} via secure link: {payment_link} - {business_name}`,
    availableTags: ['{contact_name}', '{invoice_number}', '{due_amount}', '{payment_link}', '{business_name}'],
  },
  {
    id: 'customer_ledger',
    templateType: 'customer_ledger',
    category: 'customer_notifications',
    name: 'Customer Ledger Statement',
    description: 'Account balance summary and ledger statement dispatched to customer.',
    autoSendEmail: true,
    autoSendSms: false,
    attachPdf: true,
    emailSubject: 'Customer Account Statement - {business_name}',
    emailCc: '',
    emailBcc: '',
    emailBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px;">
  <h2 style="color: #4f46e5; margin-bottom: 8px;">Customer Account Ledger</h2>
  <p>Dear <strong>{contact_name}</strong>,</p>
  <p>Please find attached your updated account statement from <strong>{business_name}</strong>. Your current net balance due is <strong>{balance_due}</strong>.</p>
  <p>If you have any questions regarding your statement, please contact {location_name}.</p>
  <p>Warm regards,<br/><strong>{business_name}</strong></p>
</div>`,
    smsBody: `Dear {contact_name}, your account ledger statement from {business_name} has a net balance due of {balance_due}.`,
    availableTags: ['{contact_name}', '{balance_due}', '{business_name}', '{location_name}'],
  },

  // ==========================================
  // SUPPLIER NOTIFICATIONS (4 Standard Types)
  // ==========================================
  {
    id: 'supplier_new_purchase_order',
    templateType: 'new_purchase_order',
    category: 'supplier_notifications',
    name: 'New Purchase Order (PO)',
    description: 'Notification triggered when a purchase order is created and issued to a vendor/supplier.',
    autoSendEmail: true,
    autoSendSms: true,
    attachPdf: true,
    emailSubject: 'Purchase Order #{po_number} from {business_name}',
    emailCc: '',
    emailBcc: '',
    emailBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px;">
  <h2 style="color: #4f46e5; margin-bottom: 8px;">Purchase Order Notice</h2>
  <p>Dear <strong>{contact_name}</strong>,</p>
  <p>Please find our Purchase Order <strong>#{po_number}</strong> with total estimated value of <strong>{total_amount}</strong>.</p>
  
  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
    <p><strong>PO Reference:</strong> #{po_number}</p>
    <p><strong>Total Value:</strong> {total_amount}</p>
    <p><strong>Ship To Destination:</strong> {location_name}<br/>{location_address}</p>
    <p><strong>Contact:</strong> {location_phone} | {location_email}</p>
  </div>

  <p>Kindly acknowledge receipt and confirm expected delivery dispatch.</p>
  <p>Best regards,<br/><strong>{business_name} Purchasing Dept</strong></p>
</div>`,
    smsBody: `Dear {contact_name}, PO #{po_number} totaling {total_amount} has been issued by {business_name}. Ship to: {location_name}.`,
    availableTags: [
      '{contact_name}',
      '{po_number}',
      '{total_amount}',
      '{business_name}',
      '{location_name}',
      '{location_address}',
      '{location_email}',
      '{location_phone}',
    ],
  },
  {
    id: 'supplier_payment_sent',
    templateType: 'payment_sent',
    category: 'supplier_notifications',
    name: 'Payment Sent / Remittance',
    description: 'Notification sent to vendor upon payment disbursement against supplier invoice or purchase order.',
    autoSendEmail: true,
    autoSendSms: true,
    attachPdf: false,
    emailSubject: 'Payment Remittance Notification (Ref: {payment_ref_no}) - {business_name}',
    emailCc: '',
    emailBcc: '',
    emailBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px;">
  <h2 style="color: #16a34a; margin-bottom: 8px;">Payment Disbursement Advice</h2>
  <p>Dear <strong>{contact_name}</strong>,</p>
  <p>We have disbursed payment of <strong>{paid_amount}</strong> against PO/Invoice <strong>#{po_number}</strong>.</p>
  
  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
    <p><strong>Payment Ref:</strong> {payment_ref_no}</p>
    <p><strong>Amount Paid:</strong> <span style="color: #16a34a; font-weight: bold;">{paid_amount}</span></p>
    <p><strong>Remaining Balance Due:</strong> {due_amount}</p>
  </div>

  <p>Thank you,<br/><strong>{business_name} Accounts Dept</strong></p>
</div>`,
    smsBody: `Dear {contact_name}, payment of {paid_amount} disbursed for #{po_number} (Ref: {payment_ref_no}). Remaining due: {due_amount}. - {business_name}`,
    availableTags: ['{contact_name}', '{po_number}', '{paid_amount}', '{due_amount}', '{payment_ref_no}', '{business_name}', '{location_name}'],
  },
  {
    id: 'supplier_purchase_received',
    templateType: 'purchase_received',
    category: 'supplier_notifications',
    name: 'Purchase Received / Goods Inward',
    description: 'Notification sent when supplier inventory shipments are received and inspected at warehouse.',
    autoSendEmail: true,
    autoSendSms: false,
    attachPdf: false,
    emailSubject: 'Goods Receipt Confirmation for Reference #{ref_no}',
    emailCc: '',
    emailBcc: '',
    emailBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px;">
  <h2 style="color: #4f46e5; margin-bottom: 8px;">Goods Inward Confirmation</h2>
  <p>Dear <strong>{contact_name}</strong>,</p>
  <p>We confirm that goods against Purchase Reference <strong>#{ref_no}</strong> valued at <strong>{total_amount}</strong> have been safely received at warehouse <strong>{location_name}</strong>.</p>
  <p>Thank you for the prompt fulfillment.</p>
  <p>Best regards,<br/><strong>{business_name} Receiving Team</strong></p>
</div>`,
    smsBody: `Dear {contact_name}, shipment for #{ref_no} ({total_amount}) received at {location_name}. Thank you, {business_name}.`,
    availableTags: ['{contact_name}', '{ref_no}', '{total_amount}', '{business_name}', '{location_name}'],
  },
  {
    id: 'supplier_ledger',
    templateType: 'supplier_ledger',
    category: 'supplier_notifications',
    name: 'Supplier Ledger Statement',
    description: 'Vendor account reconciliation statement dispatched to supplier.',
    autoSendEmail: true,
    autoSendSms: false,
    attachPdf: true,
    emailSubject: 'Vendor Account Reconciliation Statement - {business_name}',
    emailCc: '',
    emailBcc: '',
    emailBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px;">
  <h2 style="color: #4f46e5; margin-bottom: 8px;">Vendor Account Statement</h2>
  <p>Dear <strong>{contact_name}</strong>,</p>
  <p>Please find attached your updated vendor account ledger statement. Net balance payable: <strong>{balance_due}</strong>.</p>
  <p>Regards,<br/><strong>{business_name} Accounts Dept</strong></p>
</div>`,
    smsBody: `Dear {contact_name}, your vendor account balance with {business_name} is {balance_due}.`,
    availableTags: ['{contact_name}', '{balance_due}', '{business_name}', '{location_name}'],
  },
  {
    id: 'customer_new_registration',
    templateType: 'new_customer_registration',
    category: 'customer_notifications',
    name: 'Customer Registration Welcome',
    description: 'Welcome message sent automatically when a new customer profile is created.',
    autoSendEmail: true,
    autoSendSms: false,
    attachPdf: false,
    emailSubject: 'Welcome to {business_name}!',
    emailCc: '',
    emailBcc: '',
    emailBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px;">
  <h2 style="color: #4f46e5; margin-bottom: 8px;">Welcome Aboard!</h2>
  <p>Dear <strong>{contact_name}</strong>,</p>
  <p>Thank you for registering with <strong>{business_name}</strong>. We are excited to have you as part of our community.</p>
  <p>You can now enjoy a personalized shopping experience and keep track of your purchases easily.</p>
  <p>If you have any questions, feel free to reply to this email or visit us at <strong>{location_name}</strong>.</p>
  <p>Best regards,<br/><strong>{business_name} Team</strong></p>
</div>`,
    smsBody: `Welcome {contact_name}! Thank you for registering with {business_name}. We look forward to serving you.`,
    availableTags: ['{contact_name}', '{business_name}', '{location_name}'],
  },
];
