'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  Heart
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import toast from 'react-hot-toast';
import { AnimatedBackground } from '@/components/ui/animated-background';

// Define which pages exist and which are coming soon
const EXISTING_PAGES = ['/#faq', '/auth/login', '/release-notes', '/privacy'];

export function Footer() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLinkClick = (href: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    // Check if it's an external link or contact page
    if (href.startsWith('http') || href === 'https://www.hirekarma.in/contact') {
      return; // Allow external links
    }

    // Check if page exists
    if (EXISTING_PAGES.includes(href) || href.startsWith('/dashboard') || href.startsWith('/auth')) {
      return; // Allow existing pages
    }

    // Show coming soon alert for non-existent pages
    e.preventDefault();
    toast('🚀 Coming Soon! This page is under development.', {
      icon: '⏳',
      duration: 3000,
    });
  };

  const productLinks = [
    { label: 'Mock Interview', href: '/features/mock-interview' },
    { label: 'AI Copilot', href: '/features/copilot' },
    { label: 'Resume Builder', href: '/features/resume' },
    { label: 'Job Hunter', href: '/features/jobs' },
    { label: 'Question Bank', href: '/features/questions' },
    { label: 'Analytics', href: '/features/analytics' },
  ];

  const companyLinks = [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Blog', href: '/blog' },
    { label: 'Press', href: '/press' },
    { label: 'Partners', href: '/partners' },
  ];

  const supportLinks = [
    { label: 'Help Center', href: '/help' },
    { label: 'Contact Us', href: 'https://www.hirekarma.in/contact' },
    { label: 'FAQ', href: '/#faq' },
    { label: 'Community', href: '/community' },
    { label: 'Tutorials', href: '/tutorials' },
  ];

  const legalLinks = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Refund Policy', href: '/refund' },
    { label: 'Release Notes', href: '/release-notes' },
  ];

  const socialLinks = [
    { 
      icon: <Facebook className="w-5 h-5" />, 
      href: 'https://www.facebook.com/Hirekarma/', 
      label: 'Facebook' 
    },
    { 
      icon: <Twitter className="w-5 h-5" />, 
      href: 'https://x.com/hirekarma', 
      label: 'Twitter' 
    },
    { 
      icon: <Linkedin className="w-5 h-5" />, 
      href: 'https://www.linkedin.com/company/hirekarma-pvt-ltd', 
      label: 'LinkedIn' 
    },
    { 
      icon: <Instagram className="w-5 h-5" />, 
      href: 'https://www.instagram.com/hirekarma/', 
      label: 'Instagram' 
    },
  ];

  return (
    <footer className="relative bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-[0_-1px_2px_0_rgba(0,0,0,0.05)] dark:shadow-[0_-1px_2px_0_rgba(0,0,0,0.1)] border-t border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Animated Background - Same as Navbar and Sidebar */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <AnimatedBackground variant="subtle" showGrid={true} showLines={false} />
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 relative" style={{ zIndex: 1 }}>
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="relative w-[150px] h-16">
                <Image
                  src={mounted && theme === 'dark' ? "/images/HKlogowhite.png" : "/images/HKlogoblack.png"}
                  alt="Solviq AI Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              {t('footer.tagline')}
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <a 
                  href="mailto:info@hirekarma.in" 
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  info@hirekarma.in
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <a 
                  href="tel:+919078683876" 
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  +91 90786 83876
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Room No: 109, 1st Floor, Tower A, O-HUB, Bhubaneswar
                </span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-4">
              {t('footer.product')}
            </h3>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    onClick={(e) => handleLinkClick(link.href, e)}
                    className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-4">
              {t('footer.company')}
            </h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    onClick={(e) => handleLinkClick(link.href, e)}
                    className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-4">
              {t('footer.support')}
            </h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith('http') ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link 
                      href={link.href}
                      onClick={(e) => handleLinkClick(link.href, e)}
                      className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-4">
              {t('footer.legal')}
            </h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    onClick={(e) => handleLinkClick(link.href, e)}
                    className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-800 mb-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Copyright & Powered By */}
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center md:text-left">
            <p className="flex items-center gap-1 flex-wrap justify-center md:justify-start mb-2">
              {t('footer.copyright')} Made with 
              <Heart className="w-4 h-4 text-red-500 fill-red-500 mx-1" /> 
              in India
            </p>
            <p className="text-gray-600 dark:text-gray-500">
              Powered by{' '}
              <a 
                href="https://www.hirekarma.in/" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors font-medium"
              >
                HireKarma Pvt Ltd
              </a>
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <motion.a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-primary-600 dark:hover:bg-primary-500 flex items-center justify-center transition-colors text-gray-700 dark:text-gray-300"
                aria-label={social.label}
              >
                {social.icon}
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
