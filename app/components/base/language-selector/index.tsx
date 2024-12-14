import { Slot } from '@radix-ui/react-slot'
import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Label,
  RadioGroup,
  RadioGroupItem,
} from '~/components/ui'
import { languageOptions } from '~/localization/i18n'

import { TParams, TProps } from './type'

export const LanguageSelector = (props: TProps) => {
  const { type = 'dropdown' } = props
  const { i18n } = useTranslation()
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  if (type === 'radio') {
    return <Radio changeLanguage={changeLanguage} />
  }

  return <Dropdown changeLanguage={changeLanguage} />
}

const Radio = (params: TParams) => {
  const { changeLanguage } = params
  const { t, i18n } = useTranslation()

  return (
    <div className="space-y-1">
      <Label>{t('settings.appearance.form.language.selector')}</Label>
      <Slot>
        <RadioGroup
          onValueChange={changeLanguage}
          value={i18n.language}
          className="flex flex-col"
        >
          {languageOptions.map((option) => (
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

const Dropdown = (params: TParams) => {
  const { changeLanguage } = params
  const { t, i18n } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
        >
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">
            {t('settings.appearance.form.language.selector')}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={i18n.language}
          onValueChange={changeLanguage}
        >
          {languageOptions.map((option) => (
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
