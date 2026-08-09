import{z} from 'zod'

export const apikeySchema=z.object({
  label:z.string().min(1,'Display name is required'),
  apiKey:z.string().min(1,'API key is required'),
})

export const tokenSchema=z.object({
  label:z.string().min(1,'Display name is required'),
  bearerToken:z.string().min(1,'Bearer token is required'),
})

export type ApikeyForm=z.infer<typeof apikeySchema>
export type TokenForm=z.infer<typeof tokenSchema>
