const { Client, GatewayIntentBits } = require("discord.js");
const fetch = require("node-fetch");
const fs = require("fs");

// ENV VARIABLES
const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const SOURCE_URL = "https://coinscrazy.com/dice-dreams-free-rolls/";

// DISCORD CLIENT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// FILE STORAGE
const postedFile = "posted.json";

function loadPosted() {
  if (!fs.existsSync(postedFile)) return [];
  return JSON.parse(fs.readFileSync(postedFile, "utf8"));
}

function savePosted(data) {
  fs.writeFileSync(postedFile, JSON.stringify(data, null, 2));
}

// SCRAPER
async function getLinks() {
  const res = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  const html = await res.text();
  const matches = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)];

  return [...new Set(
    matches
      .map(m => m[1])
      .filter(l => l.toLowerCase().includes("dice"))
  )];
}

// BOT READY
client.once("ready", async () => {
  console.log("Bot ready");

  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel) {
    console.error("Channel not found");
    return;
  }

  const posted = loadPosted();
  const links = await getLinks();
  const fresh = links.filter(l => !posted.includes(l));

  if (fresh.length === 0) {
    console.log("No new links");
    return;
  }

  // UNPIN OLD BOT PINS
  const pins = await channel.messages.fetchPinned();
  for (const msg of pins.values()) {
    if (msg.author.id === client.user.id) {
      await msg.unpin();
    }
  }

  const message =
`📌 🎲 Dice Dreams – Free Rolls (Auto)

${fresh.map(l => `🔗 ${l}`).join("\n")}

📅 Updated Today
⚠️ Links may expire`;

  const sent = await channel.send(message);
  await sent.pin();

  savePosted([...posted, ...fresh]);
});

// LOGIN
client.login(TOKEN);
