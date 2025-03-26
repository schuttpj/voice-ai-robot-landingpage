"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Mic } from "lucide-react"

const gradientButtonVariants = cva(
  [
    "gradient-button",
    "inline-flex items-center justify-center",
    "text-base font-[500] text-white",
    "font-sans font-bold",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    "relative overflow-hidden",
    "transition-transform duration-200",
  ],
  {
    variants: {
      variant: {
        default: "",
        variant: "gradient-button-variant",
      },
      size: {
        default: "rounded-[11px] min-w-[132px] px-9 py-4",
        round: "rounded-full w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 p-0",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof gradientButtonVariants> {
  asChild?: boolean
  icon?: React.ReactNode
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant, size, asChild = false, icon, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(gradientButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {icon || (size === "round" && !icon ? (
          <>
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-cyan-400/10 to-transparent opacity-50" />
            
            <Mic 
              className="w-8 h-8 sm:w-10 sm:h-10 relative z-10 text-cyan-100" 
              strokeWidth={1.5} 
            />
            
            <div className="absolute top-[10%] right-[10%] w-[10%] h-[10%] rounded-full bg-cyan-200/40 blur-sm" />
          </>
        ) : null)}
        {children}
      </Comp>
    )
  }
)
GradientButton.displayName = "GradientButton"

export { GradientButton, gradientButtonVariants } 