import { useState } from 'react'

type AvatarProps = {
  name: string
  githubUsername?: string
  src?: string | null
  size?: 'small' | 'medium' | 'large'
}

export function Avatar({ name, githubUsername, src, size = 'medium' }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  const imageUrl = src || (githubUsername ? `https://github.com/${githubUsername}.png?size=192` : '')
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'SC'

  return (
    <span className={`identity-avatar identity-avatar--${size}`} aria-label={`${name} avatar`}>
      {!failed && imageUrl ? (
        <img src={imageUrl} alt="" onError={() => setFailed(true)} />
      ) : (
        <span>{initials}</span>
      )}
    </span>
  )
}
