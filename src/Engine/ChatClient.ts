/**
 * ChatClient
 *
 * @export
 *
 */

import {
  MessagesContainer,
  MessageContainer,
} from "../Engine/GlobalDefinitions";
import {
  PortsGlobal,
  LOCAL_SERVER_URL,
  RENDER_SERVER_URL,
} from "../ServerDataDefinitions";

class ChatClient {
  earliestMessageID: number = 10000000000;
  previousMessagesFetched: boolean = false;

  messages: MessageContainer[] = [];
  blockList: string[] = [];

  updateDisplay: () => void = () => {};
  updateBlockList: () => void = () => {};
  /**
   * Creates an instance of ChatClient.
   * @memberof ChatClient
   */
  constructor() {
    console.log("ChatClient");
    this.getMessages();
    this.getMessagesContinuously();
  }

  setCallback(callback: () => void) {
    this.updateDisplay = callback;
  }

  setBlockListCallback(callback: () => void) {
    this.updateBlockList = callback;
  }

  //get block list from server
  fetchBlockList(user: string) {
    const url = `${LOCAL_SERVER_URL}/blocklist/get/${user}`;
    fetch(url)
      .then((response) => response.json())
      .then((blockList: string[]) => {
        this.blockList = blockList;
        this.updateBlockList();
      })
      .catch((error) => {
        console.error(error);
      });
  }

  // add a user to the block list
  blockUser(user: string, userToBlock: string) {
    const url = `${LOCAL_SERVER_URL}/blocklist/add`;
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({ user: user, userToBlock: userToBlock }),
      })
      .then((response) => response.json())
      .then((blockList: string[]) => {
        this.blockList = blockList;
        this.updateBlockList();
      })
      .catch((error) => {
        console.error(error);
      });
  }

  // remove a user from the block list
  unblockUser(user: string, userToUnblock: string) {
    const url = `${LOCAL_SERVER_URL}/blocklist/remove`;
    fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({ user: user, userToUnblock: userToUnblock }),
      })
      .then((response) => response.json())
      .then((blockList: string[]) => {
        this.blockList = blockList;
        this.updateBlockList();
      })
      .catch((error) => {
        console.error(error);
      });
  }

  insertMessage(message: MessageContainer) {
    const messageID = message.id;

    if (this.earliestMessageID > messageID) {
      this.earliestMessageID = messageID;
    }

    if (this.messages.length === 0) {
      this.messages.push(message);
      console.log(`inserted message ${messageID} into empty array`);
      return;
    }

    if (messageID > this.messages[0].id) {
      this.messages.unshift(message);
      console.log(
        `inserted message ${messageID} at the beginning of the array`
      );

      return;
    }

    if (messageID < this.messages[this.messages.length - 1].id) {
      this.messages.push(message);
      console.log(`inserted message ${messageID} at the end of the array`);
      this.previousMessagesFetched = true;

      return;
    }
    // console.log(`Message is not inserted ${messageID}`)
  }

  insertMessages(messages: MessageContainer[]) {
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      this.insertMessage(message);
    }
    this.updateDisplay();
  }

  /**
   * get the last 10 messages from the server if the paging token is empty
   * get the next 10 messages from the server if the paging token is not empty
   */
  getMessages(pagingToken: string = "") {
    const url = `${LOCAL_SERVER_URL}/messages/get/`;
    //const url = `https://pagination-demo.onrender.com/messages/get`

    const fetchURL = `${url}${pagingToken}`;
    fetch(fetchURL)
      .then((response) => response.json())
      .then((messagesContainer: MessagesContainer) => {
        let messages = messagesContainer.messages;
        this.insertMessages(messages);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  /**
   * get the messages once a second
   */
  getMessagesContinuously() {
    console.log("getMessagesContinuously()");
    setInterval(() => {
      this.getMessages();
    }, 1000);
  }

  getNextMessages() {
    console.log("getNextMessages()");
    console.log(`this.earliestMessageID: ${this.earliestMessageID - 1}`);
    const nextMessageToFetch = this.earliestMessageID - 1;
    const pagingToken = `__${nextMessageToFetch
      .toString()
      .padStart(10, "0")}__`;
    this.getMessages(pagingToken);
  }

  sendMessage(user: string, message: string, atTarget: string) {
    console.log("sentMessage()");
    console.log(this.earliestMessageID);
    const url = `${LOCAL_SERVER_URL}/message/${user}`;
    //const url = `https://pagination-demo.onrender.com/message/${user}/${message}/${atTarget}`

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: message, atTarget: atTarget }),
    })
      .then((response) => response.json())
      .then((messagesContainer: MessagesContainer) => {
        let messages = messagesContainer.messages;
        this.insertMessages(messages);
      })
      .catch((error) => {
        console.error(error);
      });
  }
}

export default ChatClient;
