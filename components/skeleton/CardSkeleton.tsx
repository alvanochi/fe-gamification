const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`rounded-lg border-brut bg-paper-raised shadow-brutal-sm p-5 overflow-hidden ${className}`}
    >
      <div className="animate-pulse space-y-4">
        <div className="h-32 rounded-md bg-ink/10" />
        <div className="h-4 w-3/4 rounded-sm bg-ink/10" />
        <div className="h-4 w-1/2 rounded-sm bg-ink/10" />
      </div>
    </div>
  )
}

export default CardSkeleton
