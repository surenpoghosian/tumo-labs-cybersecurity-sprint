'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Quote } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface UnifiedLoaderProps {
  message?: string;
  showHeader?: boolean;
  theme?: 'orange' | 'blue' | 'indigo';
}

const LINGUIST_QUOTES = [
  {
    quote: "Language is the road map of a culture. It tells you where its people come from and where they are going.",
    author: "Rita Mae Brown"
  },
  {
    quote: "The limits of my language mean the limits of my world.",
    author: "Ludwig Wittgenstein"
  },
  {
    quote: "Language is not a genetic gift, it is a social gift. Learning a new language is becoming a member of the club.",
    author: "Frank Smith"
  },
  {
    quote: "Language is the most massive and inclusive art we know, a mountainous and anonymous work of unconscious generations.",
    author: "Edward Sapir"
  },
  {
    quote: "The conquest of learning is achieved through the knowledge of languages.",
    author: "Roger Bacon"
  },
  {
    quote: "Translation is that which transforms everything so that nothing changes.",
    author: "Günter Grass"
  },
  {
    quote: "Language shapes the way we think, and determines what we can think about.",
    author: "Benjamin Lee Whorf"
  },
  {
    quote: "Language is wine upon the lips.",
    author: "Virginia Woolf"
  },
  {
    quote: "The chief virtue that language can have is clearness, and nothing detracts from it so much as the use of unfamiliar words.",
    author: "Hippocrates"
  },
  {
    quote: "A different language is a different vision of life.",
    author: "Federico Fellini"
  },
  {
    quote: "Language is a city to the building of which every human being brought a stone.",
    author: "Ralph Waldo Emerson"
  },
  {
    quote: "To have another language is to possess a second soul.",
    author: "Charlemagne"
  },
  {
    quote: "Language is the source of misunderstandings.",
    author: "Antoine de Saint-Exupéry"
  },
  {
    quote: "Language is the blood of the soul into which thoughts run and out of which they grow.",
    author: "Oliver Wendell Holmes"
  },
  {
    quote: "The art of translation lies less in knowing the other language than in knowing your own.",
    author: "John Dryden"
  }
];
export default function UnifiedLoader({
  message = '',
  showHeader = true,
  theme = 'orange'
}: UnifiedLoaderProps) {
  const [currentQuote, setCurrentQuote] = useState(LINGUIST_QUOTES[0]);
  const [isVisible, setIsVisible] = useState(true);

  const common = useTranslations('Common');

  if (message === '') {
    message = common('loading');
  }


  useEffect(() => {
    // Show initial quote immediately
    const randomQuote = LINGUIST_QUOTES[Math.floor(Math.random() * LINGUIST_QUOTES.length)];
    setCurrentQuote(randomQuote);

    // Rotate quotes every 4 seconds
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        const newQuote = LINGUIST_QUOTES[Math.floor(Math.random() * LINGUIST_QUOTES.length)];
        setCurrentQuote(newQuote);
        setIsVisible(true);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const themeConfig = {
    orange: {
      bg: 'from-orange-50 to-red-100',
      primary: 'text-orange-600',
      border: 'border-orange-600',
      loader: 'text-orange-600',
      accent: 'text-orange-500'
    },
    blue: {
      bg: 'from-blue-50 to-indigo-100',
      primary: 'text-blue-600',
      border: 'border-blue-600',
      loader: 'text-blue-600',
      accent: 'text-blue-500'
    },
    indigo: {
      bg: 'from-indigo-50 to-purple-100',
      primary: 'text-indigo-600',
      border: 'border-indigo-600',
      loader: 'text-indigo-600',
      accent: 'text-indigo-500'
    }
  };

  const colors = themeConfig[theme];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.bg}`}>
      {/* Header */}
      {showHeader && (
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className={`h-8 w-8 ${colors.primary}`} />
              <span className="text-xl font-bold text-gray-900">Armenian CyberSec Docs</span>
            </div>
            <nav className="flex items-center space-x-6">
              <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-14 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
            </nav>
          </div>
        </header>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          {/* Loading Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{message}</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Preparing your experience...
          </p>

          {/* Historical Linguist Quote */}
          <div className={`bg-white rounded-lg shadow-lg p-10 border-l-4 ${colors.border} transition-all duration-500 ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-60 transform translate-y-2'}`}>
            <Quote className={`h-10 w-10 ${colors.primary} mx-auto mb-6`} />
            <blockquote className="text-xl text-gray-700 italic mb-6 leading-relaxed font-medium">
              &ldquo;{currentQuote.quote}&rdquo;
            </blockquote>
            <cite className={`text-base ${colors.primary} font-semibold`}>
              — {currentQuote.author}
            </cite>
          </div>
        </div>
      </div>
    </div>
  );
} 