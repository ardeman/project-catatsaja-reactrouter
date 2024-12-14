import { Slot } from '@radix-ui/react-slot'
import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Theme } from 'remix-themes'

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
import { useTheme } from '~/lib/contexts'

import { themeOptions } from './data'
import { TParams, TProps } from './type'

export const ModeToggle = (props: TProps) => {
  const { type = 'dropdown' } = props
  const [theme, setTheme, metadata] = useTheme()
  const value = metadata.definedBy === 'SYSTEM' ? 'system' : (theme as string)

  const handleSetTheme = (value: string) => {
    if (value === 'system') {
      setTheme(null)
      globalThis.localStorage.removeItem('theme')
      return
    }
    setTheme(value as Theme)
    globalThis.localStorage.setItem('theme', value)
  }

  if (type === 'radio') {
    return (
      <Radio
        value={value}
        handleSetTheme={handleSetTheme}
      />
    )
  }

  return (
    <Dropdown
      value={value}
      handleSetTheme={handleSetTheme}
    />
  )
}

const Radio = (params: TParams) => {
  const { value, handleSetTheme } = params
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

const Dropdown = (params: TParams) => {
  const { value, handleSetTheme } = params
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
          onValueChange={handleSetTheme}
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
