import{Action,ActionContext} from'../../types.js'
import{
    GenerateTextInput,
    SummarizeInput,
    ClassifyInput,
    ExtractDataInput,
    TransformTextInput
} from'./types.js'

const geminimodel=process.env.GEMINI_MODEL||'gemini-3.6-flash'

const url='https://generativelanguage.googleapis.com/v1beta/models'

const enc=(v:any)=>encodeURIComponent(String(v||''))

const callGemini=async(apiKey:string,model:string,prompt:string,systemInstructions?:string)=>{
    const body:any={
        contents:[{
            role:'user',
            parts:[{text:prompt}]
        }]
    }
    if(systemInstructions){
        body.systemInstruction={
            role:'user',
            parts:[{text:systemInstructions}]
        }
    }
    const controller=new AbortController()
    const timer=setTimeout(()=>controller.abort(),60000)
    let res:Response
    try{
        res=await fetch(`${url}/${enc(model)}:generateContent`,{
            method:'POST',
            headers:{
                'Content-Type':'application/json',
                'x-goog-api-key':apiKey
            },
            signal:controller.signal,
            body:JSON.stringify(body)
        })
    }
    finally{
        clearTimeout(timer)
    }
    if(!res.ok){
        throw new Error(`gemini responded ${res.status}`)
    }
    const data=await res.json()
    const text=data?.candidates?.[0]?.content?.parts?.[0]?.text
    if(typeof text!=='string'){
        const reason=data?.candidates?.[0]?.finishReason||data?.promptFeedback?.blockReason
        throw new Error(reason?`gemini returned no content (${reason})`:'gemini returned no content')
    }
    return text
}

export const generateTextAction:Action={
    id:'generate-text',
    name:'Generate Text',
    description:'generate text',
    inputSchema:{
        prompt:{type:'string',description:'text prompt.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'},
        systemInstructions:{type:'string',description:'system instructions'}
    },
    outputSchema:{
        type:'object',
        properties:{
            text:{type:'string'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as GenerateTextInput
        const apiKey=context.credentialData?.apiKey as string
        const text=await callGemini(apiKey,geminimodel,input.prompt,input.systemInstructions)
        return {text}
    }
}

export const summarizeAction:Action={
    id:'summarize',
    name:'Summarize',
    description:'summarize text',
    inputSchema:{
        text:{
            type:'string',
            description:'text to summarize.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'
        },
        type:{
            type:'string',
            description:'paragraph or points or table'
        }
    },
    outputSchema:{
        type:'object',
        properties:{
            text:{
                type:'string'
            }
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as SummarizeInput
        const apiKey=context.credentialData?.apiKey as string
        const type=input.type||'paragraph'
        let instruction='Summarize the above text in a concise manner.'
        if(type==="points"){
            instruction='Summarize the above text in points in a bullet format'
        }
        if(type==="table"){
            instruction='Summarize the above text in a table format'
        }
        const text=await callGemini(apiKey,geminimodel,input.text,instruction)
        return {text}
    }
}

export const categorizeAction:Action={
    id:'categorize',
    name:'Categorize',
    description:'categorize text',
    inputSchema:{
        text:{type:'string',description:'text to categorize.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'},
        categories:{type:'string',description:'comma separated categories like bug, feature.To use that data block write it as {{stepX.category}}'}
    },
    outputSchema:{
        type:'object',
        properties:{
            category:{type:'string'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as ClassifyInput
        const apiKey=context.credentialData?.apiKey as string
        const cats=Array.isArray(input.categories)?input.categories:String(input.categories).split(',').map(s=>s.trim())
        const instruction=`Categorize the following text into the following categories: ${cats.join(', ')}.Return only the category name.`
        const text=await callGemini(apiKey,geminimodel,input.text,instruction)
        return {category:text.trim()}
    }
}

export const extractDataAction:Action={
    id:'extract-data',
    name:'Extract Data',
    description:'extract data',
    inputSchema:{
        text:{type:'string',description:'source text.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'},
        fields:{type:'string',description:'comma separated fields to extract like phone, email.To use that data block write it as {{stepX.fieldname}}'}
    },
    outputSchema:{
        type:'object',
        properties:{
            data:{type:'object'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as ExtractDataInput
        const apiKey=context.credentialData?.apiKey as string
        const fields=Array.isArray(input.fields)?input.fields:String(input.fields).split(',').map(s=>s.trim())
        const instruction=`Extract the following fields from the text: ${fields.join(', ')} return the result in JSON format and if a field is not found return null`
        const text=await callGemini(apiKey,geminimodel,input.text,instruction)
        let data:any=text
        try{
            data=JSON.parse(text)
        }
        catch(e){}
        return {data}
    }
}

export const transformTextAction:Action={
    id:'transform-text',
    name:'Transform Text',
    description:'transform text',
    inputSchema:{
        text:{type:'string',description:'original text.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'},
        instructions:{type:'string',description:'instructions.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'}
    },
    outputSchema:{
        type:'object',
        properties:{
            text:{type:'string'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as TransformTextInput
        const apiKey=context.credentialData?.apiKey as string
        const text=await callGemini(apiKey,geminimodel,input.text,input.instructions)
        return {text}
    }
}