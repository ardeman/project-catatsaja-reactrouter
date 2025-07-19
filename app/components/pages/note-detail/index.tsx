import { MilkdownProvider } from '@milkdown/react'

import { NoteProvider } from '~/components/pages/notes'

import { Content } from './content'

export const NoteDetailPage = () => (
  <NoteProvider>
    <MilkdownProvider>
      <Content />
    </MilkdownProvider>
  </NoteProvider>
)
