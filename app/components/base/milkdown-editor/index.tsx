import { Crepe } from '@milkdown/crepe'
import { Milkdown, useEditor } from '@milkdown/react'
import { useEffect } from 'react'
import { PathValue, useFormContext } from 'react-hook-form'

import { TMilkdownEditorProperties } from './type'

import '@milkdown/crepe/theme/common/style.css'
import '~/styles/crepe.css'

export const MilkdownEditor = <TFormValues extends Record<string, unknown>>(
  properties: TMilkdownEditorProperties<TFormValues>,
) => {
  const { name, placeholder: placeholderText } = properties
  const { register, setValue, getValues } = useFormContext<TFormValues>()

  useEffect(() => {
    register(name)
  }, [register, name])

  useEditor((root) =>
    new Crepe({
      root,
      defaultValue: (getValues(name) as string) || '',
      features: {
        [Crepe.Feature.BlockEdit]: false,
      },
      featureConfigs: {
        [Crepe.Feature.Placeholder]: {
          text: placeholderText,
          mode: 'doc',
        },
      },
    }).on((listener) => {
      listener.markdownUpdated((_, markdown) => {
        setValue(name, markdown as PathValue<TFormValues, typeof name>, {
          shouldDirty: true,
        })
      })
    }),
  )

  return <Milkdown />
}
