import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Mail, Save, FileText, CheckCircle, Package, Truck, XCircle, Clock, RotateCcw } from 'lucide-react';
import { DEFAULT_TEMPLATES } from '../utils/emailTemplates';

const NotificationsView = () => {
  const { notificationTemplates, updateNotificationTemplates } = useAdmin();
  const [activeTab, setActiveTab] = useState('Pending');
  const [templates, setTemplates] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  useEffect(() => {
    if (notificationTemplates) {
      setTemplates(notificationTemplates);
    }
  }, [notificationTemplates]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    const success = await updateNotificationTemplates(templates);
    if (success) {
      setSaveMessage('Templates saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      setSaveMessage('Failed to save templates. Please try again.');
    }
    setIsSaving(false);
  };

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to reset all templates to their default designs? This will overwrite your current changes.")) {
      setIsSaving(true);
      setSaveMessage(null);
      const success = await updateNotificationTemplates(DEFAULT_TEMPLATES);
      if (success) {
        setTemplates(DEFAULT_TEMPLATES);
        setSaveMessage('Templates reset to defaults successfully!');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage('Failed to reset templates. Please try again.');
      }
      setIsSaving(false);
    }
  };

  const handleTemplateChange = (field, value) => {
    setTemplates(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value
      }
    }));
  };

  const insertPlaceholder = (placeholder) => {
    const currentBody = templates[activeTab]?.body || '';
    handleTemplateChange('body', currentBody + placeholder);
  };

  const tabs = [
    { id: 'Welcome', label: 'Welcome (New Signup)', icon: CheckCircle, color: 'text-pink-500', bg: 'bg-pink-50' },
    { id: 'Pending', label: 'Order Received', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'Prepared', label: 'Packing', icon: Package, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'Out for delivery', label: 'Out for Delivery', icon: Truck, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'Delivered', label: 'Delivered', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'Cancelled', label: 'Cancelled', icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  const placeholders = [
    { id: '[Customer Name]', label: 'Customer Name' },
    { id: '[Email]', label: 'Email' },
    { id: '[Order ID]', label: 'Order ID' },
    { id: '[Amount]', label: 'Total Amount' },
    { id: '[Address]', label: 'Delivery Address' },
    { id: '[Time]', label: 'Order Time' },
    { id: '[Cancel Reason]', label: 'Cancel Reason' },
    { id: '[Order Items]', label: 'Order Items Table' },
  ];

  const currentTemplate = templates[activeTab] || { subject: '', body: '' };

  return (
    <div className="p-6 max-w-6xl mx-auto pb-32">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Mail className="w-8 h-8 text-emerald-600 p-1.5 bg-emerald-100 rounded-lg" />
            Email Notifications
          </h1>
          <p className="text-slate-500 mt-1">Customize the automated emails sent to customers.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            disabled={isSaving}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <RotateCcw className="w-5 h-5" />
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-xl mb-6 font-medium ${saveMessage.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          {saveMessage}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 flex flex-col gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 p-4 rounded-xl text-left transition-all ${
                  isActive 
                    ? `bg-white border-2 border-emerald-500 shadow-sm shadow-emerald-100` 
                    : `bg-white border border-slate-200 hover:border-slate-300 text-slate-600`
                }`}
              >
                <div className={`p-2 rounded-lg ${isActive ? tab.bg : 'bg-slate-100'}`}>
                  <Icon className={`w-5 h-5 ${isActive ? tab.color : 'text-slate-500'}`} />
                </div>
                <span className={`font-semibold ${isActive ? 'text-emerald-900' : ''}`}>{tab.label}</span>
              </button>
            );
          })}
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
            <strong>Note:</strong> All templates are automatically wrapped in a beautiful, branded HTML layout. You just need to focus on the content!
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              Edit "{tabs.find(t => t.id === activeTab)?.label}" Template
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Subject</label>
              <input
                type="text"
                value={currentTemplate.subject || ''}
                onChange={(e) => handleTemplateChange('subject', e.target.value)}
                placeholder="e.g., Order Received – The Grocery Hub"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">Email Body Message</label>
                <div className="flex flex-wrap gap-1">
                  {placeholders.map(p => (
                    <button
                      key={p.id}
                      onClick={() => insertPlaceholder(p.id)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-medium transition-colors"
                      title={`Insert ${p.label}`}
                    >
                      {p.id}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={currentTemplate.body || ''}
                onChange={(e) => handleTemplateChange('body', e.target.value)}
                placeholder="Type your message here..."
                rows={12}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all font-medium whitespace-pre-wrap"
              />
              <p className="text-xs text-slate-400 mt-2">Line breaks will automatically be converted to HTML breaks. You can also use basic HTML like &lt;strong&gt; for bold text.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsView;
