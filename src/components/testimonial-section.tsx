"use client";

import { TestimonialCard } from "@/components/testimonial-card";
import type React from "react";

const testimonials = [
  {
    name: "Kasif Rashid",
    initial: "K",
    rating: 5,
    review:
      "Excellence service!!! The indicators are the most accurate I've ever see in trading which saves so much time since they all automatically update according to price action. Thoroughly recommend, not only in crypto but also in forex and stocks.",
    date: "Sep 10, 2023",
    isVerified: true,
  },
  {
    name: "Vincent Olaiya",
    initial: "V",
    rating: 5,
    review:
      "They have the best indicators.... They've educative class that teaches everything about their indicators....As a beginner, you have a chance of making profit even before you become a professional.",
    date: "Sep 10, 2023",
    isVerified: true,
  },
  {
    name: "Landon",
    initial: "L",
    rating: 5,
    review:
      "These charting tools are amazing! A must-have for traders and investors! It has exponentially improved my trading success. Highly recommended!",
    date: "Dec 22, 2023",
    isVerified: false,
  },
  {
    name: "Martin Sahara",
    initial: "M",
    rating: 4,
    review:
      "I've been using Proud Profits for a while now, and their indicators + continuous training experience have doubled my success, thank you",
    date: "Aug 1, 2023",
    isVerified: true,
  },
  {
    name: "Army Piper",
    initial: "AP",
    rating: 5,
    review:
      "As a long time user of other premium indicator packages, I was impressed with Proud Profits in comparison. The suite offers an all in one packet of indicators that I have found much easier to use and understand.",
    date: "Aug 9, 2022",
    isVerified: true,
  },
  {
    name: "Joshua C.",
    initial: "JC",
    rating: 5,
    review:
      "I'm mainly a crypto trader with 7 years of experience. This indicator suite combined with each other suits my need of accelerating the entry/exits of my trades with more confidence. As many of you know it's extremely important to have a good indicator that helps you to make good decisions.",
    date: "Aug 3, 2022",
    isVerified: false,
  },
  {
    name: "Sibasish Mahana",
    initial: "SM",
    rating: 5,
    review:
      "Really working multiple times in price action.Working on all time frame and the price.",
    date: "Jun 29, 2022",
    isVerified: false,
  },
];

export function TestimonialSection() {
  // Duplicate testimonials to create a seamless loop for infinite scroll
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] text-white overflow-hidden">
      <div className="container px-4 md:px-6 text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tighter gradient-text">
          Good Trades, Good Reviews
        </h2>
      </div>

      <div className="relative w-full overflow-hidden py-4">
        {/* First row: Left to Right visual scroll (content moves right) */}
        <div
          className="flex animate-scroll-content-right animate-paused"
          style={{ "--scroll-duration": "60s" } as React.CSSProperties}
        >
          {duplicatedTestimonials.map((testimonial, index) => (
            <TestimonialCard key={`row1-${index}`} {...testimonial} />
          ))}
        </div>
      </div>

      <div className="relative w-full overflow-hidden py-4 mt-8">
        {/* Second row: Right to Left visual scroll (content moves left) */}
        <div
          className="flex animate-scroll-content-left animate-paused"
          style={{ "--scroll-duration": "60s" } as React.CSSProperties}
        >
          {duplicatedTestimonials.map((testimonial, index) => (
            <TestimonialCard key={`row2-${index}`} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}