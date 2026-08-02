import { Trigger } from "../../types.js";

export const newMessageTrigger:Trigger={
    id:'new-message',
    name:'New Message',
    description:'Triggers on a new message in a channel',
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
    description:'Triggers on a new reaction to a message',
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
    description:'Triggers on a new channel',
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
    description:'Triggers when the bot is mentioned',
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