import { ReactNode, useState } from 'react'

interface ButtonProps {
  children: ReactNode
  className?: string
  icon?: ReactNode
  primary?: boolean
  style?: {
    [key: string]: string
  }
  onClick?: () => void
  onDown?: () => void
  onUp?: () => void
  onEnter?: () => void
  onLeave?: () => void
}

export default function Button(props: ButtonProps) {
  const {
    children,
    className,
    icon,
    primary,
    style,
    onClick,
    onDown,
    onUp,
    onEnter,
    onLeave,
  } = props
  const [active, setActive] = useState(false)
  let background = ''
  if (primary) {
    background = 'bg-primary hover:bg-black hover:text-white'
  }
  if (active) {
    background = 'bg-black text-white'
  }
  if (!primary && !active) {
    background = 'hover:bg-primary'
  }
  return (
    <div
      role="button"
      onKeyDown={() => {
        onDown?.()
      }}
      onClick={onClick}
      onPointerDown={() => {
        setActive(true)
        onDown?.()
      }}
      onPointerUp={() => {
        setActive(false)
        onUp?.()
      }}
      onPointerEnter={() => {
        onEnter?.()
      }}
      onPointerLeave={() => {
        onLeave?.()
      }}
      tabIndex={-1}
      className={[
        'inline-flex space-x-3 py-3 px-5 rounded-md cursor-pointer',
        background,
        className,
      ].join(' ')}
      style={style}
    >
      {icon}
      <span className="whitespace-nowrap select-none">{children}</span>
    </div>
  )
}
