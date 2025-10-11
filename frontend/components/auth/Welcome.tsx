import Image from "next/image";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLogin, getAccessToken } from '@privy-io/react-auth';
import { useRouter } from "next/navigation";

const Welcome = () => {
  const { login, accountLogin, user, primaryWallet, authenticated } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();
  
  const { login: privyLogin } = useLogin({
    onError: (error) => {
      console.error("Login error:", error);
    },
    onComplete: async () => {
      console.log("Login complete");
      // Redirect to onboarding after successful login
      router.push("/onboarding");
    },
  });

  const handleGetStarted = async () => {
    try {
      setIsConnecting(true);
      
      privyLogin();
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-[480px] items-center justify-center p-4 text-white ">
      <div className="size-[150px] bg-black border rounded-xl border-gray-800 mb-4 flex items-center justify-center">
        {/* <Image
          src="https://pagrin.pages.dev/svgs/benefit3.svg"
          alt="Payzen"
          width={60}
          height={60}
        /> */}
      </div>
      <div className="text-[28px] font-bold text-center">Welcome to payzen</div>

      <div className="text-[17px] font-light text-gray-100 text-center">
        Accept payments, create payment links, and offramp
        <br /> to local currencies with our <span className="text-white font-medium">secure blockchain</span>
        <br /> payment infrastructure for businesses.
      </div>

      <div className="flex flex-col gap-3 items-center justify-center w-full p-4">
        <Button
          onClick={handleGetStarted}
          disabled={isConnecting}
          className="h-[45px] w-full bg-[#A3FF50] hover:bg-[#A3FF50] cursor-pointer text-black rounded-lg"
          variant={"destructive"}
        >
          {isConnecting ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
              Connecting...
            </>
          ) : (
            "Get Started"
          )}
        </Button>

        <p className="text-sm text-center mt-10 text-gray-500">By Getting started, you agree to our <span className="text-white">Terms and Condition of use</span> and <span className="text-white">Privacy policy</span>. See how we handle your data here.</p>
        {/* <Button variant="outline" className="h-[40px] w-full border-white text-white hover:bg-white hover:text-black">Login</Button> */}
      </div>
    </div>
  );
};

export default Welcome;
