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
     * Creates an instance of Message.
     * @param {string} text 
     * @param {User} user 
     * @memberof Message
     */


    constructor(text: string, user: string, id: number) {
        this.message = text;
        this.user = user;
        this.timestamp = new Date();
        this.id = id;

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




    /**
     * Creates an instance of Database.
     * @memberof Database
     */
    constructor() {
        this.messages = [];
        this.messageCount = 0;
    }

    reset() {
        this.messages = [];
        this.messageCount = 0;
    }

    /**
     * Add a message to the database
     * 
     * @param {Message} message 
     * @memberof Database
     */
    addMessage(user: string, message: string) {
        // prepend the message to the array
        this.messages.unshift(new Message(message, user, this.messageCount++));
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
    getMessages(pagingToken: string): MessagesContainer {
        // if paging token is "__END__" then send empty array and "__END__"
        if (pagingToken === "__END__") {
            return {
                messages: [],
                paginationToken: "__END__"
            }
        }

        // if less than paging size then send message and "__END__"
        if (this.messages.length <= 10 && pagingToken === "") {
            const result: MessagesContainer = {
                messages: this.messages,
                paginationToken: "__END__"
            }
            return result;
        }

        if (pagingToken === "") {
            //
            // generate Unique ID for this user that contains the message id of the next message to be sent
            // get the ten messages to send (the last ones)
            const messagesToSend = this.messages.slice(0, 10);

            // get the id of the next message in the array right now
            const nextMessageId = this.messages[10].id;
            const paginationToken = `__${nextMessageId.toString().padStart(10, '0')}__`;
            const result: MessagesContainer = {
                messages: messagesToSend,
                paginationToken: paginationToken
            }
            return result;
        }

        // get rid of the __ at the beginning and end of the token
        pagingToken = pagingToken.substring(2, pagingToken.length - 2);
        // get the next message id from the token
        let nextMessageId = parseInt(pagingToken);
        // get the index of the next message
        const nextMessageIndex = this.messages.findIndex((message) => message.id === nextMessageId);
        // if the next message is not found, then return empty array and "__END__"
        if (nextMessageIndex === -1) {
            return {
                messages: [],
                paginationToken: "__END__"
            }
        }

        // At this point we know we have some messages to send.



        const messagesToSend = this.messages.slice(nextMessageIndex, nextMessageIndex + 10);
        if (messagesToSend.length < 10) {
            return {
                messages: messagesToSend,
                paginationToken: "__END__"
            }
        }

        // so there were 10 messages to send.   
        // Are these 10 the last 10, if so then send "__END__" as the token
        if (nextMessageIndex + 10 >= this.messages.length) {
            return {
                messages: messagesToSend,
                paginationToken: "__END__"
            }
        }

        nextMessageId = this.messages[nextMessageIndex + 10].id;
        // generate Unique ID for this user that contains the message id of the next message to be sent
        let paginationToken = `__${nextMessageId.toString().padStart(10, '0')}__`;
        // if the next message is the last one, then send "__END__" as the token

        const result: MessagesContainer = {
            messages: messagesToSend,
            paginationToken: paginationToken
        }
        return result;
    }
}

export { Database, Message };
