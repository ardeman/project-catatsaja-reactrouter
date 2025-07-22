import { Slot } from '@radix-ui/react-slot'
import { Type } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Label } from '~/components/ui/label'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { Size, useTheme } from '~/lib/contexts/theme'

import { sizeOptions } from './constant'
import { TParameters, TProperties } from './type'

export const SizeToggle = (properties: TProperties) => {
  const { type = 'dropdown', onChange, value } = properties
  const { setSize, size } = useTheme()
  const currentSize = value ?? size

  const handleSetSize = (newValue: Size) => {
    if (value === undefined) {
      setSize(newValue)
    }
    onChange?.(newValue)
  }

  if (type === 'radio') {
    return (
      <Radio
        value={currentSize}
        handleSetSize={handleSetSize}
      />
    )
  }

  return (
    <Dropdown
      value={currentSize}
      handleSetSize={handleSetSize}
    />
  )
}

const Radio = (parameters: TParameters) => {
  const { value, handleSetSize } = parameters
  const { t } = useTranslation()

  return (
    <div className="space-y-1">
      <Label>{t('settings.appearance.form.size.selector')}</Label>
      <Slot>
        <RadioGroup
          onValueChange={handleSetSize}
          value={value}
          className="flex flex-col"
        >
          {sizeOptions(t).map((option) => (
            <div
              key={option.value}
              className="flex items-center space-x-3 space-y-0"
            >
              <Slot>
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                />
              </Slot>
              <Label
                className="font-normal text-muted-foreground"
                htmlFor={option.value}
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </Slot>
    </div>
  )
}

const Dropdown = (parameters: TParameters) => {
  const { value, handleSetSize } = parameters
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
        >
          <Type className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">
            {t('settings.appearance.form.size.selector')}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(newValue) => handleSetSize(newValue as Size)}
        >
          {sizeOptions(t).map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
