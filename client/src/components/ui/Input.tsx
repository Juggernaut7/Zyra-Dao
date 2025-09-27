import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = Boolean(props.value || props.defaultValue);

  return (
    <div className="relative">
      {label && (
        <motion.label
          className={`absolute left-3 transition-all duration-200 pointer-events-none ${
            isFocused || hasValue
              ? 'top-1 text-xs text-brandBlue-500'
              : 'top-3 text-sm text-neutral-500'
          }`}
          initial={false}
          animate={{
            y: isFocused || hasValue ? -8 : 0,
            scale: isFocused || hasValue ? 0.85 : 1
          }}
        >
          {label}
        </motion.label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500">
            {icon}
          </div>
        )}
        
        <input
          className={`
            w-full px-3 pt-4 pb-2 border-b-2 border-neutral-300 
            focus:border-brandBlue-500 focus:outline-none
            bg-transparent transition-colors duration-200
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-danger' : ''}
            ${className}
          `}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-danger text-xs mt-1"
        >
          {error}
        </motion.p>
      )}
      
      {helperText && !error && (
        <p className="text-neutral-500 text-xs mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
