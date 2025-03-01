export function Card({ className = "", ...props }) {
    return <div className={`rounded-lg border border-gray-200 bg-white shadow ${className}`} {...props} />
  }
  
  