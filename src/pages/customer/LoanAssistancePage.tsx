import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { userAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const loanRequestAPI = {
  createLoanRequest: (token: string, data: any) =>
    axios.post(`${API_BASE_URL}/loan-requests`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),
};

const LOAN_TYPES = ['Home Loan', 'Plot Loan', 'Construction Loan', 'Home Improvement Loan', 'Balance Transfer', 'Top-Up Loan'];
const EMPLOYMENT_TYPES = ['Salaried', 'Self-Employed', 'Business Owner', 'Freelancer'];
const TENURES = ['5 Years', '10 Years', '15 Years', '20 Years', '25 Years', '30 Years'];
const CONTACT_TIMES = ['Morning (9–12)', 'Afternoon (12–4)', 'Evening (4–7)'];

const formatCurrency = (value: string) => {
  const num = value.replace(/[^0-9]/g, '');
  if (!num) return '';
  return new Intl.NumberFormat('en-IN').format(parseInt(num));
};

export const LoanAssistancePage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    loanType: '',
    propertyCategory: '',
    propertyValue: '',
    loanAmountNeeded: '',
    employmentType: '',
    monthlyIncome: '',
    preferredTenure: '',
    existingLoans: false,
    existingLoanDetails: '',
    preferredContactTime: '',
    additionalNotes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['property-categories'],
    queryFn: () => userAPI.getCategories(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const categories = categoriesData?.data?.categories || [];

  const submitMutation = useMutation({
    mutationFn: (data: any) => loanRequestAPI.createLoanRequest(token!, data),
    onSuccess: () => {
      toast.success('Loan request received — our finance team will contact you.');
      navigate('/contact');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit loan request');
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.loanType) newErrors.loanType = 'Loan type is required';
    if (!formData.propertyCategory) newErrors.propertyCategory = 'Property category is required';
    if (!formData.propertyValue) newErrors.propertyValue = 'Property value is required';
    if (!formData.loanAmountNeeded) newErrors.loanAmountNeeded = 'Loan amount is required';
    if (!formData.employmentType) newErrors.employmentType = 'Employment type is required';
    if (!formData.monthlyIncome) newErrors.monthlyIncome = 'Monthly income is required';
    if (!formData.preferredTenure) newErrors.preferredTenure = 'Preferred tenure is required';
    if (!formData.preferredContactTime) newErrors.preferredContactTime = 'Preferred contact time is required';

    const propertyValue = parseInt(formData.propertyValue.replace(/,/g, ''));
    const loanAmount = parseInt(formData.loanAmountNeeded.replace(/,/g, ''));

    if (loanAmount > propertyValue) {
      newErrors.loanAmountNeeded = 'Loan amount cannot exceed property value';
    }

    if (formData.existingLoans && !formData.existingLoanDetails.trim()) {
      newErrors.existingLoanDetails = 'Please provide existing loan details';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const payload = {
      loanType: formData.loanType,
      propertyCategory: formData.propertyCategory,
      propertyValue: parseInt(formData.propertyValue.replace(/,/g, '')),
      loanAmountNeeded: parseInt(formData.loanAmountNeeded.replace(/,/g, '')),
      employmentType: formData.employmentType,
      monthlyIncome: parseInt(formData.monthlyIncome.replace(/,/g, '')),
      preferredTenure: formData.preferredTenure,
      existingLoans: formData.existingLoans,
      existingLoanDetails: formData.existingLoanDetails || undefined,
      preferredContactTime: formData.preferredContactTime,
      additionalNotes: formData.additionalNotes || undefined,
    };

    submitMutation.mutate(payload);
  };

  const renderDropdown = (field: string, options: string[], label: string) => (
    <div className="mb-4 sm:mb-5">
      <label className="block text-sm sm:text-base font-semibold text-foreground mb-2">
        {label} <span className="text-destructive">*</span>
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowDropdown(showDropdown === field ? null : field)}
          className={`w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-muted/50 border rounded-xl text-sm sm:text-base transition-colors ${
            errors[field] ? 'border-destructive' : 'border-border hover:border-primary/50'
          }`}
        >
          <span className={formData[field as keyof typeof formData] ? 'text-foreground' : 'text-muted-foreground'}>
            {formData[field as keyof typeof formData] || `Select ${label.toLowerCase()}`}
          </span>
          {showDropdown === field ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showDropdown === field && options.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setFormData({ ...formData, [field]: option });
                  setShowDropdown(null);
                  setErrors({ ...errors, [field]: '' });
                }}
                className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base hover:bg-muted transition-colors border-b border-border/50 last:border-0"
              >
                {option}
              </button>
            ))}
          </div>
        )}
        {showDropdown === field && options.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">No options available</p>
          </div>
        )}
      </div>
      {errors[field] && <p className="text-destructive text-xs sm:text-sm mt-1 font-medium">{errors[field]}</p>}
    </div>
  );

  const renderCurrencyInput = (field: string, label: string, placeholder: string) => (
    <div className="mb-4 sm:mb-5">
      <label className="block text-sm sm:text-base font-semibold text-foreground mb-2">
        {label} <span className="text-destructive">*</span>
      </label>
      <div className={`flex items-center px-3 sm:px-4 bg-muted/50 border rounded-xl ${errors[field] ? 'border-destructive' : 'border-border'}`}>
        <span className="text-muted-foreground font-semibold mr-2">₹</span>
        <input
          type="text"
          placeholder={placeholder}
          value={formData[field as keyof typeof formData] as string}
          onChange={(e) => {
            const formatted = formatCurrency(e.target.value);
            setFormData({ ...formData, [field]: formatted });
            setErrors({ ...errors, [field]: '' });
          }}
          className="flex-1 py-2.5 sm:py-3 bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
      {errors[field] && <p className="text-destructive text-xs sm:text-sm mt-1 font-medium">{errors[field]}</p>}
    </div>
  );

  const isFormValid = formData.loanType && formData.propertyCategory && formData.propertyValue &&
    formData.loanAmountNeeded && formData.employmentType && formData.monthlyIncome &&
    formData.preferredTenure && formData.preferredContactTime &&
    (!formData.existingLoans || formData.existingLoanDetails.trim());



  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 py-4 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Loan Request</h1>
        <div className="w-9 sm:w-10" />
      </div>

      <div className="px-4 sm:px-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-5 md:p-6 shadow-sm"
        >
          {/* Header Section */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-muted rounded-full mb-3 sm:mb-4">
              <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-foreground" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Loan Assistance Form</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Our dedicated finance team partners with leading banks to secure the best loan rates for you. Complete this form and expect a personalized response within 24-48 hours.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              {renderDropdown('loanType', LOAN_TYPES, 'Loan Type')}
              {categoriesLoading ? (
                <div className="mb-4 sm:mb-5">
                  <label className="block text-sm sm:text-base font-semibold text-foreground mb-2">
                    Property Category <span className="text-destructive">*</span>
                  </label>
                  <div className="flex items-center gap-2 px-4 py-3 border border-border rounded-xl bg-muted/50">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading categories...</span>
                  </div>
                </div>
              ) : (
                renderDropdown('propertyCategory', categories, 'Property Category')
              )}
              {renderCurrencyInput('propertyValue', 'Property Value', 'Enter property value')}
              {renderCurrencyInput('loanAmountNeeded', 'Loan Amount Needed', 'Enter loan amount')}
              {renderDropdown('employmentType', EMPLOYMENT_TYPES, 'Employment Type')}
              {renderCurrencyInput('monthlyIncome', 'Monthly Income', 'Enter monthly income')}
              {renderDropdown('preferredTenure', TENURES, 'Preferred Tenure')}

              {/* Existing Loans */}
              <div className="mb-4 sm:mb-5">
                <label className="block text-sm sm:text-base font-semibold text-foreground mb-2">
                  Existing Loans <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-4 sm:gap-6">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, existingLoans: false, existingLoanDetails: '' })}
                    className="flex items-center gap-2"
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!formData.existingLoans ? 'border-primary' : 'border-border'}`}>
                      {!formData.existingLoans && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <span className="text-sm sm:text-base text-foreground">No</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, existingLoans: true })}
                    className="flex items-center gap-2"
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.existingLoans ? 'border-primary' : 'border-border'}`}>
                      {formData.existingLoans && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <span className="text-sm sm:text-base text-foreground">Yes</span>
                  </button>
                </div>
              </div>

              {formData.existingLoans && (
                <div className="mb-4 sm:mb-5">
                  <label className="block text-sm sm:text-base font-semibold text-foreground mb-2">
                    Existing Loan Details <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    placeholder="Provide details about your existing loans"
                    value={formData.existingLoanDetails}
                    onChange={(e) => {
                      setFormData({ ...formData, existingLoanDetails: e.target.value });
                      setErrors({ ...errors, existingLoanDetails: '' });
                    }}
                    rows={3}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-muted/50 border rounded-xl text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
                      errors.existingLoanDetails ? 'border-destructive' : 'border-border'
                    }`}
                  />
                  {errors.existingLoanDetails && <p className="text-destructive text-xs sm:text-sm mt-1 font-medium">{errors.existingLoanDetails}</p>}
                </div>
              )}

              {renderDropdown('preferredContactTime', CONTACT_TIMES, 'Preferred Contact Time')}

              {/* Additional Notes */}
              <div className="mb-4 sm:mb-5">
                <label className="block text-sm sm:text-base font-semibold text-foreground mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  placeholder="Any additional information you'd like to share"
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value.slice(0, 1000) })}
                  rows={4}
                  maxLength={1000}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-muted/50 border border-border rounded-xl text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 text-right">
                  {formData.additionalNotes.length}/1000
                </p>
              </div>
            </form>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || submitMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-sm sm:text-base shadow-md transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Submit Request
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
};
