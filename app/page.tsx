'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Mail, Globe, CheckCircle2, Play, Briefcase } from 'lucide-react';
import Footer from '../components/footer';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Feature from '@/components/Feature';
import BrowseJobsCTA from '@/components/BrowseJobsCTA';
import HowItWorks from '@/components/HowItWorks';
import CTA from '@/components/CTA';



export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
      {/* Navigation Bar */}
      <Nav/>

      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <Feature />

      {/* Browse Jobs CTA Section */}
      {/* <BrowseJobsCTA /> */}

      {/* Pricing Section */}
      

      {/* How It Works */}
     <HowItWorks/>

      {/* CTA Section */}
      <CTA/>
        
      {/* Footer */}
     <Footer/>
    </main>
  );
}
