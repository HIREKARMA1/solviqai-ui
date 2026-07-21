'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItemData {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQS: FAQItemData[] = [
  {
    id: '1',
    category: 'general',
    question: 'What is Solviq AI?',
    answer:
      "Solviq AI is an advanced AI Employability Engine powered by artificial intelligence. It helps job seekers prepare for interviews through mock interviews, AI-powered feedback, resume building, and automated job applications. Solviq doesn't just test you — it reads you.",
  },
  {
    id: '2',
    category: 'features',
    question: 'How does the AI Interview Copilot work?',
    answer:
      'Our AI Interview Copilot provides real-time assistance during mock interviews. It analyzes your responses, provides instant feedback on your answers, body language, and communication skills, and suggests improvements to help you perform better.',
  },
  {
    id: '3',
    category: 'features',
    question: 'What types of questions are included in the question bank?',
    answer:
      'Our question bank includes over 10,000 questions covering technical interviews (coding, system design), behavioral questions, aptitude tests, domain-specific questions, and company-specific interview patterns from top tech companies.',
  },
  {
    id: '4',
    category: 'pricing',
    question: 'Is there a free trial available?',
    answer:
      'Yes! We offer a 14-day free trial with access to all basic features. You can practice mock interviews, build your resume, and explore the question bank. No credit card required to start.',
  },
  {
    id: '5',
    category: 'features',
    question: 'How does the AI Job Hunter feature work?',
    answer:
      'The AI Job Hunter automatically scans job boards, matches your profile with relevant positions, and applies on your behalf. It customizes each application based on the job requirements and your skills, saving you hours of manual work.',
  },
  {
    id: '6',
    category: 'technical',
    question: 'Is my data secure?',
    answer:
      'Absolutely! We take data security seriously. All your personal information, resumes, and practice sessions are encrypted and stored securely. We never share your data with third parties without your explicit consent.',
  },
  {
    id: '7',
    category: 'pricing',
    question: 'Can I cancel my subscription anytime?',
    answer:
      "Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees. If you cancel, you'll have access to premium features until the end of your billing period.",
  },
  {
    id: '8',
    category: 'features',
    question: 'Does SolviQ AI support multiple languages?',
    answer:
      "Currently, SolviQ AI supports English, Hindi, and Odia languages. We're continuously working to add more languages to make the platform accessible to job seekers across India and beyond.",
  },
  {
    id: '9',
    category: 'general',
    question: 'How effective is SolviQ AI in helping land a job?',
    answer:
      'Over 10,000 users have successfully landed jobs using SolviQ AI, with a 95% success rate among active users. The combination of AI-powered practice, real-time feedback, and automated job applications significantly increases your chances.',
  },
  {
    id: '10',
    category: 'technical',
    question: 'What devices can I use SolviQ AI on?',
    answer:
      'SolviQ AI is a web-based platform that works on all modern browsers. You can access it from your desktop, laptop, tablet, or smartphone. For the best experience, we recommend using a desktop or laptop with a webcam for mock interviews.',
  },
];

export function FAQ() {
  const [openId, setOpenId] = useState<string | null>('1');

  return (
    <section
      id="faq"
      className="relative scroll-mt-20 overflow-hidden bg-[#EEF1F8] py-16 dark:bg-gray-950 sm:py-20 lg:scroll-mt-[76px] lg:py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(30,123,255,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(30,123,255,0.12),transparent_50%)]" />

      <div className="relative z-10 mx-auto flex w-[92%] max-w-3xl flex-col items-center px-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center sm:mb-12"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
            Trusted by
          </p>
          <h2 className="text-4xl font-bold leading-[1.15] tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-[3.25rem]">
            Frequently Asked
            <span className="block">Questions</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex w-full flex-col gap-3 sm:gap-3.5"
        >
          {FAQS.map((faq, index) => (
            <FAQAccordionItem
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

interface FAQAccordionItemProps {
  faq: FAQItemData;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQAccordionItem({ faq, index, isOpen, onToggle }: FAQAccordionItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.35) }}
      className={cn(
        'overflow-hidden rounded-[1.35rem] transition-colors duration-300 sm:rounded-[1.75rem]',
        isOpen
          ? 'bg-white shadow-[0_8px_28px_rgba(15,23,42,0.06)] dark:bg-gray-900 dark:shadow-[0_8px_28px_rgba(0,0,0,0.35)]'
          : 'bg-[#DCE3F4] dark:bg-gray-800/80',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-start gap-4 px-5 py-4 text-left sm:items-center sm:px-6 sm:py-5"
      >
        <span className="min-w-0 flex-1 text-base font-semibold leading-snug text-gray-900 dark:text-white sm:text-lg">
          {faq.question}
        </span>

        <span
          className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors sm:mt-0 sm:h-9 sm:w-9',
            isOpen
              ? 'bg-[#DCE3F4] text-gray-800 dark:bg-gray-700 dark:text-white'
              : 'bg-white text-gray-800 shadow-sm dark:bg-gray-900 dark:text-white',
          )}
          aria-hidden
        >
          {isOpen ? <X className="h-4 w-4" strokeWidth={2.25} /> : <Plus className="h-4 w-4" strokeWidth={2.25} />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:px-6 sm:pb-6 sm:text-[15px] sm:leading-7">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
