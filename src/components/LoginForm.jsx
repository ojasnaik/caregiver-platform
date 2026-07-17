import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../config';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
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
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          password: formData.password
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitMessage('Login successful! Redirecting...');
        localStorage.setItem('user', JSON.stringify(data.user));
        setTimeout(() => {
          navigate('/home');
        }, 1000);
      } else {
        setSubmitMessage(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setSubmitMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `px-4 py-3 border-2 ${errors[field] ? 'border-red-400 bg-red-100' : 'border-gray-200 bg-[#fafafa]'} rounded-lg text-base text-[#2d3748] focus:outline-none focus:border-[#667eea] focus:bg-white transition-all w-full`;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-brand-gradient p-5">
      <div className="bg-white rounded-xl shadow-2xl p-8 sm:p-10 w-full max-w-sm sm:max-w-md my-5">
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-[#2d3748] mb-2">Welcome Back</h1>
        <p className="text-center text-gray-500 text-base sm:text-lg mb-8">Sign in to your caregiver account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="font-semibold text-[#2d3748] text-sm">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={inputClass('password')}
              placeholder="Enter your password"
            />
            {errors.password && <span className="text-red-500 text-sm font-medium">{errors.password}</span>}
          </div>

          {submitMessage && (
            <div className={`p-3 rounded-lg font-medium text-center ${submitMessage.includes('successful') ? 'bg-green-100 text-green-900 border border-green-300' : 'bg-red-100 text-red-900 border border-red-300'}`}>
              {submitMessage}
            </div>
          )}

          <button
            type="submit"
            className="bg-brand-gradient text-white border-0 rounded-lg py-4 w-full text-lg font-semibold cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-gray-200">
          <p className="text-gray-500 m-0">Don't have an account? <Link to="/signup" className="text-[#667eea] no-underline font-semibold hover:underline">Create one here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
