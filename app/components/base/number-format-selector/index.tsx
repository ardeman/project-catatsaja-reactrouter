import { Slot } from '@radix-ui/react-slot'
import { Globe } from 'lucide-react'
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

import { numberFormatOptions } from './constant'
import { TParameters, TProperties } from './type'

export const NumberFormatSelector = (properties: TProperties) => {
  const { type = 'dropdown', onChange, value } = properties

  const changeFormat = (lng: string) => {
    onChange?.(lng)
  }

  if (type === 'radio') {
    return (
      <Radio
        value={value}
        changeFormat={changeFormat}
      />
    )
  }

  return (
    <Dropdown
      value={value}
      changeFormat={changeFormat}
    />
  )
}

const Radio = (parameters: TParameters) => {
  const { changeFormat, value } = parameters
  const { t } = useTranslation()

  return (
    <div className="space-y-1">
      <Label>{t('settings.currency.form.locale.selector')}</Label>
      <Slot>
        <RadioGroup
          onValueChange={changeFormat}
          value={value}
          className="flex flex-col"
        >
          {numberFormatOptions.map((option) => (
            <div
              key={option.value}
              className="flex items-center space-x-3 space-y-0"
            >
              <Slot>
                <RadioGroupItem value={option.value} id={option.value} />
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
  const { changeFormat, value } = parameters
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">
            {t('settings.currency.form.locale.selector')}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={value} onValueChange={changeFormat}>
          {numberFormatOptions.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
