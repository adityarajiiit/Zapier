import{Action,ActionContext} from'../../types.js'
import { CreateIssueInput,CreateCommentInput,CreatePrInput,AddLabelInput,CreateRepoInput,ListReposInput } from './types.js'

const enc=(v:any)=>encodeURIComponent(String(v||''))
const url='https://api.github.com'

const headers=(accessToken?:string)=>({
    'Authorization':`Bearer ${accessToken}`,
    'Accept':'application/vnd.github.v3+json',
    'Content-Type':'application/json',
    'User-Agent':'Zapier Integration'
})

export const createIssueAction:Action={
    id:'create-issue',
    name:'Create Issue',
    description:'create issue',
    inputSchema:{
        owner:{type:'string',description:'repo owner'},
        repo:{type:'string',description:'repo name'},
        title:{type:'string',description:'issue title.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'},
        body:{type:'string',description:'issue description body.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'},
        labels:{type:'string',description:'comma separated labels like bug, urgent.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'},
        assignees:{type:'string',description:'comma separated assignees like user1, user2.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'}
    },
    outputSchema:{
        type:'object',
        properties:{
            id:{type:'number'},
            number:{type:'number'},
            html_url:{type:'string'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as CreateIssueInput
        const accessToken=context.credentialData?.accessToken
        const res=await fetch(`${url}/repos/${enc(input.owner)}/${enc(input.repo)}/issues`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                title:input.title,
                body:input.body,
                labels:input.labels?.split(',').map(l=>l.trim()),
                assignees:input.assignees?.split(',').map(a=>a.trim()),
            })
        })

        if(!res.ok){
            throw new Error(`failed to create issue ${res.status}`)
        }
        return res.json()
    }
}
export const createCommentAction:Action={
    id:'create-comment',
    name:'Create Comment',
    description:'create issue comment',
    inputSchema:{
        owner:{type:'string',description:'repo owner'},
        repo:{type:'string',description:'repo name'},
        issueNumber:{type:'string',description:'issue number.To use that data block write it as {{stepX.number}}'},
        body:{type:'string',description:'comment body.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'}
    },
    outputSchema:{
        type:'object',
        properties:{
            id:{type:'number'},
            html_url:{type:'string'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as CreateCommentInput
        const accessToken=context.credentialData?.accessToken
        const res=await fetch(`${url}/repos/${enc(input.owner)}/${enc(input.repo)}/issues/${enc(input.issueNumber)}/comments`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                body:input.body,
            })
        })

        if(!res.ok){
            throw new Error(`failed to create comment ${res.status}`)
        }
        return res.json()
    }
    
}

export const createPrAction:Action={
    id:'create-pr',
    name:'Create Pull Request',
    description:'create pull request',
    inputSchema:{
        owner:{type:'string',description:'repo owner'},
        repo:{type:'string',description:'repo name'},
        title:{type:'string',description:'pr title'},
        body:{type:'string',description:'pr body.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'},
        head:{type:'string',description:'head branch.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'},
        base:{type:'string',description:'base branch.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'}
    },
    outputSchema:{
        type:'object',
        properties:{
            id:{type:'number'},
            number:{type:'number'},
            html_url:{type:'string'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as CreatePrInput
        const accessToken=context.credentialData?.accessToken
        const res=await fetch(`${url}/repos/${enc(input.owner)}/${enc(input.repo)}/pulls`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                title:input.title,
                body:input.body,
                head:input.head,
                base:input.base,
            })
        })

        if(!res.ok){
            throw new Error(`failed to create pr ${res.status}`)
        }
        return res.json()
    }
}

export const addLabelAction:Action={
    id:'add-label',
    name:'Add Label',
    description:'add issue label',
    inputSchema:{
        owner:{type:'string',description:'repo owner'},
        repo:{type:'string',description:'repo name'},
        issueNumber:{type:'string',description:'issue number.To use that data block write it as {{stepX.number}}'},
        labels:{type:'string',description:'comma separated labels like bug, urgent.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'}
    },
    outputSchema:{
        type:'object',
        properties:{
            labels:{type:'array'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as AddLabelInput
        const accessToken=context.credentialData?.accessToken
        const res=await fetch(`${url}/repos/${enc(input.owner)}/${enc(input.repo)}/issues/${enc(input.issueNumber)}/labels`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                labels:input.labels?.split(',').map(l=>l.trim()),
            })
        })

        if(!res.ok){
            throw new Error(`failed to add label ${res.status}`)
        }
        return {labels:await res.json()}
    }
}

export const createRepoAction:Action={
    id:'create-repo',
    name:'Create Repository',
    description:'create repository',
    inputSchema:{
        name:{type:'string',description:'repo name'},
        description:{type:'string',description:'repo description'},
        private:{type:'string',description:'is private true/false'}
    },
    outputSchema:{
        type:'object',
        properties:{
            id:{type:'number'},
            html_url:{type:'string'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as CreateRepoInput
        const accessToken=context.credentialData?.accessToken
        const res=await fetch(`${url}/user/repos`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                name:input.name,
                description:input.description,
                private:input.private,
            })
        })

        if(!res.ok){
            throw new Error(`failed to create repo ${res.status}`)
        }
        return res.json()
    }
}

export const listReposAction:Action={
    id:'list-repos',
    name:'List Repositories',
    description:'list repositories',
    inputSchema:{
        perPage:{type:'string',description:'per page count'},
        sort:{type:'string',description:'sort by created, updated, pushed or full_name'}
    },
    outputSchema:{
        type:'object',
        properties:{
            repos:{type:'array'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as ListReposInput
        const accessToken=context.credentialData?.accessToken
        const queryParams=new URLSearchParams()
        if(input.perPage){
            queryParams.append('per_page',input.perPage.toString())
        }
        if(input.sort){
            queryParams.append('sort',input.sort)
        }
        const query=queryParams.toString()?`?${queryParams.toString()}`:''
        const res=await fetch(`${url}/user/repos${query}`,{
            method:'GET',
            headers:headers(accessToken),
        })

        if(!res.ok){
            throw new Error(`failed to list repos ${res.status}`)
        }
        return {repos:await res.json()}
    }
}