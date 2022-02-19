import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/WavePortal.json";
import {Button, Card, CardContent, LinearProgress, Link, Stack, TextField, Typography} from "@mui/material";

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [mining, setMining] = useState(false);
  const [totalWaves, setTotalWaves] = useState(0);
  const [allWaves, setAllWaves] = useState([]);
  const [msg, setMsg] = useState("");
  const [mChar, setMChar] = useState(0);
  
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
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
      setCurrentAccount(accounts[0]);

      await getTotalWaves();
      await getAllWaves();
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

        await getTotalWaves();
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch(err) {
      console.log(err);
    }
  }

  const getTotalWaves = async () => setTotalWaves((await wavePortalContract.getTotalWaves()).toNumber());

  const getAllWaves = async () => {
    const waves = await wavePortalContract.getAllWaves();
    /*
     * We only need address, timestamp, and message in our UI so let's
     * pick those out
     */
    let wavesCleaned = [];
    waves.forEach(wave => {
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
    setMChar(e.target.value.toString().length);
  }

  return (
      <Stack
          spacing={4}
          padding={10}
      >
        <Typography align='center' variant='h1'>
          👋 Hey there, Edu here!
        </Typography>
        <Typography align='center' variant='body1'>
          I'm a Software Engineer. Wave at me in the Rinkeby Network
        </Typography>
        {!currentAccount && <Button variant='outlined' onClick={connectWallet}>Connect your wallet</Button>}
        {(currentAccount && !mining) && (
            <>
              <Typography variant='h5'>Total waves {totalWaves}</Typography>
              <TextField
                  id='outlined-multiline-static'
                  label='Message'
                  variant='outlined'
                  rows={4}
                  onChange={handleChange}
                  inputProps={{ maxLength: 140 }}
                  multiline
                  helperText={`Characters left ${mChar}/140`}
              />
              <Button variant='outlined' onClick={wave}>Wave at Me!</Button>
            </>
        )}

        {mining && <LinearProgress />}

        {allWaves.map((wave, index) => {
          return (
              <Card key={index} variant='outlined'>
                <CardContent>
                  <Link
                      href={`https://rinkeby.etherscan.io/address/${wave.address}`}
                      variant='inherit'
                      target='_blank'
                  >
                    {wave.address}
                  </Link>
                  <Typography>{wave.timestamp.toString()}</Typography>
                  <Typography>{wave.message}</Typography>
                </CardContent>
              </Card>
          )
        })}
      </Stack>
  );

  // return (
  //   <div className="mainContainer">
  //
  //     <div className="dataContainer">
  //       <Typography variant='h2'>
  //         👋 Hey there, Edu here!
  //       </Typography>
  //
  //       <div className="bio">
  //       I am a Software Engineer. Jack of all trades, master of none
  //       </div>
  //
  //       {
  //         currentAccount ? <p className="bio"> {
  //           mining ? "Mining..." : `Total waves ${totalWaves}`} </p> : <></>
  //       }
  //
  //       <input type="text" value={msg} onChange={(e) => handleChange(e)}/>
  //
  //       <button className="waveButton" onClick={wave}>
  //         Wave at Me
  //       </button>
  //       {!currentAccount && (
  //         <button className="waveButton" onClick={connectWallet}>
  //           Connect Wallet
  //         </button>
  //       )}
  //
  //       {allWaves.map((wave, index) => {
  //         return (
  //           <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
  //             <div>Address: {wave.address}</div>
  //             <div>Time: {wave.timestamp.toString()}</div>
  //             <div>Message: {wave.message}</div>
  //           </div>)
  //       })}
  //     </div>
  //   </div>
  // );
}
