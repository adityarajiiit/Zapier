import {z} from 'zod'

export const workflowSchema=z.object({
    name:z.string().min(1,'Name is required'),
    description:z.string().max(500,'Description is long').optional()
})

export type WorkflowFormData=z.infer<typeof workflowSchema>