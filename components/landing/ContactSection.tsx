'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, MapPin, Phone, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';

const fieldClass =
  'w-full rounded-xl border-0 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none ring-1 ring-transparent transition placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900/10 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-white/15';

const labelClass = 'mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300';

export function ContactSection() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const payload = {
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      message: message.trim(),
    };

    if (!payload.full_name || !payload.email || !payload.phone || !payload.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.submitContact(payload);
      toast.success('Message sent! We’ll get back to you soon.');
      setFullName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to send message';
      toast.error(typeof detail === 'string' ? detail : 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="relative scroll-mt-20 overflow-hidden bg-white py-16 dark:bg-gray-950 sm:py-20 lg:scroll-mt-[76px] lg:py-24">
      <div className="relative z-10 mx-auto w-[92%] max-w-[1200px]">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-20">
          {/* Left — info */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              Talk to our support team
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-gray-500 dark:text-gray-400">
              Reach out for help with SolviQ, campus partnerships, placement drives, or any questions about
              your account.
            </p>

            <ul className="mt-10 space-y-5">
              <ContactInfo
                icon={<Mail className="h-5 w-5" />}
                href="mailto:info@hirekarma.in"
                label="info@hirekarma.in"
              />
              <ContactInfo
                icon={<MapPin className="h-5 w-5" />}
                label="2nd Floor, SS Niwas, Hirekarma Private Limited, Raghunathpur, Bhubaneswar, Raghunathpurjali, Odisha 751024"
              />
              <ContactInfo
                icon={<Phone className="h-5 w-5" />}
                href="tel:+919124364764"
                label="+91 91243 64764"
              />
            </ul>
          </motion.div>

          {/* Right — form card */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="rounded-[1.75rem] bg-[#F4F4F4] p-6 dark:bg-gray-900 sm:rounded-[2rem] sm:p-8 lg:p-10"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="contact-name" className={labelClass}>
                  Full Name
                </label>
                <input
                  id="contact-name"
                  className={fieldClass}
                  placeholder="Enter Your Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

              <div>
                <label htmlFor="contact-email" className={labelClass}>
                  Email Address
                </label>
                <input
                  id="contact-email"
                  type="email"
                  className={fieldClass}
                  placeholder="Enter Your Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label htmlFor="contact-phone" className={labelClass}>
                  Phone Number
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  className={fieldClass}
                  placeholder="Enter Your Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  required
                />
              </div>

              <div>
                <label htmlFor="contact-message" className={labelClass}>
                  Message
                </label>
                <textarea
                  id="contact-message"
                  className={cn(fieldClass, 'min-h-[120px] resize-y')}
                  placeholder="Write Your Message Here"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-gray-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    Send Message
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ContactInfo({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
        {icon}
      </span>
      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 sm:text-[15px]">{label}</span>
    </>
  );

  if (href) {
    return (
      <li>
        <a href={href} className="inline-flex items-center gap-3 transition hover:opacity-80">
          {content}
        </a>
      </li>
    );
  }

  return <li className="inline-flex items-start gap-3">{content}</li>;
}
