import Image from 'next/image'
import React from 'react'

const OnboardingSideView = () => {
  return (
    <div className="w-[55%] h-screen bg-[#262626] relative">
        <Image
          src="https://dashboard.blockradar.co/illustrations/auth-background.svg"
          alt="Onboarding"
          width={846}
          height={432}
          className="absolute top-0 left-0 right-0"
        />

        <div className="flex flex-col h-full justify-between p-10">
          <div className="flex items-center gap-2 text-white text-xl">
            <span className="size-[20px] bg-black rounded"></span>
            Payzen
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="px-2 py-0.5 bg-[#A3FF50] rounded-[5px] justify-start items-center inline-flex text-black text-xs leading-[18px] mb-5">
              Secure payments
            </div>
            <div className="text-center text-white/50 text-2xl font-semibold px-20 mb-4 w-[629px]">
              Pioneering the future of{" "}
              <span className="text-white/80">digital payments</span> for{" "}
              <span className="text-white/80">individuals</span> and{" "}
              <span className="text-white/80">businesses</span>
            </div>
            <div className="text-center text-white/50 text-sm font-normal px-6 w-[700px]">
              Experience next-generation payment infrastructure that bridges
              traditional finance with blockchain technology. Create instant
              payment links, accept stablecoin payments, and offramp to local
              currencies with enterprise-grade security and lightning-fast
              settlements.
            </div>
          </div>
        </div>
      </div>
  )
}

export default OnboardingSideView