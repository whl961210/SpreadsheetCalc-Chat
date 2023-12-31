import React, { useState, useEffect } from 'react';
import './LoginPageComponent.css';

/**
 * Login PageComponent is the component that will be used to display the login page
 * If the user is logged in, then this component will display the list of documents
 * that the user has access to.  Each document will have a button that will allow the
 * user to edit the document. when the user clicks on the button, the user will be
 * taken to the document page.
 * @returns 
 */

import SpreadSheetClient from '../Engine/SpreadSheetClient';
import { spread } from 'axios';

interface LoginPageProps {
  spreadSheetClient: SpreadSheetClient;
}

function LoginPageComponent({ spreadSheetClient }: LoginPageProps): JSX.Element {
  const [userName, setUserName] = useState(window.sessionStorage.getItem('userName') || "");
  const [documents, setDocuments] = useState<string[]>([]);
  const [userNameInput, setUserNameInput] = useState(window.sessionStorage.getItem('userName') || "");

  // SpreadSheetClient is fetching the documents from the server so we should
  // check every 1/20 of a second to see if the documents have been fetched
  useEffect(() => {
    const interval = setInterval(() => {
      const sheets = spreadSheetClient.getSheets();
      if (sheets.length > 0) {
        setDocuments(sheets);
      }
    }, 50);
    return () => clearInterval(interval);
  });

  function getUserLogin() {
    return <div className='login-input-button'>
      <input
        type="text"
        placeholder="User name"
        value={userNameInput}
        onChange={(e) => setUserNameInput(e.target.value)}
        />
        <button onClick={()=>{
          if (!checkUserName()) {
            return;
          }
          window.sessionStorage.setItem('userName', userNameInput);
          setUserName(userNameInput);
          spreadSheetClient.userName = userNameInput;
        }}>
          Login
        </button>
    </div>

  }

  function checkUserName(): boolean {
    if (userNameInput === "") {
      alert("Please enter a user name");
      return false;
    } else if (userNameInput.toLowerCase()==="all") {
      alert("'all' is not a valid user name");
      return false;
    }
    return true;
  }

  function loadDocument(documentName: string) {
    // set the document name
    spreadSheetClient.documentName = documentName;
    // reload the page

    // the href needs to be updated.   Remove /documnents from the end of the URL
    const href = window.location.href;
    const index = href.lastIndexOf('/');
    let newURL = href.substring(0, index);
    newURL = newURL + "/" + documentName
    window.history.pushState({}, '', newURL);
    window.location.reload();

  }


  function logout() {
    // clear the user name
    window.sessionStorage.setItem('userName', "");
    // reload the page
    window.location.reload();
  }


  function buildFileSelector() {

    const sheets: string[] = spreadSheetClient.getSheets();
    // make a table with the list of sheets and a button beside each one to edit the sheet
    return <>
      <h2>Welcome! {userName}!</h2>
      <button onClick={() => logout()}>Logout</button>
      <table>
        <thead>
          <tr className="selector-title">
            <th>Choose a</th>
            <th>file</th>

          </tr>
        </thead>
        <tbody>
          {sheets.map((sheet) => {
            return <tr className="selector-item">
              <td >{sheet}</td>
              <td><button onClick={() => loadDocument(sheet)}>
                Edit
              </button></td>
            </tr>
          })}
        </tbody>
      </table>
    </>
  }

  function getLoginPanel() {
    return <>
        <h1>Login</h1>
      {getUserLogin()}
    </>
  }

  function loginPage() {

    if (userName === "") {
      return <>
        {getLoginPanel()}
      </>
    } else {
      return <>
        {buildFileSelector()}
      </>
    }
  }



  return (
    <div className="LoginPageComponent">
      {loginPage()}
    </div>
  );
}

export default LoginPageComponent;