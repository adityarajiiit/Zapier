import { Trigger } from "../../types.js";
export const newPushTrigger:Trigger={
    id:'new-push',
    name:'New Push',
    description:'Triggers when a new push is made to repo',
    triggerType:'WEBHOOK',
    outputSchema:{
        type:'object',
        properties:{
            ref:{
                type:'string'
            },
            before:{
                type:'string'
            },
            after:{
                type:'string'
            },
            repository:{
                type:'object',
            },
            pusher:{
                type:'object'
            }
        }
    }
}

export const newIssueTrigger:Trigger={
    id:'new-issue',
    name:'New Issue',
    description:'Triggers when a new issue is created',
    triggerType:'WEBHOOK',
    outputSchema:{
        type:'object',
        properties:{
            action:{
                type:'string'
            },
            issue:{
                type:'object'
            },
            repository:{
                type:'object'
            },
            sender:{
                type:'object'
            }
        }
    }
}

export const newPrTrigger:Trigger={
    id:'new-pr',
    name:'New Pull Request',
    description:'Triggers when a new PR is opened',
    triggerType:"WEBHOOK",
    outputSchema:{
        type:'object',
        properties:{
            action:{
                type:'string'
            },
            pull_request:{
                type:'object'
            },
            repository:{
                type:'object'
            },
            sender:{
                type:'object'
            }
        }
    }
}

export const newStarTrigger:Trigger={
    id:'new-star',
    name:'New Star',
    description:'Triggers when a repo is starred',
    triggerType:'WEBHOOK',
    outputSchema:{
        type:'object',
        properties:{
            action:{
                type:'string'
            },
            repository:{
                type:'object'
            },
            sender:{
                type:'object'
            }
        }
    }
}

export const issueCommentTrigger:Trigger={
    id:'issue-comment',
    name:'Issue Comment',
    description:'Triggers when a comment is added to an issue',
    triggerType:'WEBHOOK',
    outputSchema:{
        type:'object',
        properties:{
            action:{
                type:'string'
            },
            issue:{
                type:'object'
            },
            repository:{
                type:'object'
            },
            comment:{
                type:'object'
            },
            sender:{
                type:'object'
            }
        }
    }
}