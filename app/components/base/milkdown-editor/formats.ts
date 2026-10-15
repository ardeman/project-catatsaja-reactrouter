import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Italic,
  Link,
  List,
  ListOrdered,
  Pilcrow,
  Sigma,
  Strikethrough,
} from 'lucide-react'

export const formats = [
  { value: 'bold', icon: Bold },
  { value: 'italic', icon: Italic },
  { value: 'code', icon: Code },
  { value: 'strikethrough', icon: Strikethrough },
  { value: 'link', icon: Link },
  { value: 'formula', icon: Sigma },
  { value: 'heading', icon: Heading1 },
  { value: 'subheading', icon: Heading2 },
  { value: 'bullets', icon: List },
  { value: 'numbers', icon: ListOrdered },
  { value: 'text', icon: Pilcrow },
] as const
