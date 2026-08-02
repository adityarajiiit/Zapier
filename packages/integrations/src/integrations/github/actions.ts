import{Action,ActionContext} from'../../types.js'
import { CreateIssueInput,CreateCommentInput,CreatePrInput,AddLabelInput,CreateRepoInput,ListReposInput } from './types.js'
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
    description:'Create a new issue in a github repo',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as CreateIssueInput
        const accessToken=context.credentialData?.accessToken
        const res=await fetch(`${url}/repos/${input.owner}/${input.repo}/issues`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                title:input.title,
                body:input.body,
                labels:input.labels,
                assignees:input.assignees,
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
    description:'Create a new comment on a github issue',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as CreateCommentInput
        const accessToken=context.credentialData?.accessToken
        const res=await fetch(`${url}/repos/${input.owner}/${input.repo}/issues/${input.issueNumber}/comments`,{
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
    description:'Create a new pull request',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as CreatePrInput
        const accessToken=context.credentialData?.accessToken
        const res=await fetch(`${url}/repos/${input.owner}/${input.repo}/pulls`,{
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
    description:'Add labels to a github issue',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as AddLabelInput
        const accessToken=context.credentialData?.accessToken
        const res=await fetch(`${url}/repos/${input.owner}/${input.repo}/issues/${input.issueNumber}/labels`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                labels:input.labels,
            })
        })

        if(!res.ok){
            throw new Error(`failed to add label ${res.status}`)
        }
        return res.json()
    }
}

export const createRepoAction:Action={
    id:'create-repo',
    name:'Create Repository',
    description:'Create a new github repository',
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
    description:'List all repositories',
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
        return res.json()
    }
}