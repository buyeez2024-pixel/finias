import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { validatePhoneNumber } from '../../utils/phoneValidation';
import { validateEmail } from '../../utils/formatters';
import {
  NotificationTemplate,
  NotificationType,
  NotificationChannel,
  NotificationCategory,
} from '../../types/erp';
import {
  Mail,
  MessageSquare,
  Smartphone,
  Send,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sliders,
  Settings,
  History,
  Copy,
  ChevronDown,
  ChevronRight,
  Eye,
  Code,
  FileText,
  UserCheck,
  Truck,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  Check,
  Zap,
} from 'lucide-react';

export const NotificationTemplatesView: React.FC = () => {
  const {
    notificationTemplates,
    updateNotificationTemplate,
    resetNotificationTemplate,
    resetAllNotificationTemplates,
    notificationLogs,
    clearNotificationLogs,
    sendNotification,
    settings,
    updateSettings,
    customers,
    suppliers,
    currentLocation,
    formatMoney,
    showFlashNotification,
  } = useErp();

  // Navigation Sub Tabs
  const [activeMainTab, setActiveMainTab] = useState<
    'customer' | 'supplier' | 'simulator' | 'gateways' | 'logs'
  >('customer');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Expanded Accordion state
  const [expandedTemplates, setExpandedTemplates] = useState<Record<string, boolean>>({
    customer_new_sale: true,
    supplier_new_purchase_order: true,
  });

  // Active channel editing per template
  const [activeChannelPerTemplate, setActiveChannelPerTemplate] = useState<
    Record<string, NotificationChannel>
  >({});

  // Active HTML code view vs Visual WYSIWYG per template
  const [htmlCodeModePerTemplate, setHtmlCodeModePerTemplate] = useState<Record<string, boolean>>({});

  // Live Simulator state
  const [simTemplateId, setSimTemplateId] = useState<string>('customer_new_sale');
  const [simChannel, setSimChannel] = useState<NotificationChannel>('email');
  const [simRecipientType, setSimRecipientType] = useState<'customer' | 'supplier' | 'custom'>('customer');
  const [simSelectedContactId, setSimSelectedContactId] = useState<string>('');
  const [simCustomName, setSimCustomName] = useState('Alex Johnson');
  const [simCustomEmail, setSimCustomEmail] = useState('alex.johnson@example.com');
  const [simCustomPhone, setSimCustomPhone] = useState('+1 (555) 789-0123');

  // Quick Test Send Modal / Drawer
  const [testModalTemplate, setTestModalTemplate] = useState<NotificationTemplate | null>(null);
  const [testModalChannel, setTestModalChannel] = useState<NotificationChannel>('email');
  const [testModalRecipient, setTestModalRecipient] = useState({
    name: 'Alex Johnson',
    email: 'buyeez2024@gmail.com',
    phone: '+1 (555) 432-8765',
  });
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testModalResult, setTestModalResult] = useState<{
    success: boolean;
    message: string;
    previewUrl?: string;
    directUrl?: string;
    channel: string;
    recipientContact: string;
  } | null>(null);

  // Live Simulator state & results
  const [simSending, setSimSending] = useState(false);
  const [simLastResult, setSimLastResult] = useState<{
    success: boolean;
    message: string;
    previewUrl?: string;
    directUrl?: string;
    channel: string;
  } | null>(null);

  // Gateway Settings local draft
  const [smtpDraft, setSmtpDraft] = useState({
    mailDriver: settings.emailSettings?.mailDriver || 'smtp',
    host: settings.emailSettings?.host || '',
    port: settings.emailSettings?.port || 587,
    username: settings.emailSettings?.username || '',
    password: settings.emailSettings?.password || '',
    encryption: settings.emailSettings?.encryption || 'tls',
    fromName: settings.emailSettings?.fromName || settings.name || 'Royal POS ERP',
    fromAddress: settings.emailSettings?.fromAddress || settings.email || 'notifications@poserp.io',
  });

  const [smsDraft, setSmsDraft] = useState({
    gateway: settings.smsSettings?.gateway || 'twilio',
    apiKey: settings.smsSettings?.apiKey || '',
    apiSecret: settings.smsSettings?.apiSecret || '',
    senderId: settings.smsSettings?.senderId || 'ROYALPOS',
    customUrl: settings.smsSettings?.customUrl || 'https://api.sms-provider.com/v1/send?to={to}&msg={msg}&key={key}',
  });

  const [whatsappDraft, setWhatsappDraft] = useState({
    provider: settings.whatsappSettings?.provider || 'meta_cloud',
    phoneNumberId: settings.whatsappSettings?.phoneNumberId || '',
    wabaId: settings.whatsappSettings?.wabaId || '',
    accessToken: settings.whatsappSettings?.accessToken || '',
  });

  // SMTP Testing & Live Mailer Diagnostics
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpVerificationStatus, setSmtpVerificationStatus] = useState<{
    success: boolean;
    message: string;
    tip?: string;
  } | null>(null);

  const [liveTestEmailRecipient, setLiveTestEmailRecipient] = useState('buyeez2024@gmail.com');
  const [isSendingLiveSmtpTest, setIsSendingLiveSmtpTest] = useState(false);
  const [liveSmtpTestResult, setLiveSmtpTestResult] = useState<{
    success: boolean;
    message: string;
    previewUrl?: string;
    tip?: string;
  } | null>(null);

  const handleTestSmtpConnection = async () => {
    setIsTestingSmtp(true);
    setSmtpVerificationStatus(null);
    try {
      const res = await fetch('/api/notifications/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtpConfig: smtpDraft }),
      });
      const data = await res.json();
      setSmtpVerificationStatus({
        success: res.ok && data.success,
        message: data.message || data.error || 'Connection test completed',
        tip: data.tip,
      });
      if (res.ok && data.success) {
        showFlashNotification('SMTP Connection Verified Successfully!', 'success');
      } else {
        showFlashNotification(data.error || 'SMTP Connection failed', 'error');
      }
    } catch (err: any) {
      setSmtpVerificationStatus({
        success: false,
        message: err.message || 'Failed to connect to SMTP server',
        tip: 'Ensure host and port are reachable from the network.',
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleSendLiveSmtpTest = async () => {
    if (!liveTestEmailRecipient) {
      showFlashNotification('Please enter a recipient email address', 'error');
      return;
    }
    if (!validateEmail(liveTestEmailRecipient)) {
      showFlashNotification('Please enter a valid recipient email address with a proper domain (e.g. name@mail.com).', 'error');
      return;
    }
    setIsSendingLiveSmtpTest(true);
    setLiveSmtpTestResult(null);
    try {
      const res = await fetch('/api/notifications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: liveTestEmailRecipient,
          subject: `Live Test Notification from ${settings.name || 'Royal POS ERP'}`,
          html: `
            <div style="font-family: sans-serif; padding: 24px; color: #1e293b; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
              <h2 style="color: #4f46e5; margin-top: 0;">🎉 Notification Gateway Verification</h2>
              <p>This is a real test email dispatched directly from your POS ERP notification center to <strong>${liveTestEmailRecipient}</strong>.</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 13px; color: #64748b;">
                <strong>Server Timestamp:</strong> ${new Date().toLocaleString()}<br />
                <strong>Host:</strong> ${smtpDraft.host || 'Default Test Mailer'}<br />
                <strong>Port:</strong> ${smtpDraft.port}<br />
                <strong>Encryption:</strong> ${smtpDraft.encryption.toUpperCase()}
              </p>
            </div>
          `,
          smtpConfig: smtpDraft,
        }),
      });
      const data = await res.json();
      setLiveSmtpTestResult({
        success: res.ok && data.success,
        message: data.message || data.error || 'Test email completed',
        previewUrl: data.previewUrl,
        tip: data.tip,
      });
      if (res.ok && data.success) {
        showFlashNotification(`Real email sent to ${liveTestEmailRecipient}!`, 'success');
      } else {
        showFlashNotification(data.error || 'Failed to dispatch email', 'error');
      }
    } catch (err: any) {
      setLiveSmtpTestResult({
        success: false,
        message: err.message || 'Network error sending test email',
      });
    } finally {
      setIsSendingLiveSmtpTest(false);
    }
  };

  const handleSaveGateways = () => {
    console.log("Saving email settings:", smtpDraft);
    updateSettings({
      emailSettings: smtpDraft as any,
      smsSettings: smsDraft as any,
      whatsappSettings: whatsappDraft as any,
    });
    showFlashNotification('Gateway configuration saved successfully', 'success');
  };

  const toggleAccordion = (id: string) => {
    setExpandedTemplates((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getTemplateChannel = (tmplId: string): NotificationChannel => {
    return activeChannelPerTemplate[tmplId] || 'email';
  };

  const setTemplateChannel = (tmplId: string, channel: NotificationChannel) => {
    setActiveChannelPerTemplate((prev) => ({ ...prev, [tmplId]: channel }));
  };

  const insertTagAtTarget = (
    tmpl: NotificationTemplate,
    tag: string,
    channel: NotificationChannel,
    isSubject: boolean = false
  ) => {
    if (isSubject) {
      const updated = tmpl.emailSubject + ' ' + tag;
      updateNotificationTemplate(tmpl.id, { emailSubject: updated });
      return;
    }

    if (channel === 'email') {
      const updated = tmpl.emailBody + ' ' + tag;
      updateNotificationTemplate(tmpl.id, { emailBody: updated });
    } else if (channel === 'sms') {
      const updated = tmpl.smsBody + ' ' + tag;
      updateNotificationTemplate(tmpl.id, { smsBody: updated });
    } else if (channel === 'whatsapp') {
      const updated = tmpl.whatsappBody + ' ' + tag;
      updateNotificationTemplate(tmpl.id, { whatsappBody: updated });
    }
  };

  // Filter templates
  const customerTemplates = notificationTemplates.filter(
    (t) =>
      t.category === 'customer_notifications' &&
      (t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const supplierTemplates = notificationTemplates.filter(
    (t) =>
      t.category === 'supplier_notifications' &&
      (t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const currentSimTemplate =
    notificationTemplates.find((t) => t.id === simTemplateId) || notificationTemplates[0];

  // Helper to replace tags for live rendering preview
  const renderSimPreview = (template: NotificationTemplate, channel: NotificationChannel) => {
    let contactName = simCustomName;
    let contactEmail = simCustomEmail;
    let contactPhone = simCustomPhone;

    if (simRecipientType === 'customer' && simSelectedContactId) {
      const cust = customers.find((c) => c.id === simSelectedContactId);
      if (cust) {
        contactName = cust.name;
        contactPhone = cust.phone;
      }
    } else if (simRecipientType === 'supplier' && simSelectedContactId) {
      const supp = suppliers.find((s) => s.id === simSelectedContactId);
      if (supp) {
        contactName = supp.name;
        contactPhone = supp.phone;
      }
    }

    const dict: Record<string, string> = {
      '{contact_name}': contactName,
      '{business_name}': settings.name || 'Royal POS Enterprise',
      '{business_logo}': settings.logoUrl || '',
      '{location_name}': currentLocation?.name || 'Main Flagship Store',
      '{location_address}': currentLocation?.address || settings.address || '742 Evergreen Terrace, Springfield',
      '{location_email}': currentLocation?.email || settings.email || 'support@royalpos.com',
      '{location_phone}': currentLocation?.phone || settings.phone || '+1 (555) 019-2834',
      '{invoice_number}': 'INV-2026-8941',
      '{total_amount}': formatMoney(485.5),
      '{paid_amount}': formatMoney(485.5),
      '{due_amount}': formatMoney(0.0),
      '{due_date}': new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      '{received_amount}': formatMoney(485.5),
      '{payment_ref_no}': 'PAY-892401',
      '{payment_method}': 'Credit Card / Visa',
      '{service_staff}': 'Sarah Jenkins (Senior Stylist)',
      '{start_time}': '02:30 PM',
      '{end_time}': '03:45 PM',
      '{booking_status}': 'Confirmed',
      '{order_status}': 'Ready for Dispatch',
      '{subscription_no}': 'SUB-9402',
      '{payment_link}': 'https://pay.royalpos.io/inv/INV-2026-8941',
      '{balance_due}': formatMoney(0.0),
      '{po_number}': 'PO-2026-1049',
      '{ref_no}': 'REC-9012',
      '{custom_field_1}': 'Standard Delivery',
      '{custom_field_2}': 'Express Tracked',
      '{custom_field_3}': 'VAT Exempt',
      '{custom_field_4}': 'Priority Tier',
      '{location_custom_field_1}': 'Store-A',
      '{location_custom_field_2}': 'Zone-4',
      '{location_custom_field_3}': 'Direct Rack',
      '{location_custom_field_4}': 'Gate-B',
    };

    const replacer = (str: string) => {
      let out = str || '';
      Object.entries(dict).forEach(([key, val]) => {
        out = out.split(key).join(val);
      });
      return out;
    };

    return {
      subject: replacer(template.emailSubject),
      emailBody: replacer(template.emailBody),
      smsBody: replacer(template.smsBody),
      whatsappBody: replacer(template.whatsappBody),
      contactName,
      contactEmail,
      contactPhone,
    };
  };

  return (
    <div className="w-full max-w-full min-w-0 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl text-slate-100">
      {/* Header Bar */}
      <div className="bg-slate-900/95 border-b border-slate-800 p-4 sm:p-6 w-full max-w-full min-w-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400 shrink-0">
                <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2 flex-wrap">
                  <span>Notification Templates</span>
                  <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    finias POS Live Engine
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Configure automated transactional Email, SMS & WhatsApp notifications for Customers & Suppliers
                </p>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <button
              onClick={() => setActiveMainTab('simulator')}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-600/15 text-indigo-300 hover:bg-indigo-600/25 border border-indigo-500/30 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simulator</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('Reset all notification templates to default finias POS system templates?')) {
                  resetAllNotificationTemplates();
                }
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition"
              title="Reset all templates to initial defaults"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={() => {
                showFlashNotification('All notification templates synchronized and saved', 'success');
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save All</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation with Smooth Touch-Swipe Scrolling */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-4 pt-2 border-t border-slate-800 overflow-x-auto pb-1 scrollbar-thin touch-pan-x overscroll-x-contain w-full min-w-0">
          <button
            onClick={() => setActiveMainTab('customer')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-semibold rounded-xl transition whitespace-nowrap shrink-0 border ${
              activeMainTab === 'customer'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-600/20 shadow-sm'
                : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
            <span>Customer Notifications</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {notificationTemplates.filter((t) => t.category === 'customer_notifications').length}
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab('supplier')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-semibold rounded-xl transition whitespace-nowrap shrink-0 border ${
              activeMainTab === 'supplier'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-600/20 shadow-sm'
                : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span>Supplier Notifications</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {notificationTemplates.filter((t) => t.category === 'supplier_notifications').length}
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab('simulator')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-semibold rounded-xl transition whitespace-nowrap shrink-0 border ${
              activeMainTab === 'simulator'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-600/20 shadow-sm'
                : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span>Simulator</span>
          </button>

          <button
            onClick={() => setActiveMainTab('gateways')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-semibold rounded-xl transition whitespace-nowrap shrink-0 border ${
              activeMainTab === 'gateways'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-600/20 shadow-sm'
                : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
            <span>Gateways & SMTP</span>
          </button>

          <button
            onClick={() => setActiveMainTab('logs')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-semibold rounded-xl transition whitespace-nowrap shrink-0 border ${
              activeMainTab === 'logs'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-600/20 shadow-sm'
                : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            <span>Delivery Logs</span>
            {notificationLogs.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 font-mono">
                {notificationLogs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-3 sm:p-6 w-full max-w-full min-w-0 space-y-4 sm:space-y-6">
        {/* ==================================================== */}
        {/* TAB 1 & 2: CUSTOMER OR SUPPLIER TEMPLATES ACCORDION  */}
        {/* ==================================================== */}
        {(activeMainTab === 'customer' || activeMainTab === 'supplier') && (
          <div className="space-y-5">
            {/* Search and Helper Filter */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search ${
                    activeMainTab === 'customer' ? 'Customer' : 'Supplier'
                  } notification templates...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 w-full sm:w-auto justify-end">
                <span className="inline-flex items-center gap-1.5 text-slate-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Dynamic tags automatically parsed on trigger
                </span>
              </div>
            </div>

            {/* Template List Cards */}
            <div className="space-y-4">
              {(activeMainTab === 'customer' ? customerTemplates : supplierTemplates).map(
                (tmpl) => {
                  const isExpanded = !!expandedTemplates[tmpl.id];
                  const channel = getTemplateChannel(tmpl.id);
                  const isCodeView = !!htmlCodeModePerTemplate[tmpl.id];

                  return (
                    <div
                      key={tmpl.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all shadow-sm"
                    >
                      {/* Template Header / Accordion Bar */}
                      <div
                        onClick={() => toggleAccordion(tmpl.id)}
                        className="p-3 sm:px-5 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 hover:bg-slate-850 cursor-pointer select-none transition border-b border-slate-800/60 w-full max-w-full min-w-0"
                      >
                        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
                          <div className="p-1 text-slate-400 hover:text-slate-200 shrink-0 mt-0.5 sm:mt-0">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-xs sm:text-sm text-slate-100">{tmpl.name}</h3>
                              <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                {tmpl.templateType}
                              </span>
                              {tmpl.attachPdf && (
                                <span className="text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                  PDF Attached
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed">{tmpl.description}</p>
                          </div>
                        </div>

                        {/* Quick Auto-Send Toggles in Bar */}
                        <div
                          className="flex items-center gap-2.5 sm:gap-3 flex-wrap self-start sm:self-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <label className="flex items-center gap-1.5 text-xs text-slate-300 font-medium cursor-pointer">
                            <input
                              type="checkbox"
                              checked={tmpl.autoSendEmail}
                              onChange={(e) =>
                                updateNotificationTemplate(tmpl.id, {
                                  autoSendEmail: e.target.checked,
                                })
                              }
                              className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                            />
                            <Mail className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Email</span>
                          </label>

                          <label className="flex items-center gap-1.5 text-xs text-slate-300 font-medium cursor-pointer">
                            <input
                              type="checkbox"
                              checked={tmpl.autoSendSms}
                              onChange={(e) =>
                                updateNotificationTemplate(tmpl.id, {
                                  autoSendSms: e.target.checked,
                                })
                              }
                              className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                            />
                            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                            <span>SMS</span>
                          </label>

                          <label className="flex items-center gap-1.5 text-xs text-slate-300 font-medium cursor-pointer">
                            <input
                              type="checkbox"
                              checked={tmpl.autoSendWhatsapp}
                              onChange={(e) =>
                                updateNotificationTemplate(tmpl.id, {
                                  autoSendWhatsapp: e.target.checked,
                                })
                              }
                              className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                            />
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                            <span>WhatsApp</span>
                          </label>

                          <button
                            onClick={() => {
                              setTestModalTemplate(tmpl);
                              setTestModalChannel('email');
                            }}
                            className="p-1 sm:p-1.5 text-xs rounded bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 transition flex items-center gap-1 ml-1"
                            title="Quick Test Send"
                          >
                            <Send className="w-3 h-3" />
                            <span className="text-[11px]">Test</span>
                          </button>
                        </div>
                      </div>

                      {/* Template Body Editor Expanded */}
                      {isExpanded && (
                        <div className="p-3 sm:p-5 bg-slate-950/70 border-t border-slate-850 space-y-4 sm:space-y-5 w-full max-w-full min-w-0">
                          {/* Channel Selector Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-800 w-full max-w-full min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto min-w-0">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                                Edit Channel:
                              </span>
                              <div className="flex items-center gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800 overflow-x-auto max-w-full scrollbar-thin touch-pan-x overscroll-x-contain">
                                <button
                                  onClick={() => setTemplateChannel(tmpl.id, 'email')}
                                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs font-medium rounded-lg transition whitespace-nowrap shrink-0 ${
                                    channel === 'email'
                                      ? 'bg-indigo-600 text-white shadow-sm'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  Email Template
                                </button>
                                <button
                                  onClick={() => setTemplateChannel(tmpl.id, 'sms')}
                                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs font-medium rounded-lg transition whitespace-nowrap shrink-0 ${
                                    channel === 'sms'
                                      ? 'bg-amber-600 text-white shadow-sm'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  <Smartphone className="w-3.5 h-3.5" />
                                  SMS Template
                                </button>
                                <button
                                  onClick={() => setTemplateChannel(tmpl.id, 'whatsapp')}
                                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs font-medium rounded-lg transition whitespace-nowrap shrink-0 ${
                                    channel === 'whatsapp'
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  WhatsApp Template
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
                              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={tmpl.attachPdf || false}
                                  onChange={(e) =>
                                    updateNotificationTemplate(tmpl.id, {
                                      attachPdf: e.target.checked,
                                    })
                                  }
                                  className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                                />
                                <span className="text-xs">Auto-Attach PDF</span>
                              </label>

                              <button
                                onClick={() => resetNotificationTemplate(tmpl.id)}
                                className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
                                title="Reset this template"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Reset
                              </button>
                            </div>
                          </div>

                          {/* ================================================= */}
                          {/* CHANNEL 1: EMAIL TEMPLATE EDITOR                  */}
                          {/* ================================================= */}
                          {channel === 'email' && (
                            <div className="space-y-4">
                              {/* Subject */}
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <label className="text-xs font-semibold text-slate-300">
                                    Email Subject <span className="text-rose-400">*</span>
                                  </label>
                                  <span className="text-[11px] text-slate-400">
                                    Tags allowed in subject line
                                  </span>
                                </div>
                                <input
                                  type="text"
                                  value={tmpl.emailSubject}
                                  onChange={(e) =>
                                    updateNotificationTemplate(tmpl.id, {
                                      emailSubject: e.target.value,
                                    })
                                  }
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                                  placeholder="Enter email subject line..."
                                />
                              </div>

                              {/* CC / BCC Row */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs font-semibold text-slate-400 mb-1 block">
                                    Email CC (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={tmpl.emailCc || ''}
                                    onChange={(e) =>
                                      updateNotificationTemplate(tmpl.id, {
                                        emailCc: e.target.value,
                                      })
                                    }
                                    placeholder="e.g. accounting@company.com, manager@pos.com"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-slate-400 mb-1 block">
                                    Email BCC (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={tmpl.emailBcc || ''}
                                    onChange={(e) =>
                                      updateNotificationTemplate(tmpl.id, {
                                        emailBcc: e.target.value,
                                      })
                                    }
                                    placeholder="e.g. audit-archive@company.com"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                              </div>

                              {/* Email Body & HTML Editor */}
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                                    Email Body Content (HTML & Variables)
                                  </label>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setHtmlCodeModePerTemplate((prev) => ({
                                          ...prev,
                                          [tmpl.id]: !prev[tmpl.id],
                                        }))
                                      }
                                      className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded border transition ${
                                        isCodeView
                                          ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                                      }`}
                                    >
                                      {isCodeView ? (
                                        <>
                                          <Eye className="w-3 h-3" /> Visual WYSIWYG
                                        </>
                                      ) : (
                                        <>
                                          <Code className="w-3 h-3" /> HTML Source
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {isCodeView ? (
                                  <textarea
                                    rows={10}
                                    value={tmpl.emailBody}
                                    onChange={(e) =>
                                      updateNotificationTemplate(tmpl.id, {
                                        emailBody: e.target.value,
                                      })
                                    }
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-indigo-500 leading-relaxed"
                                  />
                                ) : (
                                  <div className="space-y-2">
                                    <textarea
                                      rows={9}
                                      value={tmpl.emailBody}
                                      onChange={(e) =>
                                        updateNotificationTemplate(tmpl.id, {
                                          emailBody: e.target.value,
                                        })
                                      }
                                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 leading-relaxed"
                                    />
                                    {/* Live rendered HTML Preview box */}
                                    <div className="p-4 bg-white text-slate-900 rounded-lg border border-slate-300 text-xs shadow-inner">
                                      <div className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200 pb-1 mb-2 tracking-wider">
                                        Live Client Render Preview
                                      </div>
                                      <div
                                        dangerouslySetInnerHTML={{ __html: tmpl.emailBody }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* ================================================= */}
                          {/* CHANNEL 2: SMS TEMPLATE EDITOR                    */}
                          {/* ================================================= */}
                          {channel === 'sms' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-300">
                                  SMS Message Body
                                </label>
                                <span className="text-[11px] text-amber-400 font-mono">
                                  {tmpl.smsBody.length} characters (
                                  {Math.ceil(tmpl.smsBody.length / 160) || 1} SMS part)
                                </span>
                              </div>
                              <textarea
                                rows={4}
                                value={tmpl.smsBody}
                                onChange={(e) =>
                                  updateNotificationTemplate(tmpl.id, {
                                    smsBody: e.target.value,
                                  })
                                }
                                placeholder="Enter SMS text content with dynamic {tags}..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono leading-relaxed"
                              />
                            </div>
                          )}

                          {/* ================================================= */}
                          {/* CHANNEL 3: WHATSAPP TEMPLATE EDITOR               */}
                          {/* ================================================= */}
                          {channel === 'whatsapp' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                  WhatsApp Message Body
                                  <span className="text-[10px] text-emerald-400">
                                    (*bold*, _italic_, ~strike~)
                                  </span>
                                </label>
                                <span className="text-[11px] text-emerald-400 font-mono">
                                  {tmpl.whatsappBody.length} chars
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <textarea
                                    rows={8}
                                    value={tmpl.whatsappBody}
                                    onChange={(e) =>
                                      updateNotificationTemplate(tmpl.id, {
                                        whatsappBody: e.target.value,
                                      })
                                    }
                                    placeholder="Enter WhatsApp template message with {tags} and WhatsApp formatting..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono leading-relaxed h-full"
                                  />
                                </div>
                                {/* WhatsApp phone simulator bubble */}
                                <div className="bg-[#0b141a] p-4 rounded-xl border border-emerald-500/20 flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-[11px] text-emerald-400">
                                      <div className="flex items-center gap-1.5 font-bold">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        WhatsApp Click-to-Chat Simulator
                                      </div>
                                      <span className="text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-300">
                                        Live Template
                                      </span>
                                    </div>
                                    <div className="bg-[#005c4b] text-white p-3 rounded-lg rounded-tr-none text-xs whitespace-pre-wrap leading-relaxed shadow max-w-[95%] ml-auto">
                                      {tmpl.whatsappBody}
                                      <div className="text-[9px] text-emerald-200 text-right mt-1 flex items-center justify-end gap-1">
                                        <span>10:42 AM</span>
                                        <Check className="w-3 h-3 text-emerald-300" />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="pt-3 border-t border-slate-800/80 mt-3 space-y-1.5">
                                    <a
                                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(tmpl.whatsappBody)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition shadow"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      Test in WhatsApp Web / App
                                    </a>
                                    <div className="text-[10px] text-slate-500 text-center">
                                      Encodes message directly into WhatsApp Click-to-Chat
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* ================================================= */}
                          {/* AVAILABLE VARIABLE TAGS CHIP TRAY                */}
                          {/* ================================================= */}
                          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-amber-400" />
                                Available Dynamic Tags (Click any tag to insert):
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Injects real transaction data at runtime
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {tmpl.availableTags.map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => insertTagAtTarget(tmpl, tag, channel, false)}
                                  className="px-2.5 py-1 text-[11px] font-mono rounded bg-slate-950 hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-200 border border-slate-800 hover:border-indigo-500/40 transition flex items-center gap-1"
                                >
                                  <span>{tag}</span>
                                  <span className="text-[9px] text-slate-500">+</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="flex items-center justify-between pt-2">
                            <button
                              onClick={() => {
                                setTestModalTemplate(tmpl);
                                setTestModalChannel(channel);
                              }}
                              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 transition"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Send Test {channel.toUpperCase()}
                            </button>

                            <button
                              onClick={() =>
                                showFlashNotification(`Template "${tmpl.name}" updated and saved`, 'success')
                              }
                              className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition"
                            >
                              <Save className="w-3.5 h-3.5" />
                              Save Changes
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: LIVE INTERACTIVE SIMULATOR                    */}
        {/* ==================================================== */}
        {activeMainTab === 'simulator' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Live Notification Testing & Rendering Simulator
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Select any notification template, customize test recipient details, and inspect the real rendered outputs for Email, SMS and WhatsApp with full variable resolution.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Simulator Controls (Left Column) */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  1. Select Template & Target
                </h3>

                {/* Template picker */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Notification Template
                  </label>
                  <select
                    value={simTemplateId}
                    onChange={(e) => setSimTemplateId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <optgroup label="Customer Notifications">
                      {notificationTemplates
                        .filter((t) => t.category === 'customer_notifications')
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Supplier Notifications">
                      {notificationTemplates
                        .filter((t) => t.category === 'supplier_notifications')
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>

                {/* Channel Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Dispatch Channel
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setSimChannel('email')}
                      className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg border transition ${
                        simChannel === 'email'
                          ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" /> Email
                    </button>
                    <button
                      onClick={() => setSimChannel('sms')}
                      className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg border transition ${
                        simChannel === 'sms'
                          ? 'bg-amber-600/20 text-amber-300 border-amber-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" /> SMS
                    </button>
                    <button
                      onClick={() => setSimChannel('whatsapp')}
                      className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg border transition ${
                        simChannel === 'whatsapp'
                          ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                    </button>
                  </div>
                </div>

                {/* Recipient Source */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Recipient Source
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => setSimRecipientType('customer')}
                      className={`flex-1 py-1.5 text-xs font-medium rounded border ${
                        simRecipientType === 'customer'
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      Customer
                    </button>
                    <button
                      onClick={() => setSimRecipientType('supplier')}
                      className={`flex-1 py-1.5 text-xs font-medium rounded border ${
                        simRecipientType === 'supplier'
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      Supplier
                    </button>
                    <button
                      onClick={() => setSimRecipientType('custom')}
                      className={`flex-1 py-1.5 text-xs font-medium rounded border ${
                        simRecipientType === 'custom'
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      Custom
                    </button>
                  </div>

                  {simRecipientType === 'customer' && (
                    <select
                      value={simSelectedContactId}
                      onChange={(e) => setSimSelectedContactId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                    >
                      <option value="">-- Choose Customer --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.phone})
                        </option>
                      ))}
                    </select>
                  )}

                  {simRecipientType === 'supplier' && (
                    <select
                      value={simSelectedContactId}
                      onChange={(e) => setSimSelectedContactId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                    >
                      <option value="">-- Choose Supplier --</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.phone})
                        </option>
                      ))}
                    </select>
                  )}

                  {simRecipientType === 'custom' && (
                    <div className="space-y-2 mt-2">
                      <input
                        type="text"
                        placeholder="Recipient Name"
                        value={simCustomName}
                        onChange={(e) => setSimCustomName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100"
                      />
                      <input
                        type="email"
                        placeholder="Recipient Email"
                        value={simCustomEmail}
                        onChange={(e) => setSimCustomEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100"
                      />
                      <input
                        type="text"
                        placeholder="Recipient Phone / WhatsApp"
                        value={simCustomPhone}
                        onChange={(e) => setSimCustomPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100"
                      />
                    </div>
                  )}
                </div>

                {/* Dispatch Trigger Button */}
                <button
                  disabled={simSending}
                  onClick={async () => {
                    if (simChannel === 'email') {
                      if (!validateEmail(simCustomEmail)) {
                        setSimLastResult({
                          success: false,
                          message: `Email Address Error: Please enter a valid email address with a proper domain (e.g. name@mail.com).`,
                          channel: 'email',
                        });
                        return;
                      }
                    }
                    setSimSending(true);
                    setSimLastResult(null);
                    try {
                      const res = await sendNotification({
                        templateType: currentSimTemplate.templateType,
                        customRecipient: {
                          name: simCustomName,
                          email: simCustomEmail,
                          phone: simCustomPhone,
                        },
                        channel: simChannel,
                      });
                      setSimLastResult({
                        success: res.success,
                        message: res.message,
                        previewUrl: res.previewUrl,
                        directUrl: res.directUrl,
                        channel: simChannel,
                      });
                    } catch (err: any) {
                      setSimLastResult({
                        success: false,
                        message: err.message || 'Error executing test send',
                        channel: simChannel,
                      });
                    } finally {
                      setSimSending(false);
                    }
                  }}
                  className="w-full py-2.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
                >
                  {simSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Connecting & Dispatching {simChannel.toUpperCase()}...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Dispatch Test {simChannel.toUpperCase()} Notification
                    </>
                  )}
                </button>

                {/* Live Feedback Banner */}
                {simLastResult && (
                  <div
                    className={`p-3 rounded-lg border text-xs space-y-2 ${
                      simLastResult.success
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {simLastResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold">{simLastResult.message}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {simLastResult.directUrl && simLastResult.channel === 'email' && (
                        <a
                          href={simLastResult.directUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-500 transition shadow"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open in Gmail / Email Client
                        </a>
                      )}

                      {simLastResult.directUrl && simLastResult.channel === 'whatsapp' && (
                        <a
                          href={simLastResult.directUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-500 transition shadow"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Send on WhatsApp Web / Mobile
                        </a>
                      )}

                      {simLastResult.previewUrl && (
                        <a
                          href={simLastResult.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-semibold hover:bg-slate-700 transition"
                        >
                          <Eye className="w-3 h-3 text-amber-400" />
                          View Web Test Inbox
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Render Preview Mockup (Right Column) */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-indigo-400" />
                      Live Render Output ({simChannel.toUpperCase()})
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                      All Tags Interpolated
                    </span>
                  </div>

                  {/* Email Preview */}
                  {simChannel === 'email' && (
                    <div className="bg-white text-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-200">
                      <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 space-y-1 text-xs">
                        <div>
                          <strong className="text-slate-500">From:</strong> {settings.name} &lt;{settings.email || 'billing@royalpos.com'}&gt;
                        </div>
                        <div>
                          <strong className="text-slate-500">To:</strong> {renderSimPreview(currentSimTemplate, 'email').contactName} &lt;{renderSimPreview(currentSimTemplate, 'email').contactEmail}&gt;
                        </div>
                        <div>
                          <strong className="text-slate-500">Subject:</strong>{' '}
                          <span className="font-semibold text-slate-900">
                            {renderSimPreview(currentSimTemplate, 'email').subject}
                          </span>
                        </div>
                      </div>
                      <div
                        className="p-5 text-xs text-slate-800 leading-relaxed min-h-[220px]"
                        dangerouslySetInnerHTML={{
                          __html: renderSimPreview(currentSimTemplate, 'email').emailBody,
                        }}
                      />
                    </div>
                  )}

                  {/* SMS Preview */}
                  {simChannel === 'sms' && (
                    <div className="max-w-md mx-auto bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3">
                      <div className="text-center text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                        SMS Recipient: {renderSimPreview(currentSimTemplate, 'sms').contactPhone}
                      </div>
                      <div className="bg-indigo-600 text-white p-3.5 rounded-2xl rounded-tr-none text-xs leading-relaxed shadow">
                        {renderSimPreview(currentSimTemplate, 'sms').smsBody}
                        <div className="text-[9px] text-indigo-200 text-right mt-1.5">
                          Just now
                        </div>
                      </div>
                    </div>
                  )}

                  {/* WhatsApp Preview */}
                  {simChannel === 'whatsapp' && (() => {
                    const waPreview = renderSimPreview(currentSimTemplate, 'whatsapp');
                    const cleanPhone = (waPreview.contactPhone || '').replace(/[^0-9]/g, '');
                    const waDirectUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(waPreview.whatsappBody)}`;
                    return (
                      <div className="max-w-md mx-auto bg-[#0b141a] p-4 rounded-2xl border border-emerald-500/30 shadow-xl space-y-3">
                        <div className="flex items-center justify-between text-[11px] text-emerald-400 border-b border-slate-800 pb-2">
                          <span className="font-semibold">WhatsApp Business Target:</span>
                          <span className="font-mono">{waPreview.contactPhone}</span>
                        </div>
                        <div className="bg-[#005c4b] text-white p-3.5 rounded-2xl rounded-tr-none text-xs whitespace-pre-wrap leading-relaxed shadow">
                          {waPreview.whatsappBody}
                          <div className="text-[9px] text-emerald-200 text-right mt-1.5 flex items-center justify-end gap-1">
                            <span>10:48 AM</span>
                            <Check className="w-3 h-3 text-emerald-300" />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 space-y-2">
                          <a
                            href={waDirectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-900/40"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Open in WhatsApp Web / Mobile (Click-to-Chat)
                          </a>
                          <p className="text-[10px] text-slate-400 text-center">
                            Pre-loads the selected recipient and interpolated template text directly into WhatsApp
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: GATEWAY & SMTP CONFIGURATION                  */}
        {/* ==================================================== */}
        {activeMainTab === 'gateways' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-400" />
                  Gateway Dispatch & Real Mail Delivery Settings
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure live SMTP mailers, test server handshakes, and dispatch actual emails directly to your Gmail inbox or recipients.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveGateways}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition shadow"
                >
                  <Save className="w-4 h-4" />
                  Save Gateway Settings
                </button>
              </div>
            </div>

            {/* REAL EMAIL & SMTP DIAGNOSTICS SUITE */}
            <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-5 space-y-4 shadow-lg shadow-indigo-950/30">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
                  <Zap className="w-5 h-5 text-amber-400" />
                  Live SMTP Connection Tester & Real Email Dispatcher
                </div>
                <div className="text-[11px] text-slate-400">
                  Sends actual live emails to verify inbox delivery
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Connection Verifier */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    Step 1: Test SMTP Server Handshake
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Verifies whether the hostname, port, username, and password credentials can establish a secured socket connection.
                  </p>
                  <button
                    disabled={isTestingSmtp}
                    onClick={handleTestSmtpConnection}
                    className="w-full py-2 px-3 text-xs font-bold rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    {isTestingSmtp ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        Handshaking with {smtpDraft.host || 'SMTP Host'}...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        Verify SMTP Handshake Connection
                      </>
                    )}
                  </button>

                  {smtpVerificationStatus && (
                    <div
                      className={`p-3 rounded-lg border text-xs space-y-1 ${
                        smtpVerificationStatus.success
                          ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-950/50 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      <div className="font-semibold">{smtpVerificationStatus.message}</div>
                      {smtpVerificationStatus.tip && (
                        <div className="text-[11px] text-slate-400">{smtpVerificationStatus.tip}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Real Mail Sender */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-400" />
                    Step 2: Send Real Test Email to Inbox
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Recipient Email (e.g. your personal Gmail)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={liveTestEmailRecipient}
                        onChange={(e) => setLiveTestEmailRecipient(e.target.value)}
                        placeholder="buyeez2024@gmail.com"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                      />
                      <button
                        disabled={isSendingLiveSmtpTest}
                        onClick={handleSendLiveSmtpTest}
                        className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-1.5 transition shadow"
                      >
                        {isSendingLiveSmtpTest ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        Send Real Email
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-400">Direct fallback:</span>
                    <a
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(liveTestEmailRecipient)}&su=${encodeURIComponent('Test Notification from POS ERP')}&body=${encodeURIComponent('Hello! Testing notification email from POS ERP.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open Directly in Gmail Web
                    </a>
                  </div>

                  {liveSmtpTestResult && (
                    <div
                      className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                        liveSmtpTestResult.success
                          ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-950/50 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      <div className="font-semibold">{liveSmtpTestResult.message}</div>
                      {liveSmtpTestResult.tip && (
                        <div className="text-[11px] text-slate-400">{liveSmtpTestResult.tip}</div>
                      )}
                      {liveSmtpTestResult.previewUrl && (
                        <a
                          href={liveSmtpTestResult.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:underline font-bold mt-1"
                        >
                          <Eye className="w-3 h-3" /> View Test Inbox Web Email
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Gmail & SMTP Setup Guide Callout */}
              <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-lg p-3.5 text-xs text-slate-300 space-y-1.5">
                <div className="font-bold text-indigo-300 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-400" />
                  How to configure Gmail to receive & send live emails:
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  1. Set <strong>SMTP Host:</strong> <code className="text-slate-200">smtp.gmail.com</code> &middot; <strong>Port:</strong> <code className="text-slate-200">587</code> &middot; <strong>Encryption:</strong> <code className="text-slate-200">TLS</code><br />
                  2. Set <strong>Username:</strong> Your full Gmail address (e.g. <code className="text-slate-200">yourname@gmail.com</code>)<br />
                  3. Set <strong>Password:</strong> Generate a 16-character <strong>Google App Password</strong> (from <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline font-semibold">myaccount.google.com/apppasswords</a> with 2-Step Verification enabled).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 1. SMTP Mail Server */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-slate-200 font-semibold text-sm">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  Email SMTP Server Credentials
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">
                    Mail Driver
                  </label>
                  <select
                    value={smtpDraft.mailDriver}
                    onChange={(e) => setSmtpDraft({ ...smtpDraft, mailDriver: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="smtp">SMTP (Recommended for Gmail, SendGrid, Amazon SES)</option>
                    <option value="sendmail">Sendmail</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={smtpDraft.host}
                    onChange={(e) => setSmtpDraft({ ...smtpDraft, host: e.target.value })}
                    placeholder="e.g. smtp.gmail.com or smtp.sendgrid.net"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">Port</label>
                    <input
                      type="number"
                      value={smtpDraft.port}
                      onChange={(e) => setSmtpDraft({ ...smtpDraft, port: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">
                      Encryption
                    </label>
                    <select
                      value={smtpDraft.encryption}
                      onChange={(e) =>
                        setSmtpDraft({ ...smtpDraft, encryption: e.target.value as any })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                    >
                      <option value="tls">TLS (Port 587 - Gmail)</option>
                      <option value="ssl">SSL (Port 465)</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">
                    Username / Gmail Address
                  </label>
                  <input
                    type="text"
                    value={smtpDraft.username}
                    onChange={(e) => setSmtpDraft({ ...smtpDraft, username: e.target.value })}
                    placeholder="yourname@gmail.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">
                    Password / App Password
                  </label>
                  <input
                    type="password"
                    value={smtpDraft.password}
                    onChange={(e) => setSmtpDraft({ ...smtpDraft, password: e.target.value })}
                    placeholder="16-character App Password"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">
                    From Address
                  </label>
                  <input
                    type="email"
                    value={smtpDraft.fromAddress}
                    onChange={(e) => setSmtpDraft({ ...smtpDraft, fromAddress: e.target.value })}
                    placeholder="notifications@yourdomain.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>
              </div>

              {/* 2. SMS Gateway Configuration */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-slate-200 font-semibold text-sm">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  SMS Gateway
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">
                    SMS Service Provider
                  </label>
                  <select
                    value={smsDraft.gateway}
                    onChange={(e) => setSmsDraft({ ...smsDraft, gateway: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="twilio">Twilio Programmable SMS</option>
                    <option value="nexmo">Vonage (Nexmo)</option>
                    <option value="custom_http">Custom HTTP Gateway / Webhook</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">
                    Account SID / API Key
                  </label>
                  <input
                    type="text"
                    value={smsDraft.apiKey}
                    onChange={(e) => setSmsDraft({ ...smsDraft, apiKey: e.target.value })}
                    placeholder="Enter Account SID"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">
                    Auth Token / Secret
                  </label>
                  <input
                    type="password"
                    value={smsDraft.apiSecret}
                    onChange={(e) => setSmsDraft({ ...smsDraft, apiSecret: e.target.value })}
                    placeholder="Enter Auth Token"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">
                    Sender ID / Virtual Number
                  </label>
                  <input
                    type="text"
                    value={smsDraft.senderId}
                    onChange={(e) => setSmsDraft({ ...smsDraft, senderId: e.target.value })}
                    placeholder="ROYALPOS"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>

                {smsDraft.gateway === 'custom_http' && (
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">
                      Custom HTTP URL Pattern
                    </label>
                    <textarea
                      rows={2}
                      value={smsDraft.customUrl}
                      onChange={(e) => setSmsDraft({ ...smsDraft, customUrl: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                )}
              </div>

              {/* 3. WhatsApp Cloud API */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-slate-200 font-semibold text-sm">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  WhatsApp Business Gateway
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">
                    API Provider
                  </label>
                  <select
                    value={whatsappDraft.provider}
                    onChange={(e) => setWhatsappDraft({ ...whatsappDraft, provider: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="meta_cloud">Meta Official WhatsApp Cloud API</option>
                    <option value="twilio_wa">Twilio WhatsApp Business</option>
                    <option value="custom_wa">Direct WhatsApp Web / Click to Chat</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">
                    Phone Number ID
                  </label>
                  <input
                    type="text"
                    value={whatsappDraft.phoneNumberId}
                    onChange={(e) =>
                      setWhatsappDraft({ ...whatsappDraft, phoneNumberId: e.target.value })
                    }
                    placeholder="e.g. 109283746192834"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">
                    WhatsApp Business Account ID (WABA ID)
                  </label>
                  <input
                    type="text"
                    value={whatsappDraft.wabaId}
                    onChange={(e) => setWhatsappDraft({ ...whatsappDraft, wabaId: e.target.value })}
                    placeholder="e.g. 849201948271049"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">
                    Permanent Access Token
                  </label>
                  <input
                    type="password"
                    value={whatsappDraft.accessToken}
                    onChange={(e) =>
                      setWhatsappDraft({ ...whatsappDraft, accessToken: e.target.value })
                    }
                    placeholder="EAAQZCV..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>

                <div className="pt-2">
                  <a
                    href="https://api.whatsapp.com/send?phone=15551234567&text=Testing%20Royal%20POS%20ERP%20WhatsApp%20Integration"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 text-xs font-bold rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 flex items-center justify-center gap-2 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Test WhatsApp Web Launch
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: DELIVERY AUDIT LOGS                           */}
        {/* ==================================================== */}
        {activeMainTab === 'logs' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-400" />
                  Notification Delivery & Audit Logs
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Real-time history of dispatched transactional notifications with direct delivery previews and launch links.
                </p>
              </div>

              {notificationLogs.length > 0 && (
                <button
                  onClick={clearNotificationLogs}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/30 transition"
                >
                  Clear Logs
                </button>
              )}
            </div>

            {notificationLogs.length === 0 ? (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-300">No Notification Logs Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  When sales, purchase orders, or manual test notifications trigger, their transmission logs will appear here.
                </p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm w-full max-w-full min-w-0">
                <div className="overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-thin w-full max-w-full min-w-0">
                  <table className="w-full text-left text-xs min-w-[680px] sm:min-w-[740px] border-collapse">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3.5 whitespace-nowrap">Timestamp</th>
                        <th className="p-3.5 whitespace-nowrap">Template</th>
                        <th className="p-3.5 whitespace-nowrap">Channel</th>
                        <th className="p-3.5 whitespace-nowrap">Recipient</th>
                        <th className="p-3.5 whitespace-nowrap">Contact Target</th>
                        <th className="p-3.5 whitespace-nowrap">Status</th>
                        <th className="p-3.5 text-right whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {notificationLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-850 transition">
                          <td className="p-3.5 text-slate-400 font-mono whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString()} &middot;{' '}
                            {new Date(log.timestamp).toLocaleDateString()}
                          </td>
                          <td className="p-3.5 font-semibold text-slate-200 whitespace-nowrap">
                            {log.templateType.replace(/_/g, ' ').toUpperCase()}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                log.channel === 'email'
                                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                  : log.channel === 'whatsapp'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {log.channel}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-200 whitespace-nowrap">{log.recipientName}</td>
                          <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap">{log.recipientContact}</td>
                          <td className="p-3.5 whitespace-nowrap">
                            {log.status === 'sent' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Delivered
                              </span>
                            ) : log.status === 'failed' ? (
                              <span className="inline-flex items-center gap-1 text-rose-400 font-medium" title={log.errorDetails}>
                                <AlertCircle className="w-3.5 h-3.5" />
                                Failed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Queued
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {log.directUrl && (
                                <a
                                  href={log.directUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 text-[11px] font-semibold flex items-center gap-1 border border-slate-700"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  {log.channel === 'email' ? 'Gmail' : log.channel === 'whatsapp' ? 'WhatsApp' : 'Open'}
                                </a>
                              )}

                              {log.previewUrl && (
                                <a
                                  href={log.previewUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[11px] font-semibold flex items-center gap-1 border border-amber-500/30"
                                >
                                  <Eye className="w-3 h-3" />
                                  Preview
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-2.5 sm:hidden text-center text-[10px] font-medium text-slate-400 bg-slate-950/70 border-t border-slate-800">
                  ⇄ Swipe table horizontally to view all delivery log details & actions
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Test Modal / Drawer */}
      {testModalTemplate && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-400" />
                Test Send: {testModalTemplate.name}
              </h3>
              <button
                onClick={() => {
                  setTestModalTemplate(null);
                  setTestModalResult(null);
                }}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Test Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTestModalChannel('email')}
                    className={`py-1.5 rounded border text-xs font-semibold ${
                      testModalChannel === 'email'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Email
                  </button>
                  <button
                    onClick={() => setTestModalChannel('sms')}
                    className={`py-1.5 rounded border text-xs font-semibold ${
                      testModalChannel === 'sms'
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    SMS
                  </button>
                  <button
                    onClick={() => setTestModalChannel('whatsapp')}
                    className={`py-1.5 rounded border text-xs font-semibold ${
                      testModalChannel === 'whatsapp'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    WhatsApp
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Recipient Name</label>
                <input
                  type="text"
                  value={testModalRecipient.name}
                  onChange={(e) =>
                    setTestModalRecipient({ ...testModalRecipient, name: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100"
                />
              </div>

              {testModalChannel === 'email' ? (
                <div>
                  <label className="text-slate-400 block mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={testModalRecipient.email}
                    onChange={(e) =>
                      setTestModalRecipient({ ...testModalRecipient, email: e.target.value })
                    }
                    placeholder="buyeez2024@gmail.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-slate-400 block mb-1">Recipient Phone Number / WhatsApp</label>
                  <input
                    type="text"
                    value={testModalRecipient.phone}
                    onChange={(e) =>
                      setTestModalRecipient({ ...testModalRecipient, phone: e.target.value })
                    }
                    placeholder="+1 (555) 432-8765"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100"
                  />
                </div>
              )}

              {/* Feedback details in modal if sent */}
              {testModalResult && (
                <div
                  className={`p-3 rounded-lg border text-xs space-y-2 ${
                    testModalResult.success
                      ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/50 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {testModalResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold">{testModalResult.message}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {testModalResult.directUrl && testModalResult.channel === 'email' && (
                      <a
                        href={testModalResult.directUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-500 transition shadow"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open in Gmail / Email App
                      </a>
                    )}

                    {testModalResult.directUrl && testModalResult.channel === 'whatsapp' && (
                      <a
                        href={testModalResult.directUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-500 transition shadow"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Send on WhatsApp Web
                      </a>
                    )}

                    {testModalResult.previewUrl && (
                      <a
                        href={testModalResult.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-semibold hover:bg-slate-700 transition"
                      >
                        <Eye className="w-3 h-3 text-amber-400" />
                        View Web Test Inbox
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800 flex-wrap">
              <button
                onClick={() => {
                  setTestModalTemplate(null);
                  setTestModalResult(null);
                }}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 font-semibold"
              >
                Close
              </button>

              {testModalChannel === 'whatsapp' && (
                <a
                  href={`https://api.whatsapp.com/send?phone=${encodeURIComponent((testModalRecipient.phone || '').replace(/[^0-9]/g, ''))}&text=${encodeURIComponent(testModalTemplate.whatsappBody)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition shadow"
                  title="Open WhatsApp Web / Mobile directly with template pre-filled"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open WhatsApp Web Instantly
                </a>
              )}

              <button
                disabled={isSendingTest}
                onClick={async () => {
                  if (testModalChannel === 'sms' || testModalChannel === 'whatsapp') {
                    const phoneVal = validatePhoneNumber(testModalRecipient.phone, true);
                    if (!phoneVal.isValid) {
                      setTestModalResult({
                        success: false,
                        message: `Phone Number Error: ${phoneVal.error}`,
                        channel: testModalChannel,
                        recipientContact: testModalRecipient.phone,
                      });
                      return;
                    }
                  }

                  if (testModalChannel === 'email') {
                    if (!validateEmail(testModalRecipient.email)) {
                      setTestModalResult({
                        success: false,
                        message: `Email Address Error: Please enter a valid email address with a proper domain (e.g. name@mail.com).`,
                        channel: 'email',
                        recipientContact: testModalRecipient.email,
                      });
                      return;
                    }
                  }

                  setIsSendingTest(true);
                  setTestModalResult(null);
                  try {
                    const res = await sendNotification({
                      templateType: testModalTemplate.templateType,
                      customRecipient: testModalRecipient,
                      channel: testModalChannel,
                    });
                    setTestModalResult({
                      success: res.success,
                      message: res.message,
                      previewUrl: res.previewUrl,
                      directUrl: res.directUrl,
                      channel: testModalChannel,
                      recipientContact: testModalChannel === 'email' ? testModalRecipient.email : testModalRecipient.phone,
                    });
                  } catch (err: any) {
                    setTestModalResult({
                      success: false,
                      message: err.message || 'Failed to dispatch test notification',
                      channel: testModalChannel,
                      recipientContact: testModalChannel === 'email' ? testModalRecipient.email : testModalRecipient.phone,
                    });
                  } finally {
                    setIsSendingTest(false);
                  }
                }}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-1.5 transition shadow"
              >
                {isSendingTest ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Sending Real {testModalChannel.toUpperCase()}...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Send Real {testModalChannel.toUpperCase()}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
