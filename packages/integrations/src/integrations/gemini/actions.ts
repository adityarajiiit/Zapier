import{Action,ActionContext} from'../../types.js'
import{
    GenerateTextInput,
    SummarizeInput,
    ClassifyInput,
    ExtractDataInput,
    TransformTextInput
} from'./types.js'

const geminimodel='gemini-3.5-flash-lite'

const url='https://generativelanguage.googleapis.com/v1beta/models'

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
    const res=await fetch(`${url}/${model}:generateContent?key=${apiKey}`,{
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify(body)
    })
    if(!res.ok){
        throw new Error(`${res.status}`)
    }
    const data=await res.json()
    return data.candidates[0].content[0].text||''
}

export const generateTextAction:Action={
    id:'generate-text',
    name:'Generate Text',
    description:'It generates text from a given prompt',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as GenerateTextInput
        const apiKey=context.credentialData?.apiKey as string
        const model=input.model||geminimodel
        const text=await callGemini(apiKey,model,input.prompt,input.systemInstructions)
        return {text}
    }
}

export const summarizeAction:Action={
    id:'summarize',
    name:'Summarize',
    description:'Summarize long text',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as SummarizeInput
        const apiKey=context.credentialData?.apiKey as string
        const type=input.type||'paragraph'
        let instruction='Summarize the above text in a concise manner.'
        if(type==="points"){
            instruction='Summarize the above text in points in a bullet format'
        }
        if(type==="tldr"){
            instruction='Summarize the above text in a tldr in one line'
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
    description:'Categorize text into categories',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as ClassifyInput
        const apiKey=context.credentialData?.apiKey as string
        const instruction=`Categorize the following text into the following categories: ${input.categories.join(', ')}.Return only the category name.`
        const text=await callGemini(apiKey,geminimodel,input.text,instruction)
        return {category:text.trim()}
    }
}

export const extractDataAction:Action={
    id:'extract-data',
    name:'Extract Data',
    description:'Extract data from text',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as ExtractDataInput
        const apiKey=context.credentialData?.apiKey as string
        const instruction=`Extract the following fields from the text: ${input.fields.join(', ')} return the result in JSON format and if a field is not found return null`
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
    description:'Transform text based on instructions',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as TransformTextInput
        const apiKey=context.credentialData?.apiKey as string
        const text=await callGemini(apiKey,geminimodel,input.text,input.instructions)
        return {text}
    }
}