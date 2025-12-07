import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  icon,
  isLoading,
  disabled,
  ...props 
}) => {
  // Theme: #544230 (Dark), #79614B (Med), #A08267 (Tan), #C9A585 (Beige)
  
  const baseStyles = "px-6 py-3 rounded-xl font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  
  const variants = {
    // Primary: Dark Brown
    primary: "bg-[#544230] text-[#F5F1E8] hover:bg-[#3E3022] shadow-md hover:shadow-lg border-2 border-[#544230]",
    
    // Secondary: Tan
    secondary: "bg-[#A08267] text-white hover:bg-[#8D7058] shadow-md border-2 border-[#A08267]",
    
    // Outline: Dark Brown Border
    outline: "border-2 border-[#544230] text-[#544230] bg-transparent hover:bg-[#544230] hover:text-[#F5F1E8]",
    
    // Ghost: Transparent
    ghost: "bg-transparent text-[#79614B] hover:bg-[#544230]/10",

    // Danger: Reddish (using a complementary earthy red if possible, but sticking to standard red for clarity)
    danger: "bg-[#9A3B3B] text-white hover:bg-[#7a2e2e] border-2 border-[#9A3B3B]",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!isLoading && icon}
      {children}
    </button>
  );
};

export default Button;