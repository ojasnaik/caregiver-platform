import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './SignupForm.css';

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

  // Initialize kids age groups when numberOfKids changes
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
    
    // Clear error when user starts typing
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
      // Clear alias when toggled off and related error
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
      // Add new kids with default age group
      const newKids = Array(numberOfKids - currentLength).fill('0-3');
      setFormData(prev => ({
        ...prev,
        kidsAgeGroups: [...prev.kidsAgeGroups, ...newKids]
      }));
    } else if (numberOfKids < currentLength) {
      // Remove excess kids
      setFormData(prev => ({
        ...prev,
        kidsAgeGroups: prev.kidsAgeGroups.slice(0, numberOfKids)
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Alias validation (only if enabled)
    if (useAlias && formData.alias.trim()) {
      if (formData.alias.trim().length < 2) {
        newErrors.alias = 'Alias must be at least 2 characters';
      } else if (formData.alias.trim().length > 50) {
        newErrors.alias = 'Alias cannot exceed 50 characters';
      }
    }

    // Age validation
    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (parseInt(formData.age) < 18 || parseInt(formData.age) > 100) {
      newErrors.age = 'Age must be between 18 and 100';
    }

    // Caregiver type validation
    if (!formData.caregiverType) {
      newErrors.caregiverType = 'Please select your caregiver type';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Number of kids validation
    if (!formData.numberOfKids) {
      newErrors.numberOfKids = 'Number of kids is required';
    } else if (parseInt(formData.numberOfKids) < 1 || parseInt(formData.numberOfKids) > 20) {
      newErrors.numberOfKids = 'Number of kids must be between 1 and 20';
    }

    // Kids age groups validation
    if (formData.kidsAgeGroups.length !== parseInt(formData.numberOfKids)) {
      newErrors.kidsAgeGroups = `Please select age group for all ${formData.numberOfKids} children`;
    } else {
      formData.kidsAgeGroups.forEach((ageGroup, index) => {
        if (!ageGroup) {
          newErrors.kidsAgeGroups = `Please select age group for child ${index + 1}`;
        }
      });
    }

    // Additional info validation
    if (formData.additionalInfo && formData.additionalInfo.length > 500) {
      newErrors.additionalInfo = 'Additional info cannot exceed 500 characters';
    }

    // Location validation
    if (formData.city && formData.city.trim().length > 50) {
      newErrors.city = 'City name cannot exceed 50 characters';
    }
    if (formData.state && formData.state.trim().length > 50) {
      newErrors.state = 'State name cannot exceed 50 characters';
    }

    // Adult certification validation
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
      const response = await fetch('http://localhost:5000/api/auth/signup', {
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
        // Redirect to login page after successful signup
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

  return (
    <div className="signup-container">
      <div className="signup-form-wrapper">
        <h1>Join Our Caregiver Community</h1>
        <p className="signup-subtitle">Connect with other single parents and caregivers</p>
        
        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={errors.name ? 'error' : ''}
              placeholder="Enter your full name"
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={useAlias}
              onChange={handleUseAliasToggle}
              style={{ marginRight: '8px' }}
            />
            I want to add an alias (hide my real name from other users)
          </label>
        </div>

        {useAlias && (
          <div className="form-group">
            <label htmlFor="alias">Alias</label>
            <input
              type="text"
              id="alias"
              name="alias"
              value={formData.alias}
              onChange={handleInputChange}
              className={errors.alias ? 'error' : ''}
              placeholder="Enter an alias to display instead of your name"
            />
            {errors.alias && <span className="error-message">{errors.alias}</span>}
          </div>
        )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="age">Age *</label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className={errors.age ? 'error' : ''}
                placeholder="25"
                min="18"
                max="100"
              />
              {errors.age && <span className="error-message">{errors.age}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="caregiverType">I am a *</label>
              <select
                id="caregiverType"
                name="caregiverType"
                value={formData.caregiverType}
                onChange={handleInputChange}
                className={errors.caregiverType ? 'error' : ''}
              >
                <option value="">Select your role</option>
                <option value="parent">Parent</option>
                <option value="guardian">Guardian</option>
                <option value="grandparent">Grandparent</option>
              </select>
              {errors.caregiverType && <span className="error-message">{errors.caregiverType}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={errors.email ? 'error' : ''}
              placeholder="your.email@example.com"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className={errors.city ? 'error' : ''}
                placeholder="Enter your city"
                maxLength="50"
              />
              {errors.city && <span className="error-message">{errors.city}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="state">State</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className={errors.state ? 'error' : ''}
                placeholder="Enter your state"
                maxLength="50"
              />
              {errors.state && <span className="error-message">{errors.state}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={errors.password ? 'error' : ''}
                placeholder="At least 6 characters"
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={errors.confirmPassword ? 'error' : ''}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="numberOfKids">Number of Children *</label>
            <input
              type="number"
              id="numberOfKids"
              name="numberOfKids"
              value={formData.numberOfKids}
              onChange={handleInputChange}
              className={errors.numberOfKids ? 'error' : ''}
              placeholder="1"
              min="1"
              max="20"
            />
            {errors.numberOfKids && <span className="error-message">{errors.numberOfKids}</span>}
          </div>

          {formData.numberOfKids && (
            <div className="form-group">
              <label>Children's Age Groups *</label>
              <div className="kids-ages-container">
                {Array.from({ length: parseInt(formData.numberOfKids) || 0 }, (_, index) => (
                  <div key={index} className="kid-age-input">
                    <label htmlFor={`kidAgeGroup${index}`}>Child {index + 1} Age Group</label>
                    <select
                      id={`kidAgeGroup${index}`}
                      value={formData.kidsAgeGroups[index] || ''}
                      onChange={(e) => handleKidAgeGroupChange(index, e.target.value)}
                      className={errors.kidsAgeGroups ? 'error' : ''}
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
              {errors.kidsAgeGroups && <span className="error-message">{errors.kidsAgeGroups}</span>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="additionalInfo">Additional Information (Optional)</label>
            <textarea
              id="additionalInfo"
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={handleInputChange}
              className={errors.additionalInfo ? 'error' : ''}
              placeholder="Tell us about your family, interests, or anything else you'd like to share..."
              rows="4"
              maxLength="500"
            />
            <div className="char-count">
              {formData.additionalInfo.length}/500 characters
            </div>
            {errors.additionalInfo && <span className="error-message">{errors.additionalInfo}</span>}
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleInputChange}
                style={{ marginRight: '8px' }}
              />
              Keep my profile private (other users won't be able to see my information)
            </label>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="showLocation"
                checked={formData.showLocation}
                onChange={handleInputChange}
                style={{ marginRight: '8px' }}
              />
              Show my location to other users (city and state will be visible in my profile)
            </label>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="certifyAdult"
                checked={formData.certifyAdult}
                onChange={handleInputChange}
                style={{ marginRight: '8px' }}
              />
              I certify that I am 18 years of age or older
            </label>
            {errors.certifyAdult && <span className="error-message">{errors.certifyAdult}</span>}
          </div>

          {submitMessage && (
            <div className={`submit-message ${submitMessage.includes('successfully') ? 'success' : 'error'}`}>
              {submitMessage}
            </div>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="login-link">
          <p>Already have an account? <Link to="/login">Sign in here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
