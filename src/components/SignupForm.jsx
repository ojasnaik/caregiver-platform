import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../config';

const SignupForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    alias: '',
    age: '',
    caregiverType: '',
    email: '',
    password: '',
    confirmPassword: '',
    numberOfKids: '',
    kidsAgeGroups: [],
    additionalInfo: '',
    isPrivate: false,
    city: '',
    state: '',
    showLocation: true,
    certifyAdult: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [useAlias, setUseAlias] = useState(false);

  useEffect(() => {
    if (formData.numberOfKids) {
      initializeKidsAgeGroups();
    }
  }, [formData.numberOfKids]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({
      ...prev,
      [name]: nextValue
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleUseAliasToggle = (e) => {
    const checked = e.target.checked;
    setUseAlias(checked);
    if (!checked) {
      setFormData(prev => ({ ...prev, alias: '' }));
      if (errors.alias) {
        setErrors(prev => ({ ...prev, alias: '' }));
      }
    }
  };

  const handleKidAgeGroupChange = (index, value) => {
    const newKidsAgeGroups = [...formData.kidsAgeGroups];
    newKidsAgeGroups[index] = value;
    setFormData(prev => ({
      ...prev,
      kidsAgeGroups: newKidsAgeGroups
    }));
    if (errors.kidsAgeGroups) {
      setErrors(prev => ({ ...prev, kidsAgeGroups: '' }));
    }
  };

  const initializeKidsAgeGroups = () => {
    const numberOfKids = parseInt(formData.numberOfKids) || 0;
    const currentLength = formData.kidsAgeGroups.length;

    if (numberOfKids > currentLength) {
      const newKids = Array(numberOfKids - currentLength).fill('0-3');
      setFormData(prev => ({
        ...prev,
        kidsAgeGroups: [...prev.kidsAgeGroups, ...newKids]
      }));
    } else if (numberOfKids < currentLength) {
      setFormData(prev => ({
        ...prev,
        kidsAgeGroups: prev.kidsAgeGroups.slice(0, numberOfKids)
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (useAlias && formData.alias.trim()) {
      if (formData.alias.trim().length < 2) {
        newErrors.alias = 'Alias must be at least 2 characters';
      } else if (formData.alias.trim().length > 50) {
        newErrors.alias = 'Alias cannot exceed 50 characters';
      }
    }

    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (parseInt(formData.age) < 18 || parseInt(formData.age) > 100) {
      newErrors.age = 'Age must be between 18 and 100';
    }

    if (!formData.caregiverType) {
      newErrors.caregiverType = 'Please select your caregiver type';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.numberOfKids) {
      newErrors.numberOfKids = 'Number of kids is required';
    } else if (parseInt(formData.numberOfKids) < 1 || parseInt(formData.numberOfKids) > 20) {
      newErrors.numberOfKids = 'Number of kids must be between 1 and 20';
    }

    if (formData.kidsAgeGroups.length !== parseInt(formData.numberOfKids)) {
      newErrors.kidsAgeGroups = `Please select age group for all ${formData.numberOfKids} children`;
    } else {
      formData.kidsAgeGroups.forEach((ageGroup, index) => {
        if (!ageGroup) {
          newErrors.kidsAgeGroups = `Please select age group for child ${index + 1}`;
        }
      });
    }

    if (formData.additionalInfo && formData.additionalInfo.length > 500) {
      newErrors.additionalInfo = 'Additional info cannot exceed 500 characters';
    }

    if (formData.city && formData.city.trim().length > 50) {
      newErrors.city = 'City name cannot exceed 50 characters';
    }
    if (formData.state && formData.state.trim().length > 50) {
      newErrors.state = 'State name cannot exceed 50 characters';
    }

    if (!formData.certifyAdult) {
      newErrors.certifyAdult = 'You must certify that you are 18 or older';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          alias: useAlias && formData.alias.trim() ? formData.alias.trim() : undefined,
          age: parseInt(formData.age),
          caregiverType: formData.caregiverType,
          email: formData.email.toLowerCase(),
          password: formData.password,
          familyInfo: {
            numberOfKids: parseInt(formData.numberOfKids),
            kidsAgeGroups: formData.kidsAgeGroups,
            additionalInfo: formData.additionalInfo.trim()
          },
          isPrivate: formData.isPrivate,
          location: {
            city: formData.city.trim(),
            state: formData.state.trim()
          },
          showLocation: formData.showLocation
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitMessage('Account created successfully! Redirecting to login...');
        setFormData({
          name: '',
          alias: '',
          age: '',
          caregiverType: '',
          email: '',
          password: '',
          confirmPassword: '',
          numberOfKids: '',
          kidsAgeGroups: [],
          additionalInfo: '',
          isPrivate: false,
          city: '',
          state: '',
          showLocation: true,
          certifyAdult: false
        });
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setSubmitMessage(data.message || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setSubmitMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `px-4 py-3 border-2 ${errors[field] ? 'border-red-400 bg-red-100' : 'border-gray-200 bg-[#fafafa]'} rounded-lg text-base text-[#2d3748] focus:outline-none focus:border-[#667eea] focus:bg-white transition-all w-full`;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-brand-gradient p-5">
      <div className="bg-white rounded-xl shadow-2xl p-8 sm:p-10 w-full max-w-sm sm:max-w-xl my-5">
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-[#2d3748] mb-2">Join Our Caregiver Community</h1>
        <p className="text-center text-gray-500 text-base sm:text-lg mb-8">Connect with other single parents and caregivers</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="font-semibold text-[#2d3748] text-sm">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={inputClass('name')}
              placeholder="Enter your full name"
            />
            {errors.name && <span className="text-red-500 text-sm font-medium">{errors.name}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#2d3748] text-sm">
              <input
                type="checkbox"
                checked={useAlias}
                onChange={handleUseAliasToggle}
                className="mr-2"
              />
              I want to add an alias (hide my real name from other users)
            </label>
          </div>

          {useAlias && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="alias" className="font-semibold text-[#2d3748] text-sm">Alias</label>
              <input
                type="text"
                id="alias"
                name="alias"
                value={formData.alias}
                onChange={handleInputChange}
                className={inputClass('alias')}
                placeholder="Enter an alias to display instead of your name"
              />
              {errors.alias && <span className="text-red-500 text-sm font-medium">{errors.alias}</span>}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="age" className="font-semibold text-[#2d3748] text-sm">Age *</label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className={inputClass('age')}
                placeholder="25"
                min="18"
                max="100"
              />
              {errors.age && <span className="text-red-500 text-sm font-medium">{errors.age}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="caregiverType" className="font-semibold text-[#2d3748] text-sm">I am a *</label>
              <select
                id="caregiverType"
                name="caregiverType"
                value={formData.caregiverType}
                onChange={handleInputChange}
                className={inputClass('caregiverType')}
              >
                <option value="">Select your role</option>
                <option value="parent">Parent</option>
                <option value="guardian">Guardian</option>
                <option value="grandparent">Grandparent</option>
              </select>
              {errors.caregiverType && <span className="text-red-500 text-sm font-medium">{errors.caregiverType}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="font-semibold text-[#2d3748] text-sm">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={inputClass('email')}
              placeholder="your.email@example.com"
            />
            {errors.email && <span className="text-red-500 text-sm font-medium">{errors.email}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="city" className="font-semibold text-[#2d3748] text-sm">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className={inputClass('city')}
                placeholder="Enter your city"
                maxLength="50"
              />
              {errors.city && <span className="text-red-500 text-sm font-medium">{errors.city}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="state" className="font-semibold text-[#2d3748] text-sm">State</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className={inputClass('state')}
                placeholder="Enter your state"
                maxLength="50"
              />
              {errors.state && <span className="text-red-500 text-sm font-medium">{errors.state}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="font-semibold text-[#2d3748] text-sm">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={inputClass('password')}
                placeholder="At least 6 characters"
              />
              {errors.password && <span className="text-red-500 text-sm font-medium">{errors.password}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="font-semibold text-[#2d3748] text-sm">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={inputClass('confirmPassword')}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && <span className="text-red-500 text-sm font-medium">{errors.confirmPassword}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="numberOfKids" className="font-semibold text-[#2d3748] text-sm">Number of Children *</label>
            <input
              type="number"
              id="numberOfKids"
              name="numberOfKids"
              value={formData.numberOfKids}
              onChange={handleInputChange}
              className={inputClass('numberOfKids')}
              placeholder="1"
              min="1"
              max="20"
            />
            {errors.numberOfKids && <span className="text-red-500 text-sm font-medium">{errors.numberOfKids}</span>}
          </div>

          {formData.numberOfKids && (
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#2d3748] text-sm">Children's Age Groups *</label>
              <div className="flex flex-col gap-3">
                {Array.from({ length: parseInt(formData.numberOfKids) || 0 }, (_, index) => (
                  <div key={index} className="flex flex-col gap-1.5">
                    <label htmlFor={`kidAgeGroup${index}`} className="text-sm text-gray-600 font-medium">Child {index + 1} Age Group</label>
                    <select
                      id={`kidAgeGroup${index}`}
                      value={formData.kidsAgeGroups[index] || ''}
                      onChange={(e) => handleKidAgeGroupChange(index, e.target.value)}
                      className={`px-4 py-3 border-2 ${errors.kidsAgeGroups ? 'border-red-400 bg-red-100' : 'border-gray-200 bg-[#fafafa]'} rounded-lg text-base text-[#2d3748] focus:outline-none focus:border-[#667eea] focus:bg-white transition-all w-full`}
                    >
                      <option value="">Select age group</option>
                      <option value="0-3">0-3 years</option>
                      <option value="4-6">4-6 years</option>
                      <option value="7-12">7-12 years</option>
                      <option value="13-18">13-18 years</option>
                    </select>
                  </div>
                ))}
              </div>
              {errors.kidsAgeGroups && <span className="text-red-500 text-sm font-medium">{errors.kidsAgeGroups}</span>}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="additionalInfo" className="font-semibold text-[#2d3748] text-sm">Additional Information (Optional)</label>
            <textarea
              id="additionalInfo"
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={handleInputChange}
              className={inputClass('additionalInfo')}
              placeholder="Tell us about your family, interests, or anything else you'd like to share..."
              rows="4"
              maxLength="500"
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {formData.additionalInfo.length}/500 characters
            </div>
            {errors.additionalInfo && <span className="text-red-500 text-sm font-medium">{errors.additionalInfo}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#2d3748] text-sm">
              <input
                type="checkbox"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleInputChange}
                className="mr-2"
              />
              Keep my profile private (other users won't be able to see my information)
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#2d3748] text-sm">
              <input
                type="checkbox"
                name="showLocation"
                checked={formData.showLocation}
                onChange={handleInputChange}
                className="mr-2"
              />
              Show my location to other users (city and state will be visible in my profile)
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#2d3748] text-sm">
              <input
                type="checkbox"
                name="certifyAdult"
                checked={formData.certifyAdult}
                onChange={handleInputChange}
                className="mr-2"
              />
              I certify that I am 18 years of age or older
            </label>
            {errors.certifyAdult && <span className="text-red-500 text-sm font-medium">{errors.certifyAdult}</span>}
          </div>

          {submitMessage && (
            <div className={`p-3 rounded-lg font-medium text-center ${submitMessage.includes('successfully') ? 'bg-green-100 text-green-900 border border-green-300' : 'bg-red-100 text-red-900 border border-red-300'}`}>
              {submitMessage}
            </div>
          )}

          <button
            type="submit"
            className="bg-brand-gradient text-white border-0 rounded-lg py-4 w-full text-lg font-semibold cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-gray-200">
          <p className="text-gray-500 m-0">Already have an account? <Link to="/login" className="text-[#667eea] no-underline font-semibold hover:underline">Sign in here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
