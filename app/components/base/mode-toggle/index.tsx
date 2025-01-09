import { Slot } from '@radix-ui/react-slot'
import { Moon, Sun } from 'lucide-react'
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
import { Theme, useTheme } from '~/lib/contexts/theme'

import { themeOptions } from './constant'
import { TParameters, TProperties } from './type'

export const ModeToggle = (properties: TProperties) => {
  const { type = 'dropdown' } = properties
  const { setTheme, theme } = useTheme()

  const handleSetTheme = (theme: Theme) => {
    setTheme(theme)
  }

  if (type === 'radio') {
    return (
      <Radio
        value={theme}
        handleSetTheme={handleSetTheme}
      />
    )
  }

  return (
    <Dropdown
      value={theme}
      handleSetTheme={handleSetTheme}
    />
  )
}

const Radio = (parameters: TParameters) => {
  const { value, handleSetTheme } = parameters
  const { t } = useTranslation()

  return (
    <div className="space-y-1">
      <Label>{t('settings.appearance.form.theme.selector')}</Label>
      <Slot>
        <RadioGroup
          onValueChange={handleSetTheme}
          value={value}
          className="flex flex-col"
        >
          {themeOptions(t).map((option) => (
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
  const { value, handleSetTheme } = parameters
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">
            {t('settings.appearance.form.theme.selector')}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(newValue) => handleSetTheme(newValue as Theme)}
        >
          <DropdownMenuRadioItem value="light">
            {t('settings.appearance.form.theme.light')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            {t('settings.appearance.form.theme.dark')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            {t('settings.appearance.form.theme.system')}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
