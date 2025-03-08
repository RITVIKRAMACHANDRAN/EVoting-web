const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Contract, Wallet, JsonRpcProvider } = require("ethers");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// ✅ Fix: Initialize Ethers Provider for v6
const provider = new JsonRpcProvider(process.env.RPC_URL);
const wallet = new Wallet(process.env.PRIVATE_KEY, provider);

// ✅ Load Contract ABI and Address
const contractABI = JSON.parse(fs.readFileSync(path.join(__dirname, "abis/EVoting.json"), "utf-8"));
const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new Contract(contractAddress, contractABI, wallet);

// ✅ Secure Storage for Aadhaar, OTPs, and Fingerprints
const aadhaarStorage = {};  // Stores hashed Aadhaar IDs
const otpStorage = {};      // Stores OTPs temporarily
const fingerprintStorage = {}; // Stores fingerprints

// ✅ Auto-cleanup for OTPs
setInterval(() => {
    const now = Date.now();
    for (const key in otpStorage) {
        if (otpStorage[key].expires < now) {
            delete otpStorage[key]; // Remove expired OTPs
        }
    }
}, 5 * 60 * 1000); // Every 5 minutes

// ✅ Secure OTP Generation
function generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
}

// ✅ Send OTP via Email
async function sendOTP(email, otp) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your Voting OTP",
        text: `Your OTP for verification is: ${otp}. It expires in 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);
}

// ✅ Route: Register Voter with Aadhaar
app.post("/registerVoter", async (req, res) => {
    try {
        const { voterAddress, aadhaarId, email } = req.body;

        if (!voterAddress || !aadhaarId || !email) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Hash Aadhaar ID for security
        const hashedAadhaar = crypto.createHash("sha256").update(aadhaarId).digest("hex");

        if (aadhaarStorage[hashedAadhaar]) {
            return res.status(400).json({ error: "Aadhaar ID already registered" });
        }

        aadhaarStorage[hashedAadhaar] = voterAddress;

        // Generate and send OTP
        const otp = generateOTP();
        otpStorage[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };
        await sendOTP(email, otp);

        res.json({ message: "OTP sent for verification" });
    } catch (error) {
        console.error("Error registering voter:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Route: Verify OTP
app.post("/verifyOTP", async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!otpStorage[email] || otpStorage[email].otp !== otp) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        delete otpStorage[email]; // ✅ OTP auto-deletion after verification
        res.json({ message: "OTP verified successfully" });
    } catch (error) {
        console.error("OTP verification error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Route: Register Fingerprint
app.post("/registerFingerprint", async (req, res) => {
    try {
        const { voterAddress, fingerprintData } = req.body;

        if (!voterAddress || !fingerprintData) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Store fingerprint securely
        fingerprintStorage[voterAddress] = fingerprintData;
        res.json({ message: "Fingerprint registered successfully" });
    } catch (error) {
        console.error("Error registering fingerprint:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Route: Authenticate Fingerprint
app.post("/authenticateFingerprint", async (req, res) => {
    try {
        const { voterAddress, fingerprintData } = req.body;

        if (!voterAddress || !fingerprintData) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (fingerprintStorage[voterAddress] !== fingerprintData) {
            return res.status(401).json({ error: "Fingerprint authentication failed" });
        }

        res.json({ message: "Fingerprint authenticated successfully" });
    } catch (error) {
        console.error("Fingerprint authentication error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Route: Add Candidate
app.post("/addCandidate", async (req, res) => {
    try {
        const { name, party } = req.body;
        const tx = await contract.addCandidate(name, party);
        await tx.wait();
        res.json({ message: "Candidate added successfully" });
    } catch (error) {
        console.error("Error adding candidate:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Route: Get Candidates
app.get("/candidates", async (req, res) => {
    try {
        const candidates = await contract.getCandidate();
        res.json(candidates);
    } catch (error) {
        console.error("Error fetching candidates:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Route: Vote for Candidate
app.post("/vote", async (req, res) => {
    try {
        const { voterAddress, candidateId } = req.body;
        const tx = await contract.vote(candidateId, { from: voterAddress });
        await tx.wait();
        res.json({ message: "Vote cast successfully" });
    } catch (error) {
        console.error("Voting error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Route: Get Results
app.get("/results", async (req, res) => {
    try {
        const results = await contract.getResults();
        res.json(results);
    } catch (error) {
        console.error("Error fetching results:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Start Server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
