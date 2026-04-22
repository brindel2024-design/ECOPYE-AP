'use client'

import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { ButtonHTMLAttributes, forwardRef } from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-brand text-white shadow-md hover:shadow-card-hover hover:brightness-110 focus:ring-brand-500',
        secondary:
          'bg-white text-brand-600 border-2 border-brand-500 hover:bg-brand-50 focus:ring-brand-500',
        ghost:
          'bg-transparent text-brand-600 hover:bg-brand-50 focus:ring-brand-400',
        danger:
          'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        outline:
          'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 focus:ring-gray-300',
        gold:
          'bg-gradient-gold text-white shadow-md hover:brightness-105 focus:ring-gold-500',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5 text-base',
        lg: 'px-7 py-3.5 text-lg',
        icon: 'w-10 h-10 p-0',
        'icon-lg': 'w-14 h-14 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'
export { Button, buttonVariants }
