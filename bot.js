const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const fs = require("fs");

// ================= CONFIG =================
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

// Dynmap URL
const DYNMAP_URL = process.env.DYNMAP_URL;

// ================= WHITELIST =================
const WHITELIST_FILE = "./whitelist.json";

function loadWhitelist() {
    try {
        return JSON.parse(fs.readFileSync(WHITELIST_FILE, "utf8"));
    } catch (err) {
        console.log("⚠️ Nie mogę wczytać whitelist.json");
        return [];
    }
}

let WHITELIST = loadWhitelist();

// ================= AREA =================
const AREA = {
    x1: -12293,
    x2: -11928,
    z1: -5637,
    z2: -5400
};

// ================= CLIENT =================
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// gracze w strefie
let insidePlayers = new Map();

// ================= FUNCTIONS =================
function isInside(x, z) {
    return (
        x >= AREA.x1 &&
        x <= AREA.x2 &&
        z >= AREA.z1 &&
        z <= AREA.z2
    );
}

async function sendDiscord(msg) {
    try {
        const channel = await client.channels.fetch(CHANNEL_ID);
        channel.send(msg);
    } catch (err) {
        console.log("❌ Discord error:", err.message);
    }
}

async function checkDynmap() {
    try {
        const res = await axios.get(https://earthsmp.craftcube.pl/up/world/world/1781279040127);
        const players = res.data.players || [];

        const currentPlayers = new Map();

        console.log(`[${new Date().toISOString()}] Sprawdzam Dynmap...`);

        for (const p of players) {
            const name = p.name;
            const x = p.x;
            const z = p.z;

            // WHITELIST CHECK
            if (WHITELIST.includes(name)) {
                continue;
            }

            if (isInside(x, z)) {
                currentPlayers.set(name, { x, z });

                if (!insidePlayers.has(name)) {
                    console.log(`🚨 ${name} wszedł (${x}, ${z})`);
                    sendDiscord(`🚨 **${name}** wszedł na zakazany teren! (X:${x}, Z:${z})`);
                }
            }
        }

        // WYJŚCIE
        for (const [name] of insidePlayers) {
            if (!currentPlayers.has(name)) {
                console.log(`✅ ${name} opuścił teren`);
                sendDiscord(`✅ **${name}** opuścił zakazany teren.`);
            }
        }

        insidePlayers = currentPlayers;

    } catch (err) {
        console.log("❌ Dynmap error:", err.message);
    }
}

// ================= START =================
client.once("ready", () => {
    console.log(`🤖 Bot działa jako ${client.user.tag}`);

    setInterval(checkDynmap, 5000);
});

client.login(DISCORD_TOKEN);
