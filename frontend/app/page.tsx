"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUserStatus } from "@/hooks/use-user-status";
import Welcome from "@/components/auth/Welcome";
import { useIsRegistered } from "@/hooks/use-blockchain";

export default function HomePage() {
  const { ready, authenticated, loading } = useAuth();
  const router = useRouter();
  const { isRegistered, loading: regLoading } = useIsRegistered();

  // useEffect(() => {
  //   console.log("isRegistered", isRegistered);
  //   if (ready && authenticated && isRegistered) {
  //     router.push("/dashboard");
  //   }
  //   if (ready && authenticated && !isRegistered) {
  //     router.push("/onboarding");
  //   }
  // }, [ready, authenticated, isRegistered, router]);

  // if (
  //   !ready ||
  //   loading ||
  //   (authenticated && regLoading && isRegistered === null)
  // ) {
  //   return (
  //     <div className="min-h-screen  bg-black flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="w-8 h-8 border-2 border-[#A3FF50] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
  //         {/* <p className="text-slate-400">Initializing...</p> */}
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div
      className="min-h-screen h-screen w-screen bg-black flex flex-col items-center justify-center p-4 bg-cover bg-center"
      style={{
        backgroundImage:
          "url(https://events-ng.vercel.app/assets/bg-ChMRSnjO.svg)",
      }}
    >
      <Welcome />
    </div>
  );
}
