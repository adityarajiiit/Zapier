'use client'
import dynamic from 'next/dynamic'

const WorkflowCanvas=dynamic(()=>import('./WorkflowCanvas'),{
    ssr:false,
    loading:()=>(
        <div className="h-full w-full bg-base-100 flex items-center justify-center">
            <span className="loading loading-spinner loading-lg text-base-content/20"/>
        </div>
    )
})

export default function WorkflowCanvasLoader(){
    return <WorkflowCanvas/>
}
