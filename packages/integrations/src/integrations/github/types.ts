export interface GithubRepo{
    id:number
    name:string
    fullName:string
    description:string|null
    private:boolean
    htmlUrl:string
    owner:{
        login:string
        id:number
        avatarUrl:string
        htmlUrl:string
    }
}

export interface GithubIssue{
    id:number
    number:number
    title:string
    body:string|null
    state:string
    labels:{
        id:number
        name:string
    }[]
    assignees:{
        id:number
        login:string
    }[]
    htmlUrl:string
}

export interface GithubPullRequest{
    id:number
    number:number
    title:string
    body:string|null
    state:string
    head:{
        ref:string
        sha:string
    }
    base:{
        ref:string
        sha:string
    }
    htmlUrl:string
}

export interface GithubComment{
    id:number
    body:string
    user:GithubUser
    createdAt:string
}

export interface GithubUser{
    id:number
    login:string
    avatarUrl:string
    htmlUrl:string
}

export interface CreateIssueInput{
    owner:string
    repo:string
    title:string
    body?:string
    labels?:string
    assignees?:string
}

export interface CreateCommentInput{
    owner:string
    repo:string
    issueNumber:number
    body:string
}

export interface CreatePrInput{
    owner:string
    repo:string
    title:string
    body?:string
    head:string
    base:string
}

export interface AddLabelInput{
    owner:string
    repo:string
    issueNumber:number
    labels:string
}

export interface CreateRepoInput{
    name:string
    description?:string
    private?:boolean
}

export interface ListReposInput{
    perPage?:number
    sort?:string
}