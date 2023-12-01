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
    const [message, setMessage] = useState<string>("");
    const [action, setAction] = useState<string>("none");
    const [target, setTarget] = useState<string>("all");
    const bottomRef = useRef(null);


    const user = window.sessionStorage.getItem('userName');
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
              <div style={{width: "20%"}}>
                <label>
                  Action:
                  <select value={action} onChange={e => setAction(e.target.value)}>
                    <option value="none">none</option>
                    <option value="@">@</option>
                    <option value="DM">dm</option>
                  </select>
                </label>
                <label>
                  Target:
                  <select value={target} onChange={e => setTarget(e.target.value)}>
                    <option value="all">all</option>
                  </select>
                </label>
              </div>
              <textarea
                  style={{width: "60%"}}
                  id="message"
                  placeholder={"Enter message here"}
                  value={message}
                  onChange={(e) => {
                      setMessage(e.target.value);
                  }}
                  onKeyUp={(event) => {
                      if (event.key === "Enter") {
                        if (user === null) {
                          return;
                        }
                        chatClient.sendMessage(user, message);
                        // clear the message
                        setMessage("");
                      }
                  }}
              />

              <button
                style={{width: "15%"}}
                onClick={() => {
                  if (user === null) {
                    return;
                  }
                  chatClient.sendMessage(user, message)
                  setMessage("")
                  }}>Send</button>
            </div>
        </div>
    );
}

export default ChatComponent;
