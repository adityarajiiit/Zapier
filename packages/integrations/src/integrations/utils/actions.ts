import{Action,ActionContext} from '../../types.js'
export const delayAction:Action={
    id:'delay',
    name:'Delay',
    description:'Wait for N seconds',
    handler:async(context:ActionContext)=>{
        const seconds=Math.min(Number(context.inputData?.seconds)||1,300)
        await new Promise(resolve=>setTimeout(resolve,seconds*1000))
        return {delayedTime:seconds};
    }
}

export const httpRequestAction:Action={
    id:'http-request',
    name:'HTTP Request',
    description:'Make an HTTP request to any URL',
    handler:async(context:ActionContext)=>{
        const{url,method='GET',headers={},body}=context.inputData||{}
        if(!url){
            throw new Error('url required')
        }
        const options:RequestInit={
            method,
            headers:headers as Record<string,string>
        }
        if(body&&method!=='GET'&&method!=='HEAD'){
            options.body=typeof body==='string'?body:JSON.stringify(body)
        }
        const res=await fetch(url,options)
        let data
        try{
            data=await res.json()
        }
        catch(e){
            data=await res.text()
        }
        return{
            status:res.status,
            ok:res.ok,
            data
        }
    }
}

export const filterAction:Action={
    id:'filter',
    name:'Filter',
    description:'Filter based on condition',
    handler:async(context:ActionContext)=>{
        const{field,operator,value}=context.inputData||{}
        let pass=false
        switch(operator){
            case 'equals':
                pass=field===value
                break
            case 'not-equals':
                pass=field!==value
                break
            case 'contains':
                pass=String(field).includes(String(value))
                break
            case 'greater-than':
                pass=Number(field)>Number(value)
                break
            case 'less-than':
                pass=Number(field)<Number(value)
                break
            default:
                throw new Error(`unknown operator ${operator}`)
        }
        if(!pass){
            throw new Error('filter condition not met')
        }
        return {passed:true}
    }
}

export const logAction:Action={
    id:'log',
    name:'Log',
    description:'Log a message',
    handler:async(context:ActionContext)=>{
        const input=context.inputData
        console.log(input)
        return input
    }
}

export const transformDataAction:Action={
    id:'transform-data',
    name:'Transform Data',
    description:'Transform data',
    handler:async(context:ActionContext)=>{
        const{source,fields}=context.inputData||{}
        if(!fields||!Array.isArray(fields)){
            throw new Error('fields must be an array')
        }
        const pick=(obj:any)=>{
            const result:any={}
            for(const f of fields){
                if(obj[f]!==undefined){
                    result[f]=obj[f]
                }
            }
            return result
        }
        if(Array.isArray(source)){
            return{
                data:source.map(pick)
            }
        }
        if(typeof source==='object'&&source!==null){
            return{
                data:pick(source)
            }
        }
        return{
            data:source
        }
    }
}