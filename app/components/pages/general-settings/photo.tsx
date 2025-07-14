import { CircleUser } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useUpdatePhoto } from '~/lib/hooks/use-update-photo'

export const Photo = () => {
  const { t } = useTranslation()
  const { data: userData } = useUserData()
  const { mutate, isPending, isSuccess, isError } = useUpdatePhoto()
  const [file, setFile] = useState<File>()
  const [disabled, setDisabled] = useState(false)
  const fileInputReference = useRef<HTMLInputElement>(null)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0])
    }
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!file) return
    setDisabled(true)
    await mutate(file)
  }

  useEffect(() => {
    if (isSuccess || isError) {
      setDisabled(false)
      setFile(undefined)
      if (fileInputReference.current) fileInputReference.current.value = ''
    }
  }, [isSuccess, isError])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.photo.title')}</CardTitle>
        <CardDescription>{t('settings.photo.description')}</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="flex items-end space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={userData?.photoURL || ''} />
            <AvatarFallback>
              <CircleUser className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <input
            ref={fileInputReference}
            type="file"
            accept="image/*"
            onChange={handleChange}
            disabled={disabled}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          />
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button
            disabled={!file || disabled}
            isLoading={isPending}
            type="submit"
          >
            {t('form.save')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
