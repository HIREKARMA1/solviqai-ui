'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { cn } from '@/lib/utils';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'pricing' | 'features' | 'technical';
}

export function FAQ() {
  const { t } = useTranslation();
  const [openId, setOpenId] = useState<string | null>('1');

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

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'general', label: 'General' },
    { id: 'features', label: 'Features' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'technical', label: 'Technical' },
  ];

  const [activeCategory, setActiveCategory] = useState('all');

  const filteredFaqs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  return (
    <section id="faq" className="section-container relative overflow-hidden bg-gray-50 dark:bg-gray-900/50">
      <AnimatedBackground variant="alternate" />
      <div className="text-center mb-16 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900 dark:text-white"
        >
          {t('faq.title')}
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
        >
          {t('faq.subtitle')}
        </motion.p>
      </div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-wrap justify-center gap-3 mb-12"
      >
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={cn(
              'px-6 py-2 rounded-full font-medium transition-all',
              activeCategory === category.id
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {category.label}
          </button>
        ))}
      </motion.div>

      {/* FAQ Accordion */}
      <div className="max-w-4xl mx-auto space-y-4 relative z-10">
        {filteredFaqs.map((faq, index) => (
          <FAQAccordion
            key={faq.id}
            faq={faq}
            index={index}
            isOpen={openId === faq.id}
            onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
          />
        ))}
      </div>
    </section>
  );
}

interface FAQAccordionProps {
  faq: FAQItem;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQAccordion({ faq, index, isOpen, onToggle }: FAQAccordionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="card overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <span className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
          {faq.question}
        </span>
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors',
          isOpen 
            ? 'bg-primary-500 text-white' 
            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
        )}>
          {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 pt-2">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

