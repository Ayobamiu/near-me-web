"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  QrCode,
  Users,
  Shield,
  ArrowRight,
  Zap,
  Sparkles,
  Waves,
  Target,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleGetStarted = () => {
    router.push("/auth");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-transparent backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-white">Cirql</h1>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a
                  href="#features"
                  className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  How It Works
                </a>
                <a
                  href="#why-choose"
                  className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Why Choose Cirql
                </a>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
          {/* Mouse-following orbs */}
          <div
            className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl transition-all duration-1000 ease-out"
            style={{
              left: mousePosition.x - 192,
              top: mousePosition.y - 192,
              transform: isHovered ? "scale(1.2)" : "scale(1)",
            }}
          />

          {/* Static animated elements */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl animate-pulse delay-500" />

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />
        </div>

        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          {/* Early Access Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8 animate-pulse">
            <Sparkles className="w-4 h-4 text-yellow-400 mr-2" />
            <span className="text-white/90 text-sm font-medium">
              Early Access
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent animate-pulse">
              Connect
            </span>
            <br />
            <span className="text-white">in Real Places</span>
          </h1>

          {/* Description */}
          <p className="text-xl sm:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up">
            The professional networking app that brings people together in the
            same physical space. No more awkward online introductions—connect
            with people who are actually there.
          </p>

          {/* CTA Section */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button
              onClick={handleGetStarted}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full text-lg hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <span className="relative z-10 flex items-center">
                Start Connecting Today
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            <div className="text-white/60 text-sm">
              No credit card required • Early access
            </div>
          </div>

          {/* Interactive Feature Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="group p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
              <QrCode className="w-8 h-8 text-blue-400 mb-4 group-hover:rotate-12 transition-transform" />
              <h3 className="text-white font-semibold mb-2">
                One-Scan Connection
              </h3>
              <p className="text-white/70 text-sm">
                Scan QR codes to instantly connect with people in your space
              </p>
            </div>

            <div className="group p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
              <MapPin className="w-8 h-8 text-purple-400 mb-4 group-hover:rotate-12 transition-transform" />
              <h3 className="text-white font-semibold mb-2">
                Proximity Intelligence
              </h3>
              <p className="text-white/70 text-sm">
                See who&apos;s nearby and discover connections in real-time
              </p>
            </div>

            <div className="group p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
              <Users className="w-8 h-8 text-indigo-400 mb-4 group-hover:rotate-12 transition-transform" />
              <h3 className="text-white font-semibold mb-2">
                Real-time Discovery
              </h3>
              <p className="text-white/70 text-sm">
                Find professionals who are actually present at events
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6">
              <Zap className="w-4 h-4 mr-2" />
              Revolutionary Features
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Powerful features for professional networking
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cirql transforms how professionals connect by focusing on
              real-world proximity and meaningful interactions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="group relative p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-300">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Instant QR Connections
                </h3>
                <p className="text-gray-600 mb-4">
                  Scan QR codes to instantly connect with people in your space.
                  No more awkward introductions.
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full w-0 group-hover:w-full transition-all duration-1000 ease-out"></div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-300">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Proximity Intelligence
                </h3>
                <p className="text-gray-600 mb-4">
                  See who&apos;s nearby and discover connections in real-time
                  based on your location.
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full w-0 group-hover:w-full transition-all duration-1000 ease-out"></div>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Real-time Discovery
                </h3>
                <p className="text-gray-600 mb-4">
                  Find professionals who are actually present at events,
                  conferences, and meetups.
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full w-0 group-hover:w-full transition-all duration-1000 ease-out"></div>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-300">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Privacy-First
                </h3>
                <p className="text-gray-600 mb-4">
                  Control your visibility and choose what information to share
                  with others.
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full w-0 group-hover:w-full transition-all duration-1000 ease-out"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              How Cirql Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three simple steps to start connecting with professionals in your
              space
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-sm font-bold text-gray-900">
                  1
                </div>
                {/* Floating orb behind */}
                <div className="absolute inset-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -z-10 group-hover:bg-blue-500/20 transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Join a Place
              </h3>
              <p className="text-gray-600 mb-6">
                Scan a QR code or enter a place code to join a virtual space for
                your event or location.
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full w-0 group-hover:w-full transition-all duration-1000 ease-out"></div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-sm font-bold text-gray-900">
                  2
                </div>
                {/* Floating orb behind */}
                <div className="absolute inset-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -z-10 group-hover:bg-green-500/20 transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Discover People
              </h3>
              <p className="text-gray-600 mb-6">
                See who else is in the same place and discover professionals
                with shared interests.
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full w-0 group-hover:w-full transition-all duration-1000 ease-out"></div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                  <QrCode className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-sm font-bold text-gray-900">
                  3
                </div>
                {/* Floating orb behind */}
                <div className="absolute inset-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -z-10 group-hover:bg-purple-500/20 transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Connect Instantly
              </h3>
              <p className="text-gray-600 mb-6">
                Send connection requests, start conversations, and build
                meaningful professional relationships.
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full w-0 group-hover:w-full transition-all duration-1000 ease-out"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Cirql Section */}
      <section id="why-choose" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Why professionals choose Cirql
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for real-world networking with privacy and professionalism
              at its core
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Real Connections
              </h3>
              <p className="text-gray-600">
                Connect with people who are actually present at events, not just
                online profiles. Build relationships that matter in the real
                world.
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Instant Networking
              </h3>
              <p className="text-gray-600">
                No more awkward introductions or missed opportunities. Cirql
                makes it easy to connect with the right people at the right
                time.
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Privacy Control
              </h3>
              <p className="text-gray-600">
                You control your visibility and what information you share.
                Professional networking without compromising your privacy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 animate-pulse" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl sm:text-6xl font-bold text-white mb-8">
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              Ready to revolutionize
            </span>
            <br />
            <span className="text-white">your networking?</span>
          </h2>

          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
            Join the early access program and be among the first to experience
            the future of professional networking.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={handleGetStarted}
              className="group relative px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold rounded-full text-lg hover:shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <span className="relative z-10 flex items-center">
                Start Connecting Today
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            <div className="text-white/60 text-sm">
              No credit card required • Early access
            </div>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-white/60">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-sm">Privacy First</span>
            </div>
            <div className="flex items-center">
              <Users className="w-5 h-5 text-blue-400 mr-2" />
              <span className="text-sm">Real Connections</span>
            </div>
            <div className="flex items-center">
              <Zap className="w-5 h-5 text-yellow-400 mr-2" />
              <span className="text-sm">Instant Setup</span>
            </div>
          </div>
        </div>

        {/* Floating animated elements */}
        <div className="absolute top-20 left-20 w-4 h-4 bg-white/20 rounded-full animate-bounce" />
        <div className="absolute bottom-20 right-20 w-6 h-6 bg-white/20 rounded-full animate-bounce delay-1000" />
        <div className="absolute top-1/2 left-1/4 w-3 h-3 bg-white/20 rounded-full animate-bounce delay-500" />
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">Cirql</h3>
              <p className="text-gray-400 mb-4">
                The professional networking app that brings people together in
                real places. Connect with professionals who are actually there.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="hover:text-white transition-colors"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="#why-choose"
                    className="hover:text-white transition-colors"
                  >
                    Why Choose Cirql
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Cirql. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
