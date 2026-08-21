import React from "react";
import{Handle,Position,type NodeProps} from'@xyflow/react'
import{motion} from 'framer-motion'
import { Plus,Zap,Settings2 } from "lucide-react";
import { useAppDispatch } from "@/app/dashboard/store/hook";
import { openTriggerSelector,openTriggerConfigPanel } from "@/app/dashboard/store/workflowBuilder";
import type{BuildTrigger} from "@/app/dashboard/store/workflowBuilder"

type TriggerNodeData={
    trigger:BuildTrigger|null
}

export function TriggerNode({data}:NodeProps){
    const dispatch=useAppDispatch()
    const trigger=(data as TriggerNodeData).trigger
    return(
        <motion.div whileHover={{scale:1.05}} transition={{duration:0.20}}>
            {trigger?(
                <div className="surface-card-elevated relative p-4 w-64 rounded-xl border border-white/10">
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-success rounded-r-full" />
                    <div className="flex items-center gap-3 pl-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                            <Zap className="h-4 w-4 text-success"/>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-base-content/40 uppercase">
                                Trigger
                            </p>
                            <p className="text-sm font-medium text-base-content truncate">
                            {trigger.triggerId}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-3 pl-3">
                         <button
                            onClick={()=>{
                                dispatch(openTriggerConfigPanel())
                            }}
                            className="btn btn-ghost btn-xs flex-1 gap-1"
                         >
                            <Settings2 className="h-3 w-3"/>
                            Configure
                         </button>
                        <button
                            onClick={()=>dispatch(openTriggerSelector())}
                            className="btn btn-ghost btn-xs text-base-content/40 hover:text-base-content/70 transition-colors"
                        >
                            Change
                        </button>
                    </div>
                </div>
            ):(
              <div onClick={()=>dispatch(openTriggerSelector())}
              className="surface-card w-64 rounded-xl border-2 border-dashed border-white/15 p-6 
              flex flex-col items-center gap-3 cursor-pointer hover:border-white/25 transition-colors
              "
              >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-base-300">
                  <Plus className="h-5 w-5 text-base-content/40"/>
              </div>
                  <p className="text-sm text-base-content/40 text-center">
                    Click to choose a trigger
                  </p>
              </div>
            )
        }
        <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-base-content/20 !border-base-content/10"
        />
        </motion.div>
    )
}