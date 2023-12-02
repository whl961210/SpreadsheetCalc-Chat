import React, { useState, useEffect, useCallback, useRef } from "react";

import { MessageContainer } from "../Engine/GlobalDefinitions";

import ChatClient from "../Engine/ChatClient";
import "./Styles.css";
import "./ChatComponent.css";
import e from "express";

const chatClient = new ChatClient();

function ChatComponent() {
  const [messages, setMessages] = useState<MessageContainer[]>([]);
  const [mostRecentId, setMostRecentId] = useState<number>(0);
  const [message, setMessage] = useState<string>("");
  const [action, setAction] = useState<string>("none");
  const [target, setTarget] = useState<string>("all");
  const [users, setUsers] = useState<string[]>([]);
  const bottomRef = useRef(null);
  const [lastMessageId, setLastMessageId] = useState<number>(-1);
  const [blockList, setBlockList] = useState<string[]>([]);
  const [blockListRefresher, setBlockListRefresher] = useState<boolean>(false);
  const [selectedBlockedUser, setSelectedBlockedUser] = useState<string>("");

  const user = window.sessionStorage.getItem("userName");
  const updateDisplay = useCallback(() => {
    let updateNeeded = false;

    const newLastId = chatClient.messages[0]?.id;

    if (chatClient.messages.length === 0) {
      updateNeeded = true;
    } else if (chatClient.messages[0].id !== mostRecentId) {
      updateNeeded = true;
    }

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

    let newUsers = [...newMessages].map((message) => message.user);

    setMessages(newMessages);
    setUsers(newUsers);
    setMostRecentId(newLastId);
  }, [mostRecentId, messages]);

  const blockListUpdater = useCallback(() => {
    setBlockListRefresher(!blockListRefresher);
  }, [blockListRefresher]);
  chatClient.setBlockListCallback(blockListUpdater);

  useEffect(() => {
    chatClient.setCallback(updateDisplay);
  }, [updateDisplay]);

  useEffect(() => {
    //scroll to bottom
    if (bottomRef.current !== null) {
      // @ts-ignore
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [lastMessageId]);

  useEffect(() => {
    chatClient.fetchBlockList(user || "");
  }, [user]);

  useEffect(() => {
    setBlockList(chatClient.blockList);
  }, [blockListRefresher]);

  function makeFormatedMessages() {
    let formatedMessages = [...messages]
      .reverse()
      .map((message, index, array) => {
        if (index === array.length - 1) {
          // if this is the last message
          if (message.id !== lastMessageId) {
            setLastMessageId(message.id);
          }
          return (
            <div style={{ position: "relative" }} key={index}>
              {message.user!==user && <button
                style={{ position: "absolute", right: "5px", top: "5px" }}
                onClick={() => {
                  blockUser(message.user);
                }}
              >
                block
              </button>}
              <textarea
                className={
                  message.atTarget === user || message.atTarget === "all"
                    ? "at-message"
                    : "general-message"
                }
                readOnly
                value={
                  message.id +
                  "]" +
                  message.user +
                  (message.atTarget ? " @ " + message.atTarget : "") +
                  ": " +
                  message.message
                }
                ref={bottomRef}
              />
            </div>
          );
        } else {
          return (
            <div style={{ position: "relative" }} key={index}>
              {message.user!==user && <button
                style={{ position: "absolute", right: "5px", top: "5px" }}
                onClick={() => {
                  blockUser(message.user);
                }}
              >
                block
              </button>}
              <textarea
                className={
                  message.atTarget === user || message.atTarget === "all"
                    ? "at-message"
                    : "general-message"
                }
                readOnly
                value={
                  message.id +
                  "]" +
                  message.user +
                  (message.atTarget ? " @ " + message.atTarget : "") +
                  ": " +
                  message.message
                }
              />
            </div>
          );
        }
      });
    return formatedMessages;
  }

  function makeUserList() {
    let noDupUsers = new Set<string>();

    [...users].forEach((user) => {
      noDupUsers.add(user);
    });

    let userList = [...noDupUsers].map((user) => {
      if (user !== window.sessionStorage.getItem("userName")) {
        return (
          <option key={user} value={user}>
            {user}
          </option>
        );
      } else {
        return null;
      }
    });
    return userList;
  }

  function makeBlockList() {
    return [...blockList].map((user) => {
      return (
        <option key={user} value={user}>
          {user}
        </option>
      );
    });
  }

  function sendMessage() {
    if (user === null) {
      return;
    }
    if (action === "@") {
      chatClient.sendMessage(user, message, target);
    } else {
      chatClient.sendMessage(user, message, "");
    }
    setMessage("");
  }

  function blockUser(target: string) {
    if (user === null) {
      return;
    }
    chatClient.blockUser(user, target);
    setBlockListRefresher(!blockListRefresher);
  }

  function unblockUser(target: string) {
    if (user === null) {
      return;
    }
    chatClient.unblockUser(user, target);
    setBlockListRefresher(!blockListRefresher);
  }

  return (
    <div className="chat-division">
      <h3>Chat</h3>
      <button
        style={{ width: "30%" }}
        onClick={() => chatClient.getNextMessages()}
      >
        More Messages
      </button>
      <div className="scrollable-text-view">{makeFormatedMessages()}</div>
      <div className="submission-div">
        <div style={{ width: "20%" }}>
          <label>
            action:
            <select value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="">none</option>
              <option value="@">@</option>
              <option value="DM">dm</option>
            </select>
          </label>
          <label>
            target:
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="all">all</option>
              {makeUserList()}
            </select>
          </label>
        </div>
        <textarea
          style={{ width: "60%" }}
          id="message"
          placeholder={"Enter message here"}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
          onKeyUp={(event) => {
            if (event.key === "Enter") {
              sendMessage();
            }
          }}
        />

        <button
          style={{ width: "15%" }}
          onClick={() => {
            sendMessage();
          }}
        >
          Send
        </button>
      </div>
      <div>
        <select
          value={selectedBlockedUser}
          onChange={(e) => setSelectedBlockedUser(e.target.value)}
        >
          <option value="">---block list---</option>
          {makeBlockList()}
        </select>
        <button
          onClick={() => {
            if (!selectedBlockedUser) {
              return;
            }
            unblockUser(selectedBlockedUser);
          }}
        >
          unblock
        </button>
      </div>
    </div>
  );
}

export default ChatComponent;
