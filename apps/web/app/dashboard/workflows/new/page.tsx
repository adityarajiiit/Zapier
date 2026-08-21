'use client'
import { BackgroundBeamsWithCollision } from '@/components/ui/background-beams-with-collision'
import { motion } from 'framer-motion'
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'
import{workflowSchema,type WorkflowFormData} from '../schema/workflowSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import{useForm} from "react-hook-form"
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { useRouter } from 'next/navigation'
import { useCreateWorkflowMutation } from '../../store/api'
import { toast } from 'sonner'
export default function NewWorkflow(){
    const router=useRouter()
    const[createWorkflow,{isLoading}]=useCreateWorkflowMutation()
    const{register,handleSubmit,formState:{errors}}=useForm<WorkflowFormData>({
        resolver:zodResolver(workflowSchema)
    })
    const onSubmit=async(data:WorkflowFormData)=>{
        try{
            const newWorkflow=await createWorkflow({
                name:data.name,
                description:data.description
            }).unwrap()
            toast.success('Workflow created successfully')
            router.push(`/dashboard/workflows/${newWorkflow.id}`)
        }
        catch(e:any){
            toast.error(e.data?.error)
        }
    }
    return(
        <BackgroundBeamsWithCollision
        className='relative min-h-screen bg-base-100 flex items-center justify-center overflow-hidden px-4'
        >
            <motion.div
            initial={{opacity:0,y:20}}
            animate={{opacity:1,y:0}}
            className='surface-card-elevated relative z-10 max-w-lg w-full p-8'
            >
            <TextGenerateEffect
            words='Create a new Workflow'
            className='text-2xl font-bold text-center mb-4'
            />
            <motion.form
            initial={{opacity:0,y:20}}
            animate={{opacity:1,y:0}}
            transition={{duration:0.5}}
            className='flex flex-col gap-5 mt-6'
            onSubmit={handleSubmit(onSubmit)}
            >
            <div className='flex flex-col gap-2'>
                <label className='text-xs uppercase text-base-content/40'>
                    Name
                </label>
                <input
                type='text'
                placeholder='My Workflow'
                className='input w-full'
                {...register('name')}
                />
                {errors.name&&(
                    <p className='text-xs text-error'>{errors.name.message}</p>
                )}
            </div>
            <div
            className='flex flex-col gap-2'
            >
            <label className='text-xs uppercase text-base-content/40'>
                Description
            </label>
            <textarea
            rows={3}
            placeholder='What does this workflow do?'
            className='textarea w-full resize-none'
            {...register('description')}
            />
            {errors.description&&(
                <p className='text-xs text-error'>{errors.description.message}</p>
            )}
            </div>
            <div className='flex justify-end mt-2'>
                <ShimmerButton 
                type='submit'
                className='px-6 py-2 text-sm font-semibold'
                disabled={isLoading}
                >
                    {isLoading?<span className='loading loading-spinner loading-xs'/>:'Create Open Builder'}
                </ShimmerButton>
            </div>
            </motion.form>
            </motion.div>
        </BackgroundBeamsWithCollision>
    )
}