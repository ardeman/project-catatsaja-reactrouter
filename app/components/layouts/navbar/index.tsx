import { zodResolver } from '@hookform/resolvers/zod'
import { CircleUser, Menu, Search } from 'lucide-react'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

import { Input } from '~/components/base/input'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '~/components/ui/sheet'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useLogout } from '~/lib/hooks/use-logout'
import { toast } from '~/lib/hooks/use-toast'
import { TSearchRequest } from '~/lib/types/search'
import { cn } from '~/lib/utils/shadcn'
import { searchSchema } from '~/lib/validations/search'

import { userMenus } from './constant'
import { Navigation } from './navigation'
import { TProperties } from './type'

export const Navbar = (properties: TProperties) => {
  const { className } = properties
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: userData } = useUserData()
  const formMethods = useForm<TSearchRequest>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: '',
    },
  })
  const { handleSubmit } = formMethods
  const onSubmit = handleSubmit(async (data) => {
    toast({
      title: 'Search',
      description: <pre>{JSON.stringify(data, null, 2)}</pre>,
    })
  })
  const handleLogout = () => {
    mutateLogout()
    navigate('/')
  }

  const { mutate: mutateLogout } = useLogout()

  return (
    <header
      className={cn(
        'sticky top-0 z-50 flex h-16 w-full items-center gap-4 border-b border-border/40 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6',
        className,
      )}
    >
      <Navigation className="hidden flex-col md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6" />
      <Sheet
        open={open}
        onOpenChange={setOpen}
      >
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <Navigation
            className="grid"
            onLinkClick={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <FormProvider {...formMethods}>
          <form
            onSubmit={onSubmit}
            className="ml-auto flex-1"
          >
            <Input
              name="query"
              type="search"
              placeholder={t('navigation.search.placeholder')}
              inputClassName="w-full"
              leftNode={({ className }) => <Search className={className} />}
            />
          </form>
        </FormProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full [&_svg]:size-6"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={userData?.photoURL || ''} />
                <AvatarFallback>
                  <CircleUser />
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {userData?.displayName || userData?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {userMenus(t).map((menu, index) => (
              <Link
                key={index}
                to={menu.href}
                rel={
                  menu.href.startsWith('http')
                    ? 'noopener noreferrer'
                    : undefined
                }
                target={menu.href.startsWith('http') ? '_blank' : undefined}
              >
                <DropdownMenuItem className="cursor-pointer">
                  {menu.name}
                </DropdownMenuItem>
              </Link>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer"
            >
              {t('navigation.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
