import { UserProfile } from './userProfileService';

export interface ProfileCompletionStatus {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
  nextStep: 'basic' | 'interests' | 'social' | 'privacy' | 'complete';
}

export interface OnboardingData {
  // Basic Info
  displayName: string;
  headline: string;
  occupation: string;
  bio?: string;
  profilePictureUrl?: string;

  // Interests (minimum 4 required)
  interests: string[];

  // Social Links (minimum 1 required)
  socialLinks: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };

  // Privacy Settings
  isVisible: boolean;
  distanceRadius: number;
  showAge: boolean;
  showEmail: boolean;
}

export class ProfileCompletionService {
  /**
   * Check if user profile is complete according to onboarding requirements
   */
  static checkProfileCompletion(profile: UserProfile | null): ProfileCompletionStatus {
    if (!profile) {
      return {
        isComplete: false,
        completionPercentage: 0,
        missingFields: ['displayName', 'headline', 'occupation', 'interests', 'socialLinks'],
        nextStep: 'basic'
      };
    }

    const missingFields: string[] = [];
    let completionPercentage = 0;
    let nextStep: ProfileCompletionStatus['nextStep'] = 'basic';

    // Check Basic Info (40% of completion)
    const basicFields = ['displayName', 'headline', 'occupation'];
    const basicComplete = basicFields.every(field => {
      const value = profile[field as keyof UserProfile];
      return value && value.toString().trim() !== '';
    });

    if (basicComplete) {
      completionPercentage += 40;
      nextStep = 'interests';
    } else {
      missingFields.push(...basicFields.filter(field => {
        const value = profile[field as keyof UserProfile];
        return !value || value.toString().trim() === '';
      }));
    }

    // Check Interests (30% of completion)
    const interestsComplete = profile.interests && profile.interests.length >= 4;
    if (interestsComplete) {
      completionPercentage += 30;
      if (nextStep === 'interests') nextStep = 'social';
    } else {
      missingFields.push('interests');
    }

    // Check Social Links (20% of completion)
    const socialLinksComplete = profile.socialLinks &&
      Object.values(profile.socialLinks).some(link => link && link.trim() !== '');
    if (socialLinksComplete) {
      completionPercentage += 20;
      if (nextStep === 'social') nextStep = 'privacy';
    } else {
      missingFields.push('socialLinks');
    }

    // Check Privacy Settings (10% of completion)
    const privacyComplete = profile.isVisible !== undefined && profile.distanceRadius !== undefined;
    if (privacyComplete) {
      completionPercentage += 10;
      if (nextStep === 'privacy') nextStep = 'complete';
    } else {
      missingFields.push('privacy');
    }

    return {
      isComplete: completionPercentage === 100,
      completionPercentage,
      missingFields,
      nextStep: completionPercentage === 100 ? 'complete' : nextStep
    };
  }

  /**
   * Get available interests for selection
   */
  static getAvailableInterests(): string[] {
    return [
      'Technology',
      'Business',
      'Marketing',
      'Design',
      'Finance',
      'Healthcare',
      'Education',
      'Engineering',
      'Sales',
      'Consulting',
      'Startups',
      'Innovation',
      'Leadership',
      'Networking',
      'Entrepreneurship',
      'Data Science',
      'Product Management',
      'Operations',
      'Human Resources',
      'Legal',
      'Real Estate',
      'Media',
      'Entertainment',
      'Sports',
      'Travel',
      'Food & Beverage',
      'Fashion',
      'Art',
      'Music',
      'Photography',
      'Writing',
      'Research',
      'Non-profit',
      'Government',
      'Retail',
      'Manufacturing',
      'Agriculture',
      'Energy',
      'Transportation',
      'Construction'
    ];
  }

  /**
   * Validate onboarding data for a specific step
   */
  static validateStep(step: string, data: Partial<OnboardingData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (step) {
      case 'basic':
        if (!data.displayName?.trim()) errors.push('Display name is required');
        if (!data.headline?.trim()) errors.push('Headline is required');
        if (!data.occupation?.trim()) errors.push('Occupation is required');
        break;

      case 'interests':
        if (!data.interests || data.interests.length < 4) {
          errors.push('Please select at least 4 interests');
        }
        break;

      case 'social':
        if (!data.socialLinks || !Object.values(data.socialLinks).some(link => link?.trim())) {
          errors.push('Please add at least one social link');
        }
        break;

      case 'privacy':
        if (data.isVisible === undefined) errors.push('Please set your visibility preference');
        if (data.distanceRadius === undefined) errors.push('Please set your distance radius');
        if (data.showAge === undefined) errors.push('Please choose whether to show your age');
        if (data.showEmail === undefined) errors.push('Please choose whether to show your email');
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get step title and description
   */
  static getStepInfo(step: string): { title: string; description: string } {
    switch (step) {
      case 'basic':
        return {
          title: 'Basic Information',
          description: 'Tell us about yourself so others can connect with you'
        };
      case 'interests':
        return {
          title: 'Your Interests',
          description: 'Select your professional interests to find like-minded people'
        };
      case 'social':
        return {
          title: 'Social Links',
          description: 'Add your social profiles to build trust and connections'
        };
      case 'privacy':
        return {
          title: 'Privacy Settings',
          description: 'Control who can see you and how far they can discover you'
        };
      default:
        return {
          title: 'Complete Profile',
          description: 'Finish setting up your profile'
        };
    }
  }
}
