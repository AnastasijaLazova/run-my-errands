import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { SKOPJE_NEIGHBOURHOODS, canonicalNeighbourhood, neighbourhoodLabel, normalizeNeighbourhood } from '../neighbourhoods'

type Props = {
  value: string
  onChange: (value: string) => void
  id?: string
  className?: string
  placeholder?: string
  ariaLabel?: string
  required?: boolean
}

// Replaces <datalist>: the dropdown matches the field's width, and opening it shows the full list
// even when a value is already filled in — filtering only kicks in once the user starts typing.
// Names are shown in the current language; `value`/`onChange` always carry the stored (Macedonian) name.
export function NeighbourhoodInput({ value, onChange, id, className, placeholder, ariaLabel, required }: Props) {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState(false)
  const [active, setActive] = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const { lang } = useI18n()

  const shown = neighbourhoodLabel(value, lang)
  const query = normalizeNeighbourhood(value)
  const options = typed && query
    ? SKOPJE_NEIGHBOURHOODS.filter((n) => normalizeNeighbourhood(n.mk).includes(query) || normalizeNeighbourhood(n.en).includes(query))
    : SKOPJE_NEIGHBOURHOODS

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!wrapRef.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  useEffect(() => {
    if (active >= 0) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const show = () => {
    setTyped(false)
    setActive(SKOPJE_NEIGHBOURHOODS.findIndex((n) => n.mk === canonicalNeighbourhood(value)))
    setOpen(true)
  }

  const pick = (n: string) => {
    onChange(n)
    setOpen(false)
    setTyped(false)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return show()
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (i + step + options.length) % options.length)
    } else if (e.key === 'Enter' && open && active >= 0 && options[active]) {
      e.preventDefault()
      pick(options[active].mk)
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div className="combo" ref={wrapRef}>
      <input id={id} className={className} value={shown} placeholder={placeholder} aria-label={ariaLabel} required={required}
        role="combobox" aria-expanded={open} aria-autocomplete="list" autoComplete="off"
        onFocus={show} onClick={() => !open && show()} onKeyDown={onKeyDown}
        onChange={(e) => { onChange(canonicalNeighbourhood(e.target.value)); setTyped(true); setActive(-1); setOpen(true) }} />
      <button type="button" className="combo-toggle" tabIndex={-1} aria-label="Show neighbourhoods"
        onMouseDown={(e) => e.preventDefault()} onClick={() => (open ? setOpen(false) : show())}>▾</button>
      {open && options.length > 0 && (
        <ul className="combo-list" role="listbox" ref={listRef}>
          {options.map((n, i) => (
            <li key={n.mk} role="option" aria-selected={n.mk === value}
              className={(i === active ? 'active ' : '') + (n.mk === value ? 'selected' : '')}
              onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setActive(i)} onClick={() => pick(n.mk)}>
              {n[lang]}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
