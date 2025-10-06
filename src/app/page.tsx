"use client";

import Link from "next/link";
import { Playfair_Display } from "next/font/google";


const playfair = Playfair_Display({
  subsets: ["cyrillic"],
  weight: ["700"], // Bold weight for the title
});

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center px-6">
      {/* Main Welcome Section */}
      <div className="max-w-3xl">
       <h1
          className={`${playfair.className} text-5xl md:text-6xl font-bold text-gray-900 mb-4`}>
          Welcome
        </h1>
        <h2 className="text-xl md:text-2xl text-gray-700 mb-6">
          To Chimbuchi Pharma
        </h2>
        <p className="text-gray-600 mb-10 leading-relaxed">
          Providing quality healthcare products and reliable service to support
          your wellness. Explore our platform and experience seamless access to
          essential goods.
        </p>

        {/* Call to Action */}
        <Link
          href="/login"
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-full shadow-md hover:bg-blue-700 transition duration-300"
        >
          Login
        </Link>
      </div>

      
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <svg
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
          xmlns="http://www.w3.org/2000/svg"
          width="1200"
          height="200"
          fill="none"
        >
          <path
            d="M0 100 Q 300 0, 600 100 T 1200 100"
            stroke="#d1d5db"
            strokeWidth="2"
            fill="transparent"
          />
        </svg>
      </div>
    </main>
  );
}
