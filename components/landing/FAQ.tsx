'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export function FAQ() {
  const { t } = useTranslation();
  const [openId, setOpenId] = useState<string | null>('3');

  const faqs: FAQItem[] = [
    {
      id: '1',
      category: 'general',
      question: 'What is Solviq AI?',
      answer: 'Solviq AI is an advanced AI Employability Engine powered by artificial intelligence. It helps job seekers prepare for interviews through mock interviews, AI-powered feedback, resume building, and automated job applications. Solviq doesn\'t just test you — it reads you.',
    },
    {
      id: '2',
      category: 'features',
      question: 'How does the AI Interview Copilot work?',
      answer: 'Our AI Interview Copilot provides real-time assistance during mock interviews. It analyzes your responses, provides instant feedback on your answers, body language, and communication skills, and suggests improvements to help you perform better.',
    },
    {
      id: '3',
      category: 'features',
      question: 'What types of questions are included in the question bank?',
      answer: 'Our question bank includes over 10,000 questions covering technical interviews (coding, system design), behavioral questions, aptitude tests, domain-specific questions, and company-specific interview patterns from top tech companies.',
    },
    {
      id: '4',
      category: 'pricing',
      question: 'Is there a free trial available?',
      answer: 'Yes! We offer a 14-day free trial with access to all basic features. You can practice mock interviews, build your resume, and explore the question bank. No credit card required to start.',
    },
    {
      id: '5',
      category: 'features',
      question: 'How does the AI Job Hunter feature work?',
      answer: 'The AI Job Hunter automatically scans job boards, matches your profile with relevant positions, and applies on your behalf. It customizes each application based on the job requirements and your skills, saving you hours of manual work.',
    },
    {
      id: '6',
      category: 'technical',
      question: 'Is my data secure?',
      answer: 'Absolutely! We take data security seriously. All your personal information, resumes, and practice sessions are encrypted and stored securely. We never share your data with third parties without your explicit consent.',
    },
    {
      id: '7',
      category: 'pricing',
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees. If you cancel, you\'ll have access to premium features until the end of your billing period.',
    },
    {
      id: '8',
      category: 'features',
      question: 'Does SolviQ AI support multiple languages?',
      answer: 'Currently, SolviQ AI supports English, Hindi, and Odia languages. We\'re continuously working to add more languages to make the platform accessible to job seekers across India and beyond.',
    },
    {
      id: '9',
      category: 'general',
      question: 'How effective is SolviQ AI in helping land a job?',
      answer: 'Over 10,000 users have successfully landed jobs using SolviQ AI, with a 95% success rate among active users. The combination of AI-powered practice, real-time feedback, and automated job applications significantly increases your chances.',
    },
    {
      id: '10',
      category: 'technical',
      question: 'What devices can I use SolviQ AI on?',
      answer: 'SolviQ AI is a web-based platform that works on all modern browsers. You can access it from your desktop, laptop, tablet, or smartphone. For the best experience, we recommend using a desktop or laptop with a webcam for mock interviews.',
    },
  ];

  return (
    <section
      id="faq"
      className="section-container relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8 bg-[#BCBCDB] dark:bg-[#1E1E63]"
    >
      {/* Gradient Background for Dark Mode */}
      {/* <div
        className="absolute inset-0 dark:block hidden"
        style={{
          background: 'linear-gradient(135deg, #1A1A1A 0%, #2B354B 50%, #4A3F6B 100%)'
        }}
      /> */}

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
          <p className="text-lg text-[#4A4A4A] dark:text-[#939CAA] leading-relaxed max-w-2xl mx-auto">
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
        <span className="text-lg font-medium pr-8 text-[#1A1A1A] dark:text-[#E1E4EA] group-hover:opacity-80 transition-opacity">
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
      {index < 9 && (
        <div className="h-px w-full bg-[#DCE0E5] dark:bg-[#636363] dark:opacity-100" />
      )}
    </div>
  );
}
