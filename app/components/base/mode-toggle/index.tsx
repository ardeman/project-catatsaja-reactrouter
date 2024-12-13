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
} from '~/components/ui'
import { useTheme } from '~/lib/contexts'

export const ModeToggle = () => {
  const [theme, setTheme, metadata] = useTheme()
  const { t } = useTranslation()
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
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
