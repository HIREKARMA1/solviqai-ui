'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export function FAQ() {
  const { t } = useTranslation();
  const [openId, setOpenId] = useState<string | null>('3');

  const faqs: FAQItem[] = [
    {
      id: '1',
      question: 'What is Solviq AI?',
      answer: 'Solviq AI is an advanced AI Employability Engine powered by artificial intelligence. It helps job seekers prepare for interviews through mock interviews, AI-powered feedback, resume building, and automated job applications. Solviq doesn\'t just test you — it reads you.',
    },
    {
      id: '2',
      question: 'How does the AI Interview Copilot work?',
      answer: 'Our AI Interview Copilot provides real-time assistance during mock interviews. It analyzes your responses, provides instant feedback on your answers, body language, and communication skills, and suggests improvements to help you perform better.',
    },
    {
      id: '3',
      question: 'How do the updates work?',
      answer: 'We regularly update our platform with new features, questions, and improvements. Updates are automatically applied to your account, and you\'ll receive notifications about major updates. All updates are included in your subscription at no additional cost.',
    },
    {
      id: '4',
      question: 'Is there a free trial available?',
      answer: 'Yes! We offer a 14-day free trial with access to all basic features. You can practice mock interviews, build your resume, and explore the question bank. No credit card required to start.',
    },
    {
      id: '5',
      question: 'How does the AI Job Hunter feature work?',
      answer: 'The AI Job Hunter automatically scans job boards, matches your profile with relevant positions, and applies on your behalf. It customizes each application based on the job requirements and your skills, saving you hours of manual work.',
    },
    {
      id: '6',
      question: 'Is my data secure?',
      answer: 'Absolutely! We take data security seriously. All your personal information, resumes, and practice sessions are encrypted and stored securely. We never share your data with third parties without your explicit consent.',
    },
  ];

  return (
    <section
      id="faq"
      className="section-container relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8 bg-[#BDC0D9] dark:bg-[#310139]"
    >
      {/* Gradient Background for Dark Mode */}
      <div
        className="absolute inset-0 dark:block hidden"
        style={{
          background: 'linear-gradient(135deg, #1A1A1A 0%, #2B354B 50%, #4A3F6B 100%)'
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {/* Title */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-[#1A1A1A] dark:text-white">
            FAQs
          </h2>

          {/* Description */}
          <p className="text-lg text-[#4A4A4A] dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
            {t('faq.subtitle')}
          </p>
        </motion.div>

        {/* FAQ List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full"
        >
          {faqs.map((faq, index) => (
            <FAQItem
              key={faq.id}
              faq={faq}
              index={index}
              isOpen={openId === faq.id}
              onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

interface FAQItemProps {
  faq: FAQItem;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ faq, index, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="relative">
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left transition-colors group"
      >
        <span className="text-lg font-medium pr-8 text-[#1A1A1A] dark:text-white group-hover:opacity-80 transition-opacity">
          {faq.question}
        </span>
        <ChevronDown
          className={cn(
            'w-5 h-5 flex-shrink-0 transition-transform duration-300 ease-in-out',
            isOpen ? 'rotate-180' : '',
            'text-[#1A1A1A] dark:text-white opacity-60'
          )}
        />
      </motion.button>

      {/* Answer Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-6 pt-0 text-[#4A4A4A] dark:text-gray-300 leading-relaxed pr-8">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Separator Line */}
      {index < 5 && (
        <div className="h-px w-full bg-[#1A1A1A] opacity-[0.08] dark:bg-white dark:opacity-[0.1]" />
      )}
    </div>
  );
}
