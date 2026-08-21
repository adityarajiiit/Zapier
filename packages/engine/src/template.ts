export interface ExecutionContext{
    triggerData:Record<string,any>|null
    stepOutputs:Record<string,Record<string,any>>
    item?:any
}


export const resolvePath=(path:string,ct:ExecutionContext)=>{
    const cleanPath=path.trim().replace(/^\{\{|\}\}$/g,'').trim()
    const parts=cleanPath.split('.')
    const source=parts[0]
    let c:any
    if(source==='trigger'){
        c=ct.triggerData
    }
    else if(source==='item'){
        c=ct.item
    }
    else if(source?.startsWith('step')){
        c=ct.stepOutputs[source]
    }
    else{
        return undefined
    }
    for(let i=1;i<parts.length;i++){
    if(c==null){
        return undefined
    }
    const arr=parts[i]?.match(/^(\w+)\[(\d+)\]$/)
    if(arr){
        c=c[arr[1]!]?.[Number(arr[2])]
    }
    else{
        c=c[parts[i]!]
    }
}
    return c
}