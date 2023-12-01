import React, { useState, useEffect, useCallback, useRef } from "react";

import { MessageContainer } from "../Engine/GlobalDefinitions";

import ChatClient from "../Engine/ChatClient";
import './Styles.css'
import './ChatComponent.css'
import e from "express";





const chatClient = new ChatClient();


function ChatComponent() {
    const [messages, setMessages] = useState<MessageContainer[]>([]);
    const [mostRecentId, setMostRecentId] = useState<number>(0);
    const [localUser, setLocalUser] = useState(window.sessionStorage.getItem('userName') || "");
    const [message, setMessage] = useState<string>("");
    const bottomRef = useRef(null);


    const user = window.sessionStorage.getItem('userName');
    let localMessage = message;
    const updateDisplay = useCallback(() => {
        let updateNeeded = false;
        const newLastId = chatClient.messages[0].id;
        if (newLastId !== mostRecentId) {
            updateNeeded = true;
        }
        if (chatClient.previousMessagesFetched) {
            updateNeeded = true;
            chatClient.previousMessagesFetched = false;
        }
        if (!updateNeeded) {
            return;
        }

        let newMessages = [...chatClient.messages];

        setMessages(newMessages);
        setMostRecentId(newLastId);
    }, [mostRecentId, messages]);

    useEffect(() => {
        chatClient.setCallback(updateDisplay);
    }, [updateDisplay]);


    function makeFormatedMessages() {
        let formatedMessages = [...messages].reverse().map((message, index, array) => {
            if (index === array.length - 1) { // if this is the last message
                return <textarea key={index} readOnly value={message.id + "]" + message.user + ": " + message.message} ref={bottomRef} />
            } else {
                return <textarea key={index} readOnly value={message.id + "]" + message.user + ": " + message.message} />
            }
        });
        return formatedMessages;
    }

    return (
        <div className="chat-division">
            <h3>Chat</h3>
            <button
              style={{width: "30%"}}
              onClick={() => chatClient.getNextMessages()}
            >
              More Messages
            </button>
            <div className="scrollable-text-view">
                {makeFormatedMessages()}
            </div>
            <div className="submission-div">
              <input
                  style={{width: "20%"}}
                  type="text"
                  id="user"
                  value={localUser}
                  onChange={(e)=>{
                      setLocalUser(e.target.value);
                  }}
              />
              <input
                  style={{width: "60%"}}
                  type="text"
                  id="message"
                  placeholder={"Enter message here"}
                  value={message}
                  onChange={(e) => {
                      setMessage(e.target.value);
                  }}
                  onKeyUp={(event) => {
                      if (event.key === "Enter") {
                          chatClient.sendMessage(localUser, message);
                          // clear the message
                          setMessage("");
                      }
                  }}
              />

              <button
                style={{width: "20%"}}
                onClick={() => {
                  if (localUser !== user) {
                      alert(`You must use your real user name: ${user}!`);
                      return;
                  }
                  chatClient.sendMessage(localUser, message)
                  setMessage("")
                  }}>Send</button>
            </div>
        </div>
    );
}

export default ChatComponent;
