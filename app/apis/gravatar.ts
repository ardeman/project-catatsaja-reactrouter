import { environment } from '~/lib/utils/environment'

export const uploadToGravatar = async (file: File): Promise<string> => {
  const apiKey = environment.VITE_GRAVATAR_API_KEY
  if (!apiKey) {
    throw new Error('Gravatar API key is missing.')
  }

  const formData = new FormData()
  formData.append('image', file)
  formData.append('key', apiKey)

  const response = await fetch('https://gravatar.com/api/avatar', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Failed to upload image to Gravatar.')
  }

  const data = (await response.json()) as { url: string }
  if (!data.url) {
    throw new Error('Invalid response from Gravatar.')
  }

  return data.url
}
