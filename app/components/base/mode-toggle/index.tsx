import { Moon, Sun } from 'lucide-react'
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
          <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
