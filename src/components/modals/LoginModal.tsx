import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Phone, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { authAPI } from '../../utils/api';

const phoneSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit mobile number'),
});

type PhoneFormData = z.infer<typeof phoneSchema>;

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOTPSent: (phone: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onOTPSent }) => {
  const form = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const sendOTPMutation = useMutation({
    mutationFn: (phone: string) => authAPI.sendOTP(phone),
    onSuccess: (_, phone) => {
      toast.success('OTP sent successfully!');
      onOTPSent(phone);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    },
  });

  const onSubmit = (data: PhoneFormData) => {
    sendOTPMutation.mutate(data.phone);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center sm:text-left">Welcome Back</DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-center sm:text-left">
            Sign in to access your real estate portfolio
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5 mt-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Mobile Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage className="text-xs sm:text-sm" />
                </FormItem>
              )}
            />
            <Button type="submit" loading={sendOTPMutation.isPending} icon={ArrowRight} fullWidth>
              Send OTP
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
