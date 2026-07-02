import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Mail, Send, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Card } from '../components/common/Card';

export const Contact: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    
    try {
      const response = await fetch('https://formsubmit.co/ajax/support@airigcheck.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
          _subject: `AIRigCheck Contact: ${form.subject}`,
          _template: 'table',
        }),
      });
      
      if (response.ok) {
        setStatus('success');
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto px-4 py-12"
    >
      <Helmet>
        <title>Contact Us | AIRigCheck</title>
        <meta name="description" content="Get in touch with the AIRigCheck team. Questions, feedback, or partnerships — we'd love to hear from you." />
        <link rel="canonical" href="https://airigcheck.com/contact" />
      </Helmet>

      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft size={16} /> Back to home
      </Link>

      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Mail className="text-blue-600 dark:text-blue-400" size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Get in touch</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Questions, feedback, or partnership inquiries — fill out the form below and we'll get back to you within two business days.
        </p>
      </div>

      <Card className="p-8">
        {status === 'success' ? (
          <div className="text-center py-8">
            <CheckCircle className="text-emerald-500 mx-auto mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Message sent!</h3>
            <p className="text-slate-500">We'll get back to you within two business days.</p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-slate-500">Fields marked with * are required. I aim to reply within two business days.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full name *</label>
                <input
                  type="text"
                  required
                  placeholder="Example: Adeen Amer"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email address *</label>
                <input
                  type="email"
                  required
                  placeholder="Example: name@domain.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subject *</label>
              <input
                type="text"
                required
                placeholder="Example: Product role — intro call"
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Message *</label>
              <textarea
                required
                rows={6}
                placeholder="Example: Context, timing, and what you would like to discuss."
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                className={inputClass}
                style={{ resize: 'vertical' }}
              />
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <AlertCircle size={16} />
                Something went wrong. Please try again or email us directly at support@airigcheck.com
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full py-3 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {status === 'sending' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={16} />
              )}
              {status === 'sending' ? 'Sending...' : 'Send message'}
            </button>
          </form>
        )}
      </Card>

      <div className="text-center mt-6 text-sm text-slate-400">
        Or email directly: <a href="mailto:support@airigcheck.com" className="text-blue-500 hover:underline">support@airigcheck.com</a>
      </div>
    </motion.div>
  );
};
