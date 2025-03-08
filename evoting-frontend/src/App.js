import React, { useState } from "react";
import axios from "axios";

const SERVER_URL = "/api";

function App() {
    const [email, setEmail] = useState("");
    const [aadharID, setAadharID] = useState("");
    const [otp, setOtp] = useState("");

    // Send OTP with Aadhar ID
    const sendOTP = async () => {
        try {
            await axios.post(`${SERVER_URL}/sendOTP`, { email, aadharID });
            alert("OTP sent successfully!");
        } catch (error) {
            console.error("Error sending OTP:", error);
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

    return (
        <div>
            <h1>E-Voting System</h1>

            <h2>OTP & Aadhar Authentication</h2>
            <input type="email" placeholder="Enter Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="text" placeholder="Enter Aadhar ID" value={aadharID} onChange={(e) => setAadharID(e.target.value)} />
            <button onClick={sendOTP}>Send OTP</button>

            <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
            <button onClick={verifyOTP}>Verify OTP & Aadhar</button>
        </div>
    );
}

export default App;
