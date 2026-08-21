'use client'
import React from 'react'
import { useMemo } from 'react'
import {
    ReactFlow,
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    type Node,
    type Edge
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useAppSelector } from '../../store/hook'
import { TriggerNode } from './nodes/TriggerNode'
import { StepNode } from './nodes/StepNode'
import { AddStepNode } from './nodes/AddStepNode'

const nodeTypes={
    trigger:TriggerNode,
    step:StepNode,
    addStep:AddStepNode
}
export default function WorkflowCanvas(){
    if(typeof window==='undefined'){
        return null
    }
    const {trigger,steps}=useAppSelector(s=>s.workflowBuilder)
    const nodes:Node[]=useMemo(()=>{
        const result:Node[]=[]
        result.push({
            id:'trigger',
            type:'trigger',
            position:{x:300,y:0},
            data:{trigger},
            draggable:false
        })
        steps.forEach((step,index)=>{
            result.push({
                id:step.id,
                type:'step',
                position:{
                    x:300,y:(index+1)*150
                },
                data:{step,index},
                draggable:false
            })
        })
        result.push({
            id:'add-step',
            type:'addStep',
            position:{
                x:300,
                y:(steps.length+1)*150
            },
            data:{},
            draggable:false
        })
        return result
    },[trigger,steps])

    const edges:Edge[]=useMemo(()=>{
        const result:Edge[]=[]
        if(steps.length===0){
            result.push({
                id:'trigger-add',
                source:'trigger',
                target:'add-step'
            })
        }
        else{
            result.push({
                id:'trigger-step-0',
                source:'trigger',
                target:steps[0].id
            })
            steps.forEach((step,index)=>{
                if(index<steps.length-1){
                    result.push({
                        id:`step-${index}-${index+1}`,
                        source:step.id,
                        target:steps[index+1].id
                    })
                }
            })
            result.push({
                id:'last-step-add',
                source:steps[steps.length-1].id,
                target:'add-step'
            })
        }
        return result
    },[steps])
    return (
        <div className='h-full w-full bg-base-100'>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                nodesDraggable={false}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                colorMode='dark'
                className='bg-base-100'
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    color='currentColor'
                    className='text-base-content/20'
                    gap={24}
                />
                <Controls />
                <MiniMap
                    className="bg-base-200 border border-white/10 rounded-xl overflow-hidden shadow-lg"
                    maskColor='rgba(0,0,0,0.7)'
                    nodeColor='rgba(255,255,255,0.3)'
                    zoomable={true}
                    pannable={true}

                />
            </ReactFlow>
        </div>
    )
}