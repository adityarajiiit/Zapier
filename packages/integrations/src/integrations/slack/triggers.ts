import { Trigger } from "../../types.js";

export const newMessageTrigger:Trigger={
    id:'new-message',
    name:'New Message',
    description:'new message',
    triggerType:'WEBHOOK',
    outputSchema:{
        type:'object',
        properties:{
            type:{
                type:'string'
            },
            channel:{
                type:'string'
            },
            user:{
                type:'string'
            },
            text:{
                type:'string'
            },
            ts:{
                type:'string'
            }
        }
    }
}

export const newReactionTrigger:Trigger={
    id:'new-reaction',
    name:'New Reaction',
    description:'new reaction',
    triggerType:'WEBHOOK',
    outputSchema:{
        type:'object',
        properties:{
            type:{
                type:'string'
            },
            user:{
                type:'string'
            },
            reaction:{
                type:'string'
            },
            item:{
                type:'object'
            },
            event_ts:{
                type:'string'
            }
        }
    }
}

export const newChannelTrigger:Trigger={
    id:'new-channel',
    name:'New Channel',
    description:'new channel',
    triggerType:'WEBHOOK',
    outputSchema:{
        type:'object',
        properties:{
            type:{
                type:'string'
            },
            channel:{
                type:'object'
            }
        }
    }
}

export const mentionTrigger:Trigger={
    id:'mention',
    name:'App Mention',
    description:'app mention',
    triggerType:'WEBHOOK',
    outputSchema:{
        type:'object',
        properties:{
            type:{
                type:'string'
            },
            channel:{
                type:'string'
            },
            user:{
                type:'string'
            },
            text:{
                type:'string'
            },
            ts:{
                type:'string'
            }
        }
    }
}