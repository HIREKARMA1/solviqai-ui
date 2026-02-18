"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: "sm" | "md" | "lg" | "xl"
    variant?: "spinner" | "dots" | "pulse"
}

const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
    ({ className, size = "md", variant = "spinner", ...props }, ref) => {
        const sizeClasses = {
            sm: "h-4 w-4",
            md: "h-8 w-8",
            lg: "h-12 w-12",
            xl: "h-16 w-16",
        }

        if (variant === "spinner") {
            return (
                <div ref={ref} className={cn("flex items-center justify-center", className)} {...props}>
                    <svg
                        className={cn("animate-spin text-primary-500", sizeClasses[size])}
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
                </div>
            )
        }

        if (variant === "dots") {
            return (
                <div ref={ref} className={cn("flex space-x-2", className)} {...props}>
                    <div className={cn("rounded-full bg-primary-500 animate-bounce", sizeClasses[size])}></div>
                    <div className={cn("rounded-full bg-primary-500 animate-bounce", sizeClasses[size])} style={{ animationDelay: "0.1s" }}></div>
                    <div className={cn("rounded-full bg-primary-500 animate-bounce", sizeClasses[size])} style={{ animationDelay: "0.2s" }}></div>
                </div>
            )
        }

        if (variant === "pulse") {
            return (
                <div ref={ref} className={cn("flex items-center justify-center", className)} {...props}>
                    <div className={cn("rounded-full bg-primary-500 animate-pulse", sizeClasses[size])}></div>
                </div>
            )
        }

        return null
    }
)
Loader.displayName = "Loader"

export { Loader }






