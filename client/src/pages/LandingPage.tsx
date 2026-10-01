import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Calendar, Activity, Receipt, Package, ArrowRight, Check, Heart, Mail, Phone, MapPin } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [formSent, setFormSent] = useState(false);

  const features = [
    { title: 'Interactive FDI Dental Chart', desc: 'Detail teeth status (Decayed, Root Canal, Implant, Crown) in real-time.', icon: Activity },
    { title: 'Smart Appointments Calendar', desc: 'Manage doctor bookings with custom Day, Week, and Month scheduling views.', icon: Calendar },
    { title: 'GST-Compliant Billing', desc: 'Compute taxes (CGST/SGST), apply discounts, print custom clinic invoices.', icon: Receipt },
    { title: 'Multi-Tenant Clinical Records', desc: 'Isolate visits, prescriptions, clinical notes, and X-ray imaging safely.', icon: ShieldCheck },
    { title: 'Real-time Inventory & Alerts', desc: 'Track clinic materials, equipment conditions, and receive expiration alerts.', icon: Package },
  ];

  const plans = [
    {
      name: 'Free Starter',
      price: '₹0',
      period: 'forever',
      features: ['Up to 50 Patients', 'Max 2 Staff Users', 'Basic Scheduling & Calendar', 'Basic Invoicing', 'Standard Support'],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Basic Clinic',
      price: '₹1,499',
      period: 'month',
      features: ['Up to 500 Patients', 'Max 5 Staff Users', 'Interactive FDI Dental Chart', 'Clinical Prescriptions', 'GST Billing & Discounting', 'Payment Records Tracking', 'Priority Email Support'],
      cta: 'Upgrade to Basic',
      popular: true,
    },
    {
      name: 'Pro Practice',
      price: '₹3,499',
      period: 'month',
      features: ['Unlimited Patients', 'Unlimited Staff Users', 'Advanced Clinical Analytics', 'Monthly Operations Reports', 'Excel & PDF Export Support', 'Priority Call Support', 'Custom Branding & Logo'],
      cta: 'Get Pro Access',
      popular: false,
    },
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSent(true);
    setContactName('');
    setContactEmail('');
    setContactMessage('');
    setTimeout(() => setFormSent(false), 5000);
  };

  return (
    <div className="min-h-screen bg-healthcareBg text-slate-800 flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/10">
            D
          </div>
          <span className="font-heading font-bold text-lg text-slate-900">DentaCare</span>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            Login
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/15 transition-all"
          >
            Register Clinic
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="pt-32 pb-20 px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
        <div className="flex flex-col gap-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
            <Heart size={12} className="fill-current" />
            Empowering Indian Dental Practices
          </div>
          <h1 className="font-heading font-bold text-4xl sm:text-5xl text-slate-900 leading-tight">
            The Premium Multi-Tenant SaaS for Modern <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">Dental Clinics</span>
          </h1>
          <p className="text-slate-600 text-base max-w-md leading-relaxed">
            Manage your patient records, FDI dental charts, prescriptions, inventory stock levels, and GST billing seamlessly in one secure platform.
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <Link
              to="/register"
              className="px-6 py-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/10 flex items-center gap-1.5 transition-all"
            >
              Start Free Trial <ArrowRight size={14} />
            </Link>
            <a
              href="#pricing"
              className="px-6 py-3 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
            >
              View Pricing plans
            </a>
          </div>
        </div>

        {/* Visual mock image representation */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl shadow-blue-900/5 relative overflow-hidden hidden lg:block">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="h-80 w-full bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between p-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <span className="w-3 h-3 rounded-full bg-green-400"></span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">DentaCare Dashboard Mock</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              {/* Simplified mock graphics */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                <div className="bg-white border border-slate-100 p-3.5 rounded-2xl flex flex-col gap-1 shadow-sm">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase leading-none">Today Revenue</span>
                  <span className="text-base font-bold text-slate-800 font-heading">₹28,500</span>
                </div>
                <div className="bg-white border border-slate-100 p-3.5 rounded-2xl flex flex-col gap-1 shadow-sm">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase leading-none">Today Patients</span>
                  <span className="text-base font-bold text-slate-800 font-heading">18 Cases</span>
                </div>
                <div className="bg-blue-600 p-3.5 rounded-2xl flex flex-col gap-1 shadow-sm text-white">
                  <span className="text-[10px] text-blue-100 font-semibold uppercase leading-none">Active Staff</span>
                  <span className="text-base font-bold font-heading">5 Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white border-y border-slate-100 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16 flex flex-col gap-2">
            <h2 className="font-heading font-bold text-3xl text-slate-900">Comprehensive Clinical Suite</h2>
            <p className="text-slate-500 text-sm">Everything your dental clinic needs to operate at maximum efficiency.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-slate-800 text-base">{feat.title}</h3>
                    <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-16 flex flex-col gap-2">
          <h2 className="font-heading font-bold text-3xl text-slate-900">Simple, Transparent Pricing</h2>
          <p className="text-slate-500 text-sm">Choose the right plan to scale your dental practice.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((p, idx) => (
            <div
              key={idx}
              className={`bg-white border rounded-3xl p-8 flex flex-col justify-between shadow-sm relative ${
                p.popular ? 'border-blue-500 shadow-xl shadow-blue-500/5 ring-1 ring-blue-500' : 'border-slate-100'
              }`}
            >
              {p.popular && (
                <span className="absolute top-0 right-8 -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow">
                  Most Popular
                </span>
              )}

              <div>
                <h3 className="font-heading font-bold text-slate-800 text-lg mb-2">{p.name}</h3>
                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-3xl font-bold font-heading text-slate-900">{p.price}</span>
                  <span className="text-xs text-slate-400">/ {p.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {p.features.map((feat, fidx) => (
                    <li key={fidx} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <Check size={14} className="text-blue-600 mt-0.5 min-w-[14px]" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to="/register"
                className={`w-full py-2.5 text-xs font-semibold rounded-xl text-center shadow transition-all ${
                  p.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/10'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white border-t border-slate-100 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Info */}
          <div className="flex flex-col gap-6">
            <h2 className="font-heading font-bold text-3xl text-slate-900 leading-tight">
              Get in Touch with our Clinical Success Team
            </h2>
            <p className="text-slate-500 text-sm max-w-md leading-relaxed">
              Have questions about data isolation, subscription plan setup, or multi-tenant billing models? Drop us a message, and our executives will assist you.
            </p>

            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <Mail size={16} />
                </div>
                <span className="text-xs font-semibold">support@dentacare.in</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <Phone size={16} />
                </div>
                <span className="text-xs font-semibold">+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <MapPin size={16} />
                </div>
                <span className="text-xs font-semibold">Delhi, India</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleContactSubmit} className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col gap-4">
            {formSent && (
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 text-xs font-semibold">
                Thank you! Your message has been sent successfully.
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Your Name</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Message</label>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-xs border-t border-slate-800">
        <p>&copy; {new Date().getFullYear()} DentaCare SaaS India. All rights reserved.</p>
        <p className="mt-1 text-slate-600">Built for clinical excellence and absolute patient safety.</p>
      </footer>
    </div>
  );
};
