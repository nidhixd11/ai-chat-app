const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

let isMongoConnected = false;
let memoryChats = [];

const chatSchema = new mongoose.Schema({
  message: String,
  reply: String,
  source: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Chat = mongoose.model("Chat", chatSchema);

async function connectMongo() {
  if (!process.env.MONGO_URI) {
    console.log("MongoDB URI not found. Using in-memory storage.");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    isMongoConnected = true;
    console.log("MongoDB connected");
  } catch (error) {
    console.log("MongoDB connection failed. Using in-memory storage.");
  }
}

async function getOpenAIReply(message) {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant. Give clear and simple answers.",
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    const data = await response.json();

    if (data?.choices?.[0]?.message?.content) {
      return {
        reply: data.choices[0].message.content,
        source: "OpenAI",
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

async function getHuggingFaceReply(message) {
  if (!process.env.HF_API_KEY) return null;

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/google/flan-t5-base",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: message,
        }),
      }
    );

    const data = await response.json();

    if (Array.isArray(data) && data[0]?.generated_text) {
      return {
        reply: data[0].generated_text,
        source: "Hugging Face",
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

async function saveChat(message, reply, source) {
  if (isMongoConnected) {
    await Chat.create({ message, reply, source });
  } else {
    memoryChats.push({
      message,
      reply,
      source,
      createdAt: new Date(),
    });
  }
}

app.get("/", (req, res) => {
  res.send("AI Chat App Backend is running");
});

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({
      error: "Message is required",
    });
  }

  let aiResponse = await getOpenAIReply(message);

  if (!aiResponse) {
    aiResponse = await getHuggingFaceReply(message);
  }

  if (!aiResponse) {
    aiResponse = {
      reply:
        "This is a local fallback response. OpenAI and Hugging Face API support is added, but valid API keys are required for live AI responses.",
      source: "Local Fallback",
    };
  }

  await saveChat(message, aiResponse.reply, aiResponse.source);

  res.json({
    reply: aiResponse.reply,
    source: aiResponse.source,
  });
});

app.get("/api/history", async (req, res) => {
  if (isMongoConnected) {
    const chats = await Chat.find().sort({ createdAt: -1 }).limit(20);
    return res.json(chats);
  }

  res.json(memoryChats.slice(-20).reverse());
});

connectMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
});