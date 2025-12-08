import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import { Button } from "../ui/Button";
import { authAPI, userAPI, propertyAPI, bannerAPI } from "../../utils/api";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  onVerified: (profileCompleted: boolean, user: any) => void;
}

export const OTPModal: React.FC<OTPModalProps> = ({
  isOpen,
  onClose,
  phone,
  onVerified,
}) => {
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isOpen) {
      setOtp("");
      setResendTimer(30);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setResendTimer(30);
      const interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const verifyOTPMutation = useMutation({
    mutationFn: (otpCode: string) => authAPI.verifyOTP(phone, otpCode),
    onSuccess: async (response) => {
      const { token, user, profileCompleted } = response.data;
      const userRole = user.role?.toLowerCase();

      // Check if account is deleted
      if (user.deleted) {
        toast.dismiss();
        toast.error("Your account is deleted. Please contact Administrator.");
        onClose();
        return;
      }

      setAuth(user, token);

      // Background data prefetch
      if (profileCompleted) {
        Promise.all([
          userAPI.getProfile(token).catch(() => null),
          propertyAPI.getProperties(token).catch(() => null),
          bannerAPI.getBanners(token).catch(() => null),
        ]);
      }

      toast.success("OTP verified successfully!");
      onVerified(profileCompleted, user);

      // Navigate based on role
      if (profileCompleted) {
        if (userRole === "admin") {
          navigate("/admin/home");
        } else if (userRole === "employee") {
          navigate("/employee/home");
        } else if (userRole === "agent" && user.approved !== true) {
          navigate("/pending-verification");
        } else {
          navigate("/home");
        }
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "Invalid OTP";

      // Dismiss any existing toasts first
      toast.dismiss();

      // Check if error is about deleted account
      if (
        errorMessage.toLowerCase().includes("deleted") ||
        errorMessage === "account_deleted"
      ) {
        toast.error("Your account is deleted. Please contact Administrator.");
      } else {
        toast.error(errorMessage);
      }

      setOtp("");

      // Close modal if account is deleted
      if (
        errorMessage.toLowerCase().includes("deleted") ||
        errorMessage === "account_deleted"
      ) {
        onClose();
      }
    },
  });

  const resendOTPMutation = useMutation({
    mutationFn: () => authAPI.sendOTP(phone),
    onSuccess: () => {
      toast.success("OTP sent successfully");
      setResendTimer(30);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    },
  });

  useEffect(() => {
    if (otp.length === 4) {
      verifyOTPMutation.mutate(otp);
    }
  }, [otp]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader className="space-y-3">
          <div className="flex justify-center mb-2">
            <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
            Verify OTP
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-center">
            Enter the 4-digit code sent to <strong>{phone}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 sm:space-y-6 mt-4">
          <div className="flex justify-center">
            <InputOTP maxLength={4} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          {verifyOTPMutation.isPending && (
            <p className="text-center text-xs sm:text-sm text-blue-600">
              Verifying...
            </p>
          )}
          <div className="text-center">
            <button
              onClick={() => resendOTPMutation.mutate()}
              disabled={resendTimer > 0 || resendOTPMutation.isPending}
              className="text-xs sm:text-sm underline disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {resendTimer > 0
                ? `Resend OTP in ${resendTimer}s`
                : resendOTPMutation.isPending
                ? "Sending..."
                : "Resend OTP"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};