import { useState } from 'react'

type ProductImageProps = {
  name: string
  image?: string
  color?: string
  strength?: string
  className?: string
}

export function ProductImage({ name, image, color = 'green', strength, className = '' }: ProductImageProps) {
  const [failedSource, setFailedSource] = useState('')
  const source = image && image !== failedSource ? image : ''

  return <div className={`product-image ${className} ${color}`} role="img" aria-label={`Hình ảnh ${name}`}>
    {source
      ? <img src={source} alt={name} onError={() => setFailedSource(source)} />
      : <div className="product-image-placeholder">
          <span className="product-image-pack" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5zM4 7.5l8 4.5 8-4.5M12 12v9M8 5.25l8 4.5" /></svg></span>
          <strong>{name}</strong>
          {strength && <small>{strength}</small>}
          <small>Ảnh minh họa</small>
        </div>}
  </div>
}
