import { PiggyBank } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/base/select'
import { Label } from '~/components/ui/label'

import { TGoalChoice } from './type'

const NONE = '__none'

type TProperties = {
  goals: TGoalChoice[]
  value?: string
  onChange: (goal?: string) => void
  className?: string
}

// The savings goal expenses are paid toward. Shows nothing when there is
// no goal to choose: done goals are offered only to what is linked to them.
export const GoalPicker = ({
  goals,
  value,
  onChange,
  className,
}: TProperties) => {
  const { t } = useTranslation()
  const id = useId()
  const choices = goals.filter((goal) => !goal.done || goal.id === value)
  if (choices.length === 0) return
  const current = choices.some((goal) => goal.id === value) ? value : NONE

  return (
    <div className={className}>
      {/* The entry form makes every label a block, so the row is a span. */}
      <Label id={id}>
        <span className="flex items-center gap-1">
          <PiggyBank
            aria-hidden="true"
            className="size-3.5"
          />
          {t('finances.form.goal.label')}
        </span>
      </Label>
      <Select
        value={current}
        onValueChange={(next) => {
          // Radix reports "" when the option list changes under it.
          if (!next) return
          onChange(next === NONE ? undefined : next)
        }}
      >
        <SelectTrigger
          aria-labelledby={id}
          title={t('finances.form.goal.hint')}
          className="mt-1"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{t('finances.form.goal.none')}</SelectItem>
          {choices.map((goal) => (
            <SelectItem
              key={goal.id}
              value={goal.id}
            >
              {goal.name || t('finances.analysis.goals.name')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
