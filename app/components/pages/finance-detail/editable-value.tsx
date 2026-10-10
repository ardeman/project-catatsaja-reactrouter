import { ReactNode } from 'react'

type TProperties = {
  label: string
  value: string
  required?: boolean
  isEditing: boolean
  onEdit: () => void
  children: ReactNode
}

export const EditableValue = ({
  label,
  value,
  required,
  isEditing,
  onEdit,
  children,
}: TProperties) =>
  isEditing ? (
    children
  ) : (
    <button
      type="button"
      aria-label={label}
      title={value}
      onClick={onEdit}
      className="group flex min-h-8 w-fit max-w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 py-1 text-left text-sm break-words focus-visible:outline-none"
    >
      <span className="text-xs text-muted-foreground">
        {label} {required && <sup className="text-destructive">*</sup>}
      </span>
      <span className="font-medium decoration-muted-foreground underline-offset-4 group-hover:underline group-focus-visible:underline">
        {value}
      </span>
    </button>
  )
