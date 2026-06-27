//ini buat contoh aja, nanti sesuaiin styling nya

'use client'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          w-full px-4 py-3 rounded-xl border backdrop-blur-sm
          transition-all duration-200 ease-in-out
          bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10
          text-gray-900 dark:text-white
          placeholder:text-gray-400 dark:placeholder:text-gray-500
          hover:border-gray-300 dark:hover:border-white/20
          focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500
          ${error ? 'border-red-500 ring-1 ring-red-500/30' : ''}
          ${className}
        `}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'

export default Input
