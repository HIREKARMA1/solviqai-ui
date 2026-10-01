import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, leftIcon, rightIcon, error, ...props }, ref) => {
        return (
            <div className="relative">
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        {leftIcon}
                    </div>
                )}
                <input
                    type={type}
                    className={cn(
                        "flex h-10 w-full rounded-md border bg-white dark:bg-gray-800 px-3 py-2 text-sm ring-offset-white dark:ring-offset-gray-900 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        leftIcon ? "pl-10" : "",
                        rightIcon ? "pr-10" : "",
                        !error && "border-gray-300 dark:border-gray-600",
                        className,
                        error && "border-red-500 dark:border-red-400 focus-visible:ring-red-500"
                    )}
                    ref={ref}
                    {...props}
                />
                {rightIcon && (
                    <div className="absolute right-1 top-1/2 z-10 flex -translate-y-1/2 items-center text-gray-400">
                        {rightIcon}
                    </div>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }






