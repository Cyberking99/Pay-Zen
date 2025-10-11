"use client";

import React, { useState, useEffect, useCallback } from "react";
import { User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { userService } from "@/lib/api";
import { toast } from "sonner";

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface OnboardingFormProps {
  onSubmit?: (data: FormData) => void;
}

const OnboardingForm: React.FC<OnboardingFormProps> = ({ onSubmit }) => {
  const { user, accountLogin, updateProfile, walletAddress } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    dateOfBirth: "",
  });

  // Debounced username check
  const debouncedCheckUsername = useCallback(
    debounce(async (username: string) => {
      if (username.length < 3) {
        setUsernameAvailable(null);
        setUsernameChecking(false);
        return;
      }

      setUsernameChecking(true);
      try {
        const result = await userService.checkUsername(username);
        setUsernameAvailable(result.available);
      } catch (error) {
        console.error("Username check failed:", error);
        setUsernameAvailable(null);
      } finally {
        setUsernameChecking(false);
      }
    }, 500),
    []
  );

  // Effect to trigger debounced username check
  useEffect(() => {
    if (formData.username.length > 0) {
      setUsernameChecking(true);
      debouncedCheckUsername(formData.username);
    } else {
      setUsernameAvailable(null);
      setUsernameChecking(false);
    }
  }, [formData.username, debouncedCheckUsername]);

  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const isAgeValid = (dateOfBirth: string): boolean => {
    const age = calculateAge(dateOfBirth);
    return age >= 18;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (usernameAvailable !== true) {
      toast.error("Please choose a valid username");
      return;
    }

    if (!isAgeValid(formData.dateOfBirth)) {
      toast.error("You must be 18 or older to use PayZen");
      return;
    }

    const age = calculateAge(formData.dateOfBirth);

    setIsSubmitting(true);
    
    try {
      // Register user with backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          privyId: user.id,
          walletAddress,
          username: formData.username,
          fullName: formData.fullName,
          age: age,
          email: user.email?.address || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registration failed");
      }

      const result = await response.json();
      console.log("Registration successful:", result);

      // Update profile locally
      await updateProfile({
        fullName: formData.fullName,
        username: formData.username,
        age: age,
      });

      toast.success("Profile setup complete!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Onboarding failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to complete setup. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style jsx>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
          -webkit-text-fill-color: white !important;
          background-color: transparent !important;
          background-clip: content-box !important;
        }

        input[type="date"]:-webkit-autofill,
        input[type="date"]:-webkit-autofill:hover,
        input[type="date"]:-webkit-autofill:focus,
        input[type="date"]:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
          -webkit-text-fill-color: white !important;
          background-color: transparent !important;
          background-clip: content-box !important;
        }
      `}</style>

      <div className="flex-1 flex flex-col gap-2 justify-center">
        <div className="">
          <p className="text-white/50 text-sm mb-1.5">
            {`{`} personal information {`}`}
          </p>
          <div className="text-white text-2xl font-bold mb-3">
            Complete Your Profile
          </div>
          <div className="text-white/60 text-sm leading-relaxed max-w-md">
            Set up your account with basic information to get started with
            secure payments and access all PayZen features.
          </div>

          <form className="mt-10" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              {/* Full Name Field */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="fullname"
                  className="text-white text-sm font-medium"
                >
                  Full Name
                </label>
                <div className="relative w-full">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center pr-2 border-r border-white/10">
                    <User className="w-4 h-4 text-white/50" />
                  </div>
                  <input
                    type="text"
                    id="fullname"
                    name="fullname"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="flex border border-[#444645] bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-full pl-14 pr-4 h-12 rounded-lg placeholder:text-white/50 text-white autofill:bg-transparent autofill:text-white autofill:shadow-[inset_0_0_0px_1000px_transparent]"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              {/* Username Field */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="username"
                  className="text-white text-sm font-medium"
                >
                  Username
                </label>
                <div className="relative w-full">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center pr-2 border-r border-white/10">
                    <User className="w-4 h-4 text-white/50" />
                  </div>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={(e) => {
                      const username = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                      setFormData({ ...formData, username });
                    }}
                    className="flex border border-[#444645] bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-full pl-14 pr-4 h-12 rounded-lg placeholder:text-white/50 text-white autofill:bg-transparent autofill:text-white autofill:shadow-[inset_0_0_0px_1000px_transparent]"
                    placeholder="Choose a unique username"
                    required
                  />
                  {usernameChecking && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {/* Username feedback */}
                {formData.username.length > 0 && (
                  <div className="text-sm">
                    {usernameChecking ? (
                      <p className="text-white/60 flex items-center">
                        <div className="w-3 h-3 border-2 border-white/60 border-t-transparent rounded-full animate-spin mr-2" />
                        Checking availability...
                      </p>
                    ) : formData.username.length < 3 ? (
                      <p className="text-white/60">Username must be at least 3 characters</p>
                    ) : usernameAvailable === true ? (
                      <p className="text-green-400 flex items-center">
                        <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Username is available
                      </p>
                    ) : usernameAvailable === false ? (
                      <p className="text-red-400 flex items-center">
                        <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Username is already taken
                      </p>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Date of Birth Field */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="dateofbirth"
                  className="text-white text-sm font-medium"
                >
                  Date of Birth
                </label>
                <div className="relative w-full">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center pr-2 border-r border-white/10">
                    <Calendar className="w-4 h-4 text-white/50" />
                  </div>
                  <input
                    type="date"
                    id="dateofbirth"
                    name="dateofbirth"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="flex border border-[#444645] bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-full pl-14 pr-4 h-12 rounded-lg placeholder:text-white/50 text-white [color-scheme:dark]"
                    required
                  />
                </div>
                {/* Age validation feedback - only show error */}
                {formData.dateOfBirth && !isAgeValid(formData.dateOfBirth) && (
                  <div className="text-sm">
                    <p className="text-red-400 flex items-center">
                      <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Age: {calculateAge(formData.dateOfBirth)} years old - Must be 18 or older
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || usernameAvailable !== true || !formData.fullName.trim() || !formData.dateOfBirth || !isAgeValid(formData.dateOfBirth)}
              className="h-[45px] mt-10 w-full bg-[#A3FF50] hover:bg-[#A3FF50] cursor-pointer text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              variant={"destructive"}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                  Setting up...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </form>

          <p className="text-sm text-center mt-10 w- bottom-6 text-gray-500">
            By Proceeding, you agree to our{" "}
            <span className="text-white">Terms and Condition of use</span>{" "}
            and <span className="text-white">Privacy policy</span>. See how
            we handle your data here.
          </p>
        </div>
      </div>
    </>
  );
};

export default OnboardingForm;
