import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ title, children, onClose }) {
  useEffect(() => {
    const fechar = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', fechar)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', fechar)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={21} /></button></header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  )
}
