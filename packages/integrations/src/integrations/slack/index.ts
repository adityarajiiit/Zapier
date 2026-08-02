import { Integration } from "../../types.js";
import{
    sendMessageAction,
    sendDmAction,
    createChannelAction,
    setTopicAction,
    addReactionAction,
    uploadFileAction
}from "./actions.js"

import{
    newMessageTrigger,
    newReactionTrigger,
    newChannelTrigger,
    mentionTrigger
} from'./triggers.js'

export const integrationSlack:Integration={
    id:'slack',
    name:'Slack',
    description:'Team Chat platform',
    icon:"https://cdn.brandfolder.io/5H442O3W/at/pl546j-7le8zk-6gwiyo/Slack_Mark.svg",
    authType:'OAUTH2',
    triggers:{
        'new-message':newMessageTrigger,
        'new-reaction':newReactionTrigger,
        'new-channel':newChannelTrigger,
        'mention':mentionTrigger
    },
    actions:{
        'send-message':sendMessageAction,
        'send-dm':sendDmAction,
        'create-channel':createChannelAction,
        'set-topic':setTopicAction,
        'add-reaction':addReactionAction,
        'upload-file':uploadFileAction
    }
}