import React, { useState, useEffect } from "react";
import axios from "axios";
import Web3 from "web3";

const SERVER_URL = "/api";

function App() {
    const [email, setEmail] = useState("");
    const [aadharID, setAadharID] = useState("");
    const [otp, setOtp] = useState("");
    const [fingerprintCredential, setFingerprintCredential] = useState(null);
    const [walletAddress, setWalletAddress] = useState("");

    // MetaMask Connection
    const connectMetaMask = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                setWalletAddress(accounts[0]);
                alert("MetaMask Connected!");
            } catch (error) {
                console.error("Error connecting MetaMask:", error);
                alert("Failed to connect MetaMask.");
            }
        } else {
            alert("MetaMask not detected. Please install MetaMask.");
        }
    };

    // Send OTP with Aadhar ID
    const sendOTP = async () => {
        try {
            await axios.post(`${SERVER_URL}/sendOTP`, { email, aadharID });
            alert("OTP sent successfully!");
        } catch (error) {
            console.error("Error sending OTP:", error);
            alert("Failed to send OTP.");
        }
    };

    // Verify OTP with Aadhar ID
    const verifyOTP = async () => {
        try {
            const response = await axios.post(`${SERVER_URL}/verifyOTP`, { email, otp, aadharID });
            if (response.data.verified) {
                alert("OTP and Aadhar Verified!");
            } else {
                alert("Invalid OTP or Aadhar ID!");
            }
        } catch (error) {
            console.error("Error verifying OTP:", error);
        }
    };

    // Register Fingerprint
    const registerFingerprint = async () => {
        try {
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge: new Uint8Array(32),
                    rp: { name: "E-Voting System" },
                    user: {
                        id: new Uint8Array(16),
                        name: email,
                        displayName: email,
                    },
                    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                    authenticatorSelection: { authenticatorAttachment: "platform" },
                    timeout: 60000,
                },
            });

            setFingerprintCredential(credential);
            alert("Fingerprint Registered!");
        } catch (error) {
            console.error("Fingerprint registration failed:", error);
            alert("Fingerprint registration failed.");
        }
    };

    // Authenticate with Fingerprint
    const authenticateFingerprint = async () => {
        try {
            if (!fingerprintCredential) {
                alert("No fingerprint registered. Please register first.");
                return;
            }

            const assertion = await navigator.credentials.get({
                publicKey: {
                    challenge: new Uint8Array(32),
                    timeout: 60000,
                },
            });

            alert("Fingerprint Authenticated!");
        } catch (error) {
            console.error("Fingerprint authentication failed:", error);
            alert("Fingerprint authentication failed.");
        }
    };

    return (
        <div>
            <h1>E-Voting System</h1>

            <h2>MetaMask Authentication</h2>
            <button onClick={connectMetaMask}>Connect MetaMask</button>
            {walletAddress && <p>Connected Wallet: {walletAddress}</p>}

            <h2>OTP & Aadhar Authentication</h2>
            <input type="email" placeholder="Enter Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="text" placeholder="Enter Aadhar ID" value={aadharID} onChange={(e) => setAadharID(e.target.value)} />
            <button onClick={sendOTP}>Send OTP</button>

            <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
            <button onClick={verifyOTP}>Verify OTP & Aadhar</button>

            <h2>Fingerprint Authentication</h2>
            <button onClick={registerFingerprint}>Register Fingerprint</button>
            <button onClick={authenticateFingerprint}>Authenticate Fingerprint</button>
        </div>
    );
}

export default App;
