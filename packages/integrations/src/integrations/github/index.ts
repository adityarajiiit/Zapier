import { Integration } from "../../types.js";
import{
    createIssueAction,
    createCommentAction,
    createPrAction,
    addLabelAction,
    createRepoAction,
    listReposAction
}from'./actions.js'
import{
    newPushTrigger,
    newIssueTrigger,
    newPrTrigger,
    newStarTrigger,issueCommentTrigger
}from'./triggers.js'

export const integrationGithub:Integration={
    id:'github',
    name:'GitHub',
    description:'Platform for developers',
    icon:'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    authType:'OAUTH2',
    triggers:{
        'new-push':newPushTrigger,
        'new-issue':newIssueTrigger,
        'new-pr':newPrTrigger,
        'new-star':newStarTrigger,
        'issue-comment':issueCommentTrigger
    },
    actions:{
        'create-issue':createIssueAction,
        'create-comment':createCommentAction,
        'create-pr':createPrAction,
        'add-label':addLabelAction,
        'create-repo':createRepoAction,
        'list-repos':listReposAction
    }
}