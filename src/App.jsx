import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/WavePortal.json";

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [mining, setMining] = useState(false);
  const [totalWaves, setTotalWaves] = useState(0);
  const [allWaves, setAllWaves] = useState([]);
  const [msg, setMsg] = useState("");
  
  const contractAddress = "0x9b764018b5e6e46971e979998355161E2B94415f";
  const contractABI = abi.abi;

  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
  
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if(!ethereum) {
        console.log("Make sure you have metamask!");
      } else {
        console.log("We have the ethereum object", ethereum);
      }
  
      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found")
      }
    } catch(error) {
      console.log(error);
    }
    
  }

  const connectWallet = async () => {
    try {
      const {ethereum} = window;

      if(!ethereum) {
        alert("Get Metamask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);

      setTotalWaves(await wavePortalContract.getTotalWaves());
      
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);
  
  const wave = async () => {
    try {
      const { ethereum } = window;

      if(ethereum) {
        /* READ FROM BLOCKCHAIN */
      
        let count = await wavePortalContract.getTotalWaves();
        
        /* READ FROM BLOCKCHAIN */

        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await wavePortalContract.wave(msg, { gasLimit: 300000 });
        setMining(true);
        setMsg("");
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        setMining(false);
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        setTotalWaves(count);
        /*
        * Execute the actual wave from your smart contract
        */

        console.log("Retrieved total wave count...", count.toNumber());
        getAllWaves();
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch(err) {
      console.log(err);
    }
  }

  const getAllWaves = async () => {
    const waves = await wavePortalContract.getAllWaves();

    /*
     * We only need address, timestamp, and message in our UI so let's
     * pick those out
     */
    let wavesCleaned = [];
    waves.forEach(wave => {
      console.log(wave);
      wavesCleaned.push({
        address: wave.waver,
        timestamp: new Date(wave.timestamp * 1000),
        message: wave.message
      });
    });

    setAllWaves(wavesCleaned);
  }

  useEffect(() => {
    let wavePortalContract;
  
    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };
    
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
  
      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }
  
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);
  
  const handleChange = (e) => {
    setMsg(e.target.value);
  }
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        👋 Hey there, Edu here!
        </div>

        <div className="bio">
        I am a Software Engingeer. Jack of all trades, master of none
        </div>

        {
          currentAccount ? <p className="bio"> {
            mining ? "Mining..." : `Total waves ${totalWaves}`} </p> : <></>
        }

        <input type="text" value={msg} onChange={(e) => handleChange(e)}/>

        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
}
