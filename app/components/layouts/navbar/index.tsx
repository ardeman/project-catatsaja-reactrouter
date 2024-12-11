import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@remix-run/react'
import { CircleUser, Menu, Search } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'

import { Input } from '~/components/base'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetTrigger,
} from '~/components/ui'
import { toast, useLogout, useUserData } from '~/lib/hooks'
import { TSearchRequest } from '~/lib/types'
import { cn } from '~/lib/utils'
import { searchSchema } from '~/lib/validations'

import { userMenus } from './data'
import { Navigation } from './navigation'
import { TProps } from './type'

export const Navbar = (props: TProps) => {
  const { className } = props
  const navigate = useNavigate()
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
      <Sheet>
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
          <Navigation className="grid" />
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
              placeholder="Search"
              inputClassName="w-full"
              leftNode={({ className }) => <Search className={className} />}
            />
          </form>
        </FormProvider>
        {/* <ModeToggle /> */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full"
            >
              {userData?.photoURL ? (
                <img
                  src={userData.photoURL}
                  alt={userData.displayName || ''}
                  width={40}
                  height={40}
                  className="select-none rounded-full"
                />
              ) : (
                <CircleUser className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {userData?.displayName || userData?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {userMenus.map((menu, index) => (
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
                <DropdownMenuItem>{menu.name}</DropdownMenuItem>
              </Link>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
