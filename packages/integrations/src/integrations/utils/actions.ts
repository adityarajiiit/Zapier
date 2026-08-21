import{Action,ActionContext} from '../../types.js'
export const delayAction:Action={
    id:'delay',
    name:'Delay',
    description:'Wait for N seconds',
    inputSchema:{
        seconds:{type:'string',description:'delay in seconds'}
    },
    outputSchema:{
        type:'object',
        properties:{
            delayedTime:{type:'number'}
        }
    },
    handler:async(context:ActionContext)=>{
        const seconds=Math.min(Number(context.inputData?.seconds)||1,300)
        await new Promise(resolve=>setTimeout(resolve,seconds*1000))
        return {delayedTime:seconds}
    }
}

export const httpRequestAction:Action={
    id:'http-request',
    name:'HTTP Request',
    description:'Make an HTTP request to any URL',
    inputSchema:{
        url:{type:'string',description:'url to fetch'},
        method:{type:'string',description:'GET, POST, PUT, DELETE'},
        headers:{type:'string',description:'JSON format headers like {"Authorization":"Bearer token"}.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'},
        body:{type:'string',description:'JSON format body like {"key":"value"}.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'}
    },
    outputSchema:{
        type:'object',
        properties:{
            status:{type:'number'},
            ok:{type:'boolean'},
            data:{type:'object'}
        }
    },
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
    inputSchema:{
        field:{type:'string',description:'field to check'},
        operator:{type:'string',description:'equals, not-equals, contains, greater-than, less-than'},
        value:{type:'string',description:'value to compare against'}
    },
    outputSchema:{
        type:'object',
        properties:{
            passed:{type:'boolean'}
        }
    },
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
    inputSchema:{
        message:{type:'string',description:'message to log'}
    },
    outputSchema:{
        type:'object',
        properties:{
            message:{type:'string'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData
        console.log(input)
        return input
    }
}
