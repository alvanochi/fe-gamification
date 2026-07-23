interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

const Label: React.FC<LabelProps> = ({ children, required, className = '', ...props }) => {
  return (
    <label
      className={`block text-sm font-bold uppercase tracking-wide mb-1.5 text-ink ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-secondary ml-1">*</span>}
    </label>
  )
}

export default Label
