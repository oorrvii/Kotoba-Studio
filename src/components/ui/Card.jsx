export default function Card({ as: Tag = 'div', className = '', padded = true, children, ...rest }) {
  return (
    <Tag className={`rounded-card border border-border bg-surface shadow-card ${padded ? 'p-6' : ''} ${className}`} {...rest}>
      {children}
    </Tag>
  )
}
