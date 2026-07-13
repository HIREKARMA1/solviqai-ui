import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500",
                destructive: "bg-error text-white hover:bg-accent-red-600 focus-visible:ring-error",
                outline: "border border-gray-300 bg-transparent hover:bg-gray-50 hover:text-gray-900 dark:border-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-50",
                secondary: "bg-secondary-100 text-gray-900 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-gray-50 dark:hover:bg-secondary-700",
                ghost: "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50",
                link: "text-primary-500 underline-offset-4 hover:underline",
                gradient: "bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600",
                success: "bg-success text-white hover:bg-accent-green-600 focus-visible:ring-success",
                warning: "bg-warning text-gray-900 hover:bg-accent-yellow-600 focus-visible:ring-warning",
                info: "bg-info text-white hover:bg-secondary-600 focus-visible:ring-info",
                // Mock Test Library — solid brand navy (matches resume page CTAs)
                mockPrimary:
                    "border-0 bg-brand-blue text-white font-semibold shadow-sm transition-all duration-200 hover:bg-brand-blue-dark hover:text-white focus-visible:ring-brand-blue/40",
                mockFilter:
                    "border border-brand-blue/30 bg-white/90 text-brand-blue font-semibold shadow-sm transition-all duration-200 hover:bg-brand-blue hover:border-brand-blue hover:text-white dark:border-brand-blue/35 dark:bg-gray-900/75 dark:text-brand-cyan dark:hover:bg-brand-blue dark:hover:text-white",
                mockCategoryActive:
                    "border border-orange-500/70 bg-orange-500/10 text-orange-600 font-semibold shadow-sm backdrop-blur-sm transition-all duration-200 dark:border-orange-500/80 dark:bg-orange-500/15 dark:text-orange-400",
                mockCategoryInactive:
                    "border border-gray-200/80 bg-white/80 text-gray-600 font-semibold shadow-sm transition-all duration-200 hover:border-brand-blue/25 hover:bg-white dark:border-gray-700/60 dark:bg-gray-900/50 dark:text-gray-300 dark:hover:border-brand-blue/30",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                xl: "h-12 rounded-md px-10 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
    loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"

        const content = (
            <>
                {loading && (
                    <svg
                        className="mr-2 h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                )}
                {children}
            </>
        )

        return (
            <Comp
                className={cn(buttonVariants({ variant, size }), className)}
                ref={ref}
                disabled={disabled || loading}
                {...props}
            >
                {asChild ? children : content}
            </Comp>
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }






