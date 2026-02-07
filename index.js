import fetch from "node-fetch";
import { Client, GatewayIntentBits } from "discord.js";
import fs from "fs";

const TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const SOURCE_URL = "https://coinscrazy.com/dice-dreams-free-rolls/";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const postedFile = "posted.json";

function loadPosted() {
  if (!fs.existsSync(postedFile)) return [];
  return JSON.parse(fs.readFileSync(postedFile));
}

function savePosted(data) {
  fs.writeFileSync(postedFile, JSON.stringify(data));
}

async function getLinks() {
  const res = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  const html = await res.text();
  const matches = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)];
  return [...new Set(matches.map(m => m[1]).filter(l => l.includes("dice")))];
}

client.once("ready", async () => {
  console.log("Bot ready");

  const channel = await client.channels.fetch(CHANNEL_ID);
  const posted = loadPosted();
  const links = await getLinks();
  const fresh = links.filter(l => !posted.includes(l));

  if (fresh.length === 0) return;

  const pins = await channel.messages.fetchPinned();
  for (const msg of pins.values()) {
    if (msg.author.id === client.user.id) await msg.unpin();
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

client.login(TOKEN);
