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
    router.push("/");
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
                  className="text-white/80 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="text-white/80 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                >
                  How it Works
                </a>
                <a
                  href="#testimonials"
                  className="text-white/80 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                >
                  Why Choose Cirql
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 relative overflow-hidden min-h-screen flex items-center">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating orbs that follow mouse */}
          <div
            className="absolute w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl transition-all duration-1000 ease-out"
            style={{
              left: `${mousePosition.x * 0.05}px`,
              top: `${mousePosition.y * 0.05}px`,
              transform: "translate(-50%, -50%)",
            }}
          ></div>

          {/* Static animated elements */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-purple-500/10 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 left-1/3 w-40 h-40 bg-cyan-500/10 rounded-full animate-pulse delay-500"></div>

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            {/* Animated badge */}
            <div
              className={`inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-8 transition-all duration-1000 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
              Early Access • The future of networking
            </div>

            {/* Main headline with typewriter effect */}
            <h1
              className={`text-5xl md:text-7xl font-bold text-white mb-6 leading-tight transition-all duration-1000 delay-300 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Connect
              </span>
              <br />
              <span className="text-white">with people</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                in your immediate vicinity
              </span>
            </h1>

            {/* Animated description */}
            <p
              className={`text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-500 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              Turn every professional event, conference, or meetup into a
              networking opportunity. Cirql makes proximity-based social
              networking effortless and natural.
            </p>

            {/* Interactive CTA section */}
            <div
              className={`flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 transition-all duration-1000 delay-700 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <button
                onClick={handleGetStarted}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-2xl hover:from-blue-500 hover:to-purple-500 transition-all duration-300 font-semibold text-lg shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-2 flex items-center overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center">
                  Start Connecting
                  <ArrowRight
                    className={`w-5 h-5 ml-3 transition-all duration-300 ${
                      isHovered ? "translate-x-2 scale-110" : ""
                    }`}
                  />
                </span>
              </button>

              <div className="flex items-center text-sm text-blue-200">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                Free to use • No downloads required
              </div>
            </div>

            {/* Interactive feature preview */}
            <div
              className={`grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto transition-all duration-1000 delay-1000 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <div className="group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-300">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2">
                  One-Scan Magic
                </h3>
                <p className="text-blue-200 text-sm">
                  Instant connection with a simple scan
                </p>
              </div>

              <div className="group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-300">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2">
                  Proximity Intelligence
                </h3>
                <p className="text-blue-200 text-sm">
                  Find people within 100m radius
                </p>
              </div>

              <div className="group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-300">
                  <Waves className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2">
                  Real-time Discovery
                </h3>
                <p className="text-blue-200 text-sm">
                  Live updates of who&apos;s nearby
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-32 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.05),transparent_50%)]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Revolutionary Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powerful features for
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                professional networking
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to connect meaningfully with professionals in
              your immediate area
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative p-8 rounded-3xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  One-Scan Connection
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Simply scan a QR code or enter a place code to instantly join
                  the local network
                </p>
                <div className="mt-4 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative p-8 rounded-3xl bg-white border border-gray-100 hover:border-green-200 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Proximity Intelligence
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  See and connect with people within 100m radius in real-time
                </p>
                <div className="mt-4 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative p-8 rounded-3xl bg-white border border-gray-100 hover:border-purple-200 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Real-time Discovery
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Live updates of who&apos;s nearby, their interests, and
                  connection status
                </p>
                <div className="mt-4 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative p-8 rounded-3xl bg-white border border-gray-100 hover:border-orange-200 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Privacy-First
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  You control who sees you and when. Leave anytime with one tap
                </p>
                <div className="mt-4 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="py-32 bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden"
      >
        {/* Background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.1),transparent_50%)]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm font-medium mb-6">
              <Target className="w-4 h-4 mr-2" />
              Simple Process
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How Cirql works in
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                3 simple steps
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started in minutes and begin connecting with professionals
              around you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="group relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300 animate-pulse"></div>
              <div className="relative text-center p-8 rounded-3xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <QrCode className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Scan or Enter Code
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Use your phone&apos;s camera to scan a QR code or manually
                  enter a place code to join any location
                </p>
                <div className="mt-6 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300 animate-pulse delay-500"></div>
              <div className="relative text-center p-8 rounded-3xl bg-white border border-gray-100 hover:border-green-200 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Users className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Join the Network
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Instantly see who else is in the same location and their
                  profiles in real-time
                </p>
                <div className="mt-6 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300 animate-pulse delay-1000"></div>
              <div className="relative text-center p-8 rounded-3xl bg-white border border-gray-100 hover:border-purple-200 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Waves className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Start Connecting
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Send connection requests, chat, and build your professional
                  network
                </p>
                <div className="mt-6 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Cirql */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why professionals choose Cirql
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built for the modern professional who values authentic,
              location-based connections
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Real Connections
              </h3>
              <p className="text-gray-600">
                Connect with people who are actually present, not just online
                profiles. Build meaningful relationships based on shared
                location and interests.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Instant Networking
              </h3>
              <p className="text-gray-600">
                No more awkward small talk or missed opportunities. See
                who&apos;s around you and start conversations that matter.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Privacy Control
              </h3>
              <p className="text-gray-600">
                You decide who sees you and when. Leave any location instantly.
                Your privacy and comfort come first.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.3),transparent_50%)] animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_75%_75%,rgba(147,51,234,0.3),transparent_50%)] animate-pulse delay-1000"></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-yellow-400/20 to-orange-400/20 backdrop-blur-sm border border-yellow-400/30 text-yellow-200 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
            Limited Early Access Available
          </div>

          <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
            Ready to transform your
            <span className="block bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              networking forever?
            </span>
          </h2>

          <p className="text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed">
            Be among the first to experience Cirql and discover how
            proximity-based networking can revolutionize your professional
            connections.
          </p>

          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-12">
            <button
              onClick={handleGetStarted}
              className="group relative bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-12 py-6 rounded-2xl hover:from-yellow-300 hover:to-orange-400 transition-all duration-300 font-bold text-xl shadow-2xl hover:shadow-yellow-500/25 transform hover:-translate-y-2 flex items-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center">
                Start Your Journey
                <ArrowRight className="w-6 h-6 ml-3 transition-all duration-300 group-hover:translate-x-2 group-hover:scale-110" />
              </span>
            </button>

            <div className="flex items-center text-lg text-blue-200">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
              No credit card required • Early access
            </div>
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center text-blue-200">
              <Shield className="w-6 h-6 mr-3 text-green-400" />
              Privacy-first design
            </div>
            <div className="flex items-center justify-center text-blue-200">
              <Zap className="w-6 h-6 mr-3 text-yellow-400" />
              Instant connections
            </div>
            <div className="flex items-center justify-center text-blue-200">
              <Users className="w-6 h-6 mr-3 text-purple-400" />
              Real professionals only
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 left-20 w-16 h-16 bg-blue-400/20 rounded-full animate-bounce"></div>
        <div className="absolute top-40 right-32 w-12 h-12 bg-purple-400/20 rounded-full animate-bounce delay-1000"></div>
        <div className="absolute bottom-32 left-1/3 w-20 h-20 bg-cyan-400/20 rounded-full animate-bounce delay-500"></div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">Cirql</h3>
            <p className="text-gray-400">
              Connecting professionals through proximity-based social
              networking.
            </p>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Cirql. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
