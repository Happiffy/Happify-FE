import { Icon } from '@iconify/react'

type Size = 'sm' | 'md' | 'lg' | 'xl'

const sizes: Record<Size, string> = {
  sm: 'size-5',
  md: 'size-7',
  lg: 'size-10',
  xl: 'size-14',
}

export default function ColoredIcon({ icon, size = 'md', className = '' }: { icon: string, size?: Size, className?: string }) {
  return <Icon className={`${sizes[size]} shrink-0 ${className}`} icon={icon} />
}
