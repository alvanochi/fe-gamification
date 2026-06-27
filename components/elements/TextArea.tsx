'use client'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`
          w-full px-4 py-3 rounded-xl border backdrop-blur-sm resize-none
          transition-all duration-200 ease-in-out
          bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10
          text-gray-900 dark:text-white
          placeholder:text-gray-400 dark:placeholder:text-gray-500
          hover:border-gray-300 dark:hover:border-white/20
          focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500
          ${error ? 'border-red-500 ring-1 ring-red-500/30' : ''}
          ${className}
        `}
        rows={4}
        {...props}
      />
    )
  },
)

Textarea.displayName = 'Textarea'

export default Textarea
