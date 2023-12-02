/**
 * Database of chat messages and users
 * 
 * @class Database
 */

import { MessagesContainer, MessageContainer } from './GlobalDefinitions';

class Message implements MessageContainer {
    /**
     * The message text
     * 
     * @private
     * @type {string}
     * @memberof Message
     */
    message: string;
    /**
     * The user who sent the message
     * 
     * @private
     * @type {string}
     * @memberof Message
     */
    user: string;
    /**
     * The timestamp of the message
     * 
     * @private
     * @type {Date}
     * @memberof Message
     */
    timestamp: Date;
    /**
     * the id of the message 
     * @param {number} id
     * @memberof Message
     * 
     * */
    id: number = 0;
    /**
     * user getting mentioned in the message
     */
    atTarget: string;

    /**
     * Creates an instance of Message.
     * @param {string} text 
     * @param {User} user 
     * @memberof Message
     */
    constructor(text: string, user: string, id: number, atTarget: string) {
        this.message = text;
        this.user = user;
        this.timestamp = new Date();
        this.id = id;
        this.atTarget = atTarget;
    }
}



class Database {
    /**
     * Array of chat messages
     * 
     * @private
     * @type {Message[]}
     * @memberof Database
     */
    private messages: Message[] = [];
    private messageCount: number = 0;
    private blockLists: Map<string, string[]> = new Map<string, string[]>();




    /**
     * Creates an instance of Database.
     * @memberof Database
     */
    constructor() {
        this.messages = [];
        this.messageCount = 0;
        this.blockLists = new Map<string, string[]>();
    }

    reset() {
        this.messages = [];
        this.messageCount = 0;
        this.blockLists = new Map<string, string[]>();
    }  

    // get a user's block list
    getBlockList(user: string): string[] {
        if (!user) {
            return [];
        }
         else if (!this.blockLists.has(user)) {
            return [];
        } else {
            const blockList = this.blockLists.get(user);
            if (blockList) {
                return blockList;
            } else {
                return [];
            }
        }
    }

    // add a user to another user's block list
    blockUser(user: string, userToBlock: string) {
        if (!this.blockLists.has(user)) {
            this.blockLists.set(user, [userToBlock]);
        } else {
            const blockList = this.blockLists.get(user);
            if (blockList) {
                const index = blockList.indexOf(userToBlock);
                if (index === -1) {
                    blockList.push(userToBlock);
                }
            }
        }
    }

    // remove a user from another user's block list
    unblockUser(user: string, userToUnblock: string) {
        if (!this.blockLists.has(user)) {
            return;
        } else {
            const blockList = this.blockLists.get(user);
            if (blockList) {
                const index = blockList.indexOf(userToUnblock);
                if (index !== -1) {
                    blockList.splice(index, 1);
                }
            }
        }
    }

    /**
     * Add a message to the database
     * 
     * @param {Message} message 
     * @memberof Database
     */
    addMessage(user: string, message: string, atTarget: string) {
        // prepend the message to the array
        this.messages.unshift(new Message(message, user, this.messageCount++, atTarget));
    }

    // get all messages  this is for testing only, do not use in production
    getAllMessages(): MessagesContainer {
        const result: MessagesContainer = {
            messages: this.messages,
            paginationToken: "__TEST_DISABLE_IN_PRODUCTION__"
        }

        return result;
    }

    /**
     * Get all messages paged by 10
     * 
     * @returns {Message[]} 
     * @memberof Database
     */
    getMessages(pagingToken: string, user: string): MessagesContainer {
        // if paging token is "__END__" then send empty array and "__END__"
        if (pagingToken === "__END__") {
            return {
                messages: [],
                paginationToken: "__END__"
            }
        }

        // if less than paging size then send message and "__END__"
        // if (this.messages.length <= 20 && pagingToken === "") {
        //     const result: MessagesContainer = {
        //         messages: this.messages,
        //         paginationToken: "__END__"
        //     }
        //     return result;
        // }

        // if (pagingToken === "") {
        //     //
        //     // generate Unique ID for this user that contains the message id of the next message to be sent
        //     // get the ten messages to send (the last ones)
        //     const messagesToSend = this.messages.slice(0, 20);

        //     // get the id of the next message in the array right now
        //     const nextMessageId = this.messages[20].id;
        //     const paginationToken = `__${nextMessageId.toString().padStart(20, '0')}__`;
        //     const result: MessagesContainer = {
        //         messages: messagesToSend,
        //         paginationToken: paginationToken
        //     }
        //     return result;
        // }

        let nextMessageIndex = 0;

        if (pagingToken !== "") {
            // get rid of the __ at the beginning and end of the token
            pagingToken = pagingToken.substring(2, pagingToken.length - 2);
            // get the next message id from the token
            let nextMessageId = parseInt(pagingToken);
            // get the index of the next message
            nextMessageIndex = this.messages.findIndex((message) => message.id === nextMessageId);
        }

        // // get rid of the __ at the beginning and end of the token
        // pagingToken = pagingToken.substring(2, pagingToken.length - 2);
        // // get the next message id from the token
        // let nextMessageId = parseInt(pagingToken);
        // // get the index of the next message
        // const nextMessageIndex = this.messages.findIndex((message) => message.id === nextMessageId);
        // if the next message is not found, then return empty array and "__END__"
        if (nextMessageIndex === -1) {
            return {
                messages: [],
                paginationToken: "__END__"
            }
        }

        // At this point we know we have some messages to send.

        const messagesToSend: Message[] = [];

        let addedCounter = 0;
        let checkedCounter = 0;

        while (addedCounter < 20 && checkedCounter < (this.messages.length - nextMessageIndex)) {
            const message = this.messages[nextMessageIndex + checkedCounter];
            if (message.user !== user) {
                const blockList = this.getBlockList(user);
                if (blockList.indexOf(message.user) === -1) {
                    messagesToSend.push(message);
                    addedCounter++;
                }
            } else {
                messagesToSend.push(message);
                addedCounter++;
            }
            checkedCounter++;
        }

        // const messagesToSend = this.messages.slice(nextMessageIndex, nextMessageIndex + 20);
        // if (messagesToSend.length < 20) {
        //     return {
        //         messages: messagesToSend,
        //         paginationToken: "__END__"
        //     }
        // }

        // so there were 10 messages to send.   
        // Are these 10 the last 10, if so then send "__END__" as the token
        // if (nextMessageIndex + 20 >= this.messages.length) {
        //     return {
        //         messages: messagesToSend,
        //         paginationToken: "__END__"
        //     }
        // }

        if (checkedCounter >= (this.messages.length - nextMessageIndex)) {
            return {
                messages: messagesToSend,
                paginationToken: "__END__"
            }
        }

        // nextMessageId = this.messages[nextMessageIndex + 20].id;
        let nextMessageId = this.messages[nextMessageIndex + checkedCounter].id;
        // generate Unique ID for this user that contains the message id of the next message to be sent
        let paginationToken = `__${nextMessageId.toString().padStart(20, '0')}__`;
        // if the next message is the last one, then send "__END__" as the token

        const result: MessagesContainer = {
            messages: messagesToSend,
            paginationToken: paginationToken
        }
        return result;
    }
}

export { Database, Message };
