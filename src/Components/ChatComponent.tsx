import React, { useState, useEffect, useCallback, useRef } from "react";

import { MessageContainer } from "../Engine/GlobalDefinitions";

import ChatClient from "../Engine/ChatClient";
import './Styles.css'
import e from "express";





const chatClient = new ChatClient();


function ChatComponent() {
    const [messages, setMessages] = useState<MessageContainer[]>([]);
    const [mostRecentId, setMostRecentId] = useState<number>(0);
    const [localUser, setLocalUser] = useState(window.sessionStorage.getItem('userName') || "");
    const [message, setMessage] = useState<string>("Enter message here");
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
            <button onClick={() => chatClient.getNextMessages()}>More Messages</button>
            <div className="scrollable-text-view">
                {makeFormatedMessages()}
            </div>
            <input
                type="text"
                id="user"
                value={localUser}
                onChange={(e)=>{
                    setLocalUser(e.target.value);
                }}
            />
            <input
                type="text"
                id="message"
                placeholder={message}
                onKeyUp={(event) => {
                    localMessage = event.currentTarget.value;
                    setMessage(event.currentTarget.value);
                    if (event.key === "Enter") {
                        chatClient.sendMessage(localUser, localMessage);
                        // clear the message
                        event.currentTarget.value = "";
                        setMessage("");
                    }
                }}
            />

            <button onClick={() => {
                if (localUser !== user) {
                    alert(`You must use your real user name: ${user}!`);
                    return;
                }
                chatClient.sendMessage(localUser, localMessage)
                }}>Send</button>
        </div>
    );
}

export default ChatComponent;
