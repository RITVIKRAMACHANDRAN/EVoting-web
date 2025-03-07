import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";

const SERVER_URL = "/api"; // Replace with your deployed backend URL

function App() {
    // State Variables
    const [account, setAccount] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [newCandidate, setNewCandidate] = useState("");
    const [voterAddress, setVoterAddress] = useState("");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    // eslint-disable-next-line no-unused-vars
const [fingerprintData, setFingerprintData] = useState(null);


    // Connect MetaMask
    const connectMetaMask = async () => {
        if (window.ethereum) {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                setAccount(await signer.getAddress());
            } catch (error) {
                console.error("MetaMask connection failed:", error);
            }
        } else {
            alert("MetaMask not detected!");
        }
    };

    // Fetch Candidates
    const fetchCandidates = async () => {
        try {
            const response = await axios.get(`${SERVER_URL}/candidates`);
            setCandidates(response.data.candidates);
        } catch (error) {
            console.error("Error fetching candidates:", error);
        }
    };

    useEffect(() => {
        fetchCandidates();
    }, []);

    // Add Candidate
    const addCandidate = async () => {
        try {
            await axios.post(`${SERVER_URL}/addCandidate`, { name: newCandidate });
            alert("Candidate added successfully!");
            fetchCandidates();
        } catch (error) {
            console.error("Error adding candidate:", error);
        }
    };

    // Add Voter
    const addVoter = async () => {
        try {
            await axios.post(`${SERVER_URL}/addVoter`, { address: voterAddress });
            alert("Voter added successfully!");
        } catch (error) {
            console.error("Error adding voter:", error);
        }
    };

    // Cast Vote
    const vote = async (candidateId) => {
        try {
            await axios.post(`${SERVER_URL}/vote`, { candidateId, voterAddress: account });
            alert("Vote cast successfully!");
        } catch (error) {
            console.error("Error casting vote:", error);
        }
    };

    // Send OTP
    const sendOTP = async () => {
        try {
            await axios.post(`${SERVER_URL}/sendOTP`, { email });
            alert("OTP sent successfully!");
        } catch (error) {
            console.error("Error sending OTP:", error);
        }
    };

    // Verify OTP
    const verifyOTP = async () => {
        try {
            const response = await axios.post(`${SERVER_URL}/verifyOTP`, { email, otp });
            if (response.data.verified) {
                alert("OTP Verified!");
            } else {
                alert("Invalid OTP!");
            }
        } catch (error) {
            console.error("Error verifying OTP:", error);
        }
    };

    // Register Fingerprint
    const registerFingerprint = async () => {
        try {
            const fingerprintHash = "sample_fingerprint_hash"; // Replace with actual WebAuthn fingerprint data
            await axios.post(`${SERVER_URL}/registerFingerprint`, { voterAddress: account, fingerprintHash });
            alert("Fingerprint registered successfully!");
        } catch (error) {
            console.error("Error registering fingerprint:", error);
        }
    };

    // Authenticate Fingerprint
    const authenticateFingerprint = async () => {
        try {
            const fingerprintHash = "sample_fingerprint_hash"; // Replace with actual WebAuthn fingerprint data
            const response = await axios.post(`${SERVER_URL}/authenticateFingerprint`, { voterAddress: account, fingerprintHash });
            if (response.data.authenticated) {
                alert("Fingerprint authenticated successfully!");
            } else {
                alert("Fingerprint authentication failed!");
            }
        } catch (error) {
            console.error("Error authenticating fingerprint:", error);
        }
    };

    return (
        <div>
            <h1>E-Voting System</h1>
            <button onClick={connectMetaMask}>
                {account ? `Connected: ${account}` : "Connect MetaMask"}
            </button>

            <h2>Candidates</h2>
            <ul>
                {candidates.map((candidate, index) => (
                    <li key={index}>
                        {candidate.name} - {candidate.votes} votes
                        <button onClick={() => vote(candidate.id)}>Vote</button>
                    </li>
                ))}
            </ul>

            <h2>Admin Panel</h2>
            <div>
                <input type="text" placeholder="Candidate Name" value={newCandidate} onChange={(e) => setNewCandidate(e.target.value)} />
                <button onClick={addCandidate}>Add Candidate</button>
            </div>

            <div>
                <input type="text" placeholder="Voter Address" value={voterAddress} onChange={(e) => setVoterAddress(e.target.value)} />
                <button onClick={addVoter}>Add Voter</button>
            </div>

            <h2>OTP Authentication</h2>
            <div>
                <input type="email" placeholder="Enter Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <button onClick={sendOTP}>Send OTP</button>
            </div>
            <div>
                <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
                <button onClick={verifyOTP}>Verify OTP</button>
            </div>

            <h2>Fingerprint Authentication</h2>
            <button onClick={registerFingerprint}>Register Fingerprint</button>
            <button onClick={authenticateFingerprint}>Authenticate Fingerprint</button>
        </div>
    );
}

export default App;
