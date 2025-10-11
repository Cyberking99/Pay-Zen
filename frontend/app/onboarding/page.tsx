"use client";
import OnboardingSideView from "@/components/auth/OnboardingSideView";
import OnboardingForm from "@/components/auth/OnboardingForm";
import React from "react";

const Onboarding = () => {
  return (
    <main className="min-h-screen h-screen bg-black flex">
      <div className="w-[45%] px-16 flex flex-col h-full py-10 justify-center relative">
        <div className="w-full mb-8">
          <a
            className="h-10 pl-2 pr-3 py-2 bg-white/10 text-white rounded-full justify-center items-center inline-flex text-sm font-medium"
            href="/"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
            >
              <path
                stroke="#fff"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity="0.5"
                strokeWidth="1.5"
                d="M13.25 8.75 9.75 12l3.5 3.25"
              />
            </svg>
            <span>Home</span>
          </a>
        </div>
        

        <OnboardingForm />
      </div>
      <OnboardingSideView />
    </main>
  );
};

export default Onboarding;