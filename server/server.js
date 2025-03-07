const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { ethers } = require("ethers");
const { JsonRpcProvider } = require("ethers");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Load Contract ABI
const contractABI = JSON.parse(
  fs.readFileSync(path.join(__dirname, "abis", "EVoting.json"), "utf-8")
);

// Ethers v6 - Correct provider initialization

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
const contract = new Contract(process.env.CONTRACT_ADDRESS, contractABI.abi, wallet);

/// ======================================================
///  🔹 CANDIDATE MANAGEMENT ROUTES
/// ======================================================

// ✅ Get All Candidates
app.get("/api/candidates", async (req, res) => {
  try {
    const candidates = await contract.getCandidate();
    res.json({ candidates });
  } catch (error) {
    console.error("Error fetching candidates:", error);
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
});

// ✅ Add Candidate (Admin Only)
app.post("/api/addCandidate", async (req, res) => {
  try {
    const { name } = req.body;
    const tx = await contract.addCandidate(name);
    await tx.wait();
    res.json({ message: "Candidate added successfully!" });
  } catch (error) {
    console.error("Error adding candidate:", error);
    res.status(500).json({ error: "Failed to add candidate" });
  }
});


/// ======================================================
///  🔹 VOTER MANAGEMENT ROUTES
/// ======================================================

// ✅ Register Voter (Admin Only)
app.post("/api/registerVoter", async (req, res) => {
  try {
    const { voterAddress } = req.body;
    const tx = await contract.addVoter(voterAddress);
    await tx.wait();
    res.json({ message: "Voter registered successfully!" });
  } catch (error) {
    console.error("Error registering voter:", error);
    res.status(500).json({ error: "Failed to register voter" });
  }
});

// ✅ Get All Voters (Admin Only)
app.get("/api/voters", async (req, res) => {
  try {
    const voters = await contract.getVoters();
    res.json({ voters });
  } catch (error) {
    console.error("Error fetching voters:", error);
    res.status(500).json({ error: "Failed to fetch voters" });
  }
});


/// ======================================================
///  🔹 AUTHENTICATION ROUTES
/// ======================================================

// ✅ 1️⃣ Email OTP Authentication
const otpStorage = {}; // Store OTP temporarily

app.post("/api/sendOTP", async (req, res) => {
  try {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
    otpStorage[email] = otp; // Store OTP for verification

    // Send OTP via Email
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Voting OTP",
      text: `Your OTP for e-voting is: ${otp}`,
    });

    res.json({ message: "OTP sent successfully!" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

app.post("/api/verifyOTP", (req, res) => {
  try {
    const { email, otp } = req.body;
    if (otpStorage[email] && otpStorage[email] === parseInt(otp)) {
      delete otpStorage[email]; // OTP used, remove from storage
      res.json({ message: "OTP verified successfully!" });
    } else {
      res.status(400).json({ error: "Invalid OTP" });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});


/// ✅ 2️⃣ Fingerprint Authentication (WebAuthn API)
const fingerprintStorage = {}; // Store registered fingerprints

app.post("/api/registerFingerprint", (req, res) => {
  try {
    const { userId, fingerprintData } = req.body;
    fingerprintStorage[userId] = fingerprintData;
    res.json({ message: "Fingerprint registered successfully!" });
  } catch (error) {
    console.error("Error registering fingerprint:", error);
    res.status(500).json({ error: "Failed to register fingerprint" });
  }
});

app.post("/api/verifyFingerprint", (req, res) => {
  try {
    const { userId, fingerprintData } = req.body;
    if (fingerprintStorage[userId] === fingerprintData) {
      res.json({ message: "Fingerprint verified successfully!" });
    } else {
      res.status(400).json({ error: "Fingerprint does not match" });
    }
  } catch (error) {
    console.error("Error verifying fingerprint:", error);
    res.status(500).json({ error: "Failed to verify fingerprint" });
  }
});


/// ======================================================
///  🔹 VOTING FUNCTIONALITY
/// ======================================================

// ✅ Cast Vote
app.post("/api/vote", async (req, res) => {
  try {
    const { voterAddress, candidateId } = req.body;
    const tx = await contract.vote(voterAddress, candidateId);
    await tx.wait();
    res.json({ message: "Vote cast successfully!" });
  } catch (error) {
    console.error("Error casting vote:", error);
    res.status(500).json({ error: "Failed to cast vote" });
  }
});

// ✅ Get Voting Results
app
