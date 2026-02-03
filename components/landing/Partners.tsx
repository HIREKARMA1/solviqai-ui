'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Partner {
  id: number | string;
  name: string;
  logo: string;
}

const universityPartners: Partner[] = [
  {
    "id": 1,
    "name": "aryan",
    "logo": "https://hirekarma.s3.us-east-1.amazonaws.com/hirekarma_ui/college_logo/Aryan_1_-removebg-preview.png"
  },
  {
    "id": 2,
    "name": "BEC",
    "logo": "https://hirekarma.s3.us-east-1.amazonaws.com/hirekarma_ui/college_logo/BEC_1_-removebg-preview.png"
  },
  {
    "id": 3,
    "name": "CIME",
    "logo": "https://hirekarma.s3.us-east-1.amazonaws.com/hirekarma_ui/college_logo/CIME_1_-removebg-preview.png"
  },
  {
    "id": 4,
    "name": "EATM",
    "logo": "https://hirekarma.s3.us-east-1.amazonaws.com/hirekarma_ui/college_logo/EATM_logo_1_-removebg-preview.png"
  },
  {
    "id": 5,
    "name": "GECK",
    "logo": "https://hirekarma.s3.us-east-1.amazonaws.com/hirekarma_ui/college_logo/GCEKJ_1_-removebg-preview.png"
  },
  {
    "id": 6,
    "name": "GEC",
    "logo": "https://hirekarma.s3.us-east-1.amazonaws.com/hirekarma_ui/college_logo/GEC_1_-removebg-preview.png"
  },
  {
    "id": 7,
    "name": "GIET",
    "logo": "https://hirekarma.s3.us-east-1.amazonaws.com/hirekarma_ui/college_logo/GIET_baniatangi_1_-removebg-preview.png"
  },
  {
    "id": 8,
    "name": "GIET Gangapatna",
    "logo": "https://hirekarma.s3.us-east-1.amazonaws.com/hirekarma_ui/college_logo/GIET_gangapatna_1_-removebg-preview+(1).png"
  },
  {
    "id": 9,
    "name": "KIT",
    "logo": "https://hirekarma.s3.us-east-1.amazonaws.com/hirekarma_ui/college_logo/KIT_1_-removebg-preview.png"
  },
  {
    "id": 10,
    "name": "NIST",
    "logo": "https://hirekarma.s3.us-east-1.amazonaws.com/hirekarma_ui/college_logo/NISt_1_-removebg-preview.png"
  },
  {
    "id": 11,
    "name": "GIET Gunpur",
    "logo": "https://hirekarma.s3.us-east-1.amazonaws.com/hirekarma_ui/college_logo/GIET_gunpur_1_-removebg-preview.png"
  },
  {
    "id": 12,
    "name": "GIFT",
    "logo": "https://hirekarma.s3.us-east-1.amazonaws.com/hirekarma_ui/college_logo/GIFT_1_-removebg-preview.png"
  },
  {
    "id": 13,
    "name": "GITAM",
    "logo": "https://hirekarma.s3.us-east-1.amazonaws.com/hirekarma_ui/college_logo/GITAM_1_-removebg-preview.png"
  },
  {
    "id": 14,
    "name": "NMIET",
    "logo": "https://hirekarma.s3.us-east-1.amazonaws.com/hirekarma_ui/college_logo/NMIET_1_-removebg-preview.png"
  },
  {
    "id": 15,
    "name": "PMEC",
    "logo": "https://hirekarma.s3.us-east-1.amazonaws.com/hirekarma_ui/college_logo/PMEC_1_-removebg-preview.png"
  },
  {
    "id": 16,
    "name": "Presidency",
    "logo": "https://hirekarma.s3.us-east-1.amazonaws.com/hirekarma_ui/college_logo/Presidency_1_-removebg-preview.png"
  },
  {
    "id": 17,
    "name": "QUAT",
    "logo": "https://hirekarma.s3.us-east-1.amazonaws.com/hirekarma_ui/college_logo/QUAT_1_-removebg-preview.png"
  },
  {
    "id": 18,
    "name": "SRUSTI",
    "logo": "https://hirekarma.s3.us-east-1.amazonaws.com/hirekarma_ui/college_logo/SRUSTI_1_-removebg-preview.png"
  },
  {
    "id": 19,
    "name": "Synergy",
    "logo": "https://hirekarma.s3.us-east-1.amazonaws.com/hirekarma_ui/college_logo/Synergy-Logo%5B1%5D.png"
  },
  {
    "id": 20,
    "name": "USBM",
    "logo": "https://hirekarma.s3.us-east-1.amazonaws.com/hirekarma_ui/college_logo/USBM_logo%5B1%5D.png"
  },
  {
    "id": 21,
    "name": "Suddhananda School",
    "logo": "https://hirekarma.s3.us-east-1.amazonaws.com/hirekarma_ui/college_logo/LogoSuddhananda_School_of_Management_and_Computer_Science_SD2CyXR_1_-removebg-preview.png"
  }
];

export function Partners() {
  const { t } = useTranslation();

  return (
    <section
      id="partners"
      className="section-container relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900"
    >
      {/* Subtle gradient overlay for dark mode */}
      <div
        className="absolute inset-0 dark:block hidden opacity-50"
        style={{
          background: 'radial-gradient(ellipse at top right, rgba(139, 69, 19, 0.1) 0%, transparent 50%)' // Warm accent from Solviq
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl p-8 sm:p-12 mb-16 text-center shadow-xl relative overflow-hidden"
          style={{ backgroundColor: '#1A4A8A' }}
        >
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white">
              {t('partners.cta.title')}
            </h2>

            <p className="text-lg sm:text-xl mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed">
              {t('partners.cta.description')}
            </p>

            <button
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white transition-all duration-300 hover:opacity-90 hover:scale-105 shadow-lg"
              style={{ backgroundColor: '#FF541F', boxShadow: '0 4px 14px 0 rgba(255, 84, 31, 0.39)' }}
            >
              {t('partners.cta.button')}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Partners Scrolling Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex flex-col items-center mb-10">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Our University Partners</h3>
            <div className="h-1 w-20 bg-blue-600 rounded-full"></div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-4 text-center max-w-2xl">
              Trusted by leading educational institutions across India who rely on our platform for their placement needs.
            </p>
          </div>

          {/* Marquee Container */}
          <div className="relative w-full overflow-hidden">
            {/* Gradient Masks for smooth fade out at edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 z-10 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 z-10 bg-gradient-to-l from-gray-50 to-transparent dark:from-gray-900 pointer-events-none"></div>

            <motion.div
              className="flex gap-2 sm:gap-4 items-center py-4"
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                repeat: Infinity,
                ease: "linear",
                duration: 60,
                repeatType: "loop"
              }}
              style={{ width: "fit-content" }}
            >
              {[...universityPartners, ...universityPartners].map((partner, index) => (
                <div
                  key={`${partner.id}-${index}`}
                  className="flex-shrink-0 w-36 sm:w-44 md:w-52"
                >
                  <div className="h-28 sm:h-32 transition-all duration-300 p-4 flex flex-col items-center justify-center group cursor-pointer hover:-translate-y-1">
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden p-2">
                      <img
                        src={partner.logo}
                        alt={partner.name}
                        className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500 opacity-80 group-hover:opacity-100 transform group-hover:scale-110"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                    {/* Tooltip-like name on hover could go here, but logo should be enough */}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

