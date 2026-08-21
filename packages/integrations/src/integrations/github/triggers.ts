import { Trigger } from "../../types.js";
export const newPushTrigger:Trigger={
    id:'new-push',
    name:'New Push',
    description:'new push',
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
    description:'new issue',
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
    description:'new pull request',
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
    description:'new star',
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
    description:'issue comment',
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