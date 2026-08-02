import{Integration} from"../../types.js"
import{
    sendEmailAction,
    replyToEmailAction,
    addLabelAction,
    createDraftAction,
    searchEmailsAction,
}from"./actions.js"

import{
    newEmailTrigger,
    newLabeledEmailTrigger,
    newAttachmentTrigger,
} from './triggers.js'

export const integrationGmail:Integration={
    id:'gmail',
    name:'Gmail',
    description:'Gmail integration for sending and receiving emails',
    icon:'https://ssl.gstatic.com/ui/v1/icons/mail/logo_loading_2x.png',
    authType:'OAUTH2',
    triggers:{
        'new-email':newEmailTrigger,
        'new-labeled-email':newLabeledEmailTrigger,
        'new-attachment':newAttachmentTrigger,
    },
    actions:{
        'send-email':sendEmailAction,
        'reply-to-email':replyToEmailAction,
        'add-label':addLabelAction,
        'create-draft':createDraftAction,
        'search-emails':searchEmailsAction,
    }

}