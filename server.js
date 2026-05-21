require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());

// ADVANCE PRIVATE DATABASE (In-Memory Access Control)
let whitelistedUsers = {
        "RIHAN_MASTER_99": { name: "Mr. Rihan", role: "Owner", active: true },
            "BHABI_VIP_GOLD": { name: "Bhabi", role: "Special Guest", active: true },
                "LUFFY_BEST_FRIEND": { name: "Luffy", role: "Community Member", active: false }
};

// MASTER ADMIN PANEL UI
app.get('/master-panel', (req, res) => {
        let tableRows = '';
            for (let key in whitelistedUsers) {
                        let u = whitelistedUsers[key];
                                tableRows += `
                                            <tr style="border-bottom: 1px solid #333;">
                                                            <td style="padding:12px; color:#fff;"><b>${u.name}</b> <span style="color:#888; font-size:12px;">(${u.role})</span></td>
                                                                            <td style="padding:12px; color:${u.active ? '#00ff00' : '#ff3333'}; font-weight:bold;">
                                                                                                ${u.active ? '● AUTHORIZED' : '○ BLOCKED'}
                                                                                                                </td>
                                                                                                                                <td style="padding:12px;">
                                                                                                                                                    <button onclick="toggleUser('${key}')" style="background:#ffcc00; color:#000; border:none; padding:6px 12px; font-weight:bold; cursor:pointer; border-radius:4px;">
                                                                                                                                                                            Toggle Access
                                                                                                                                                                                                </button>
                                                                                                                                                                                                                </td>
                                                                                                                                                                                                                            </tr>`;
            }

                res.send(`
                        <!DOCTYPE html>
                                <html>
                                        <head>
                                                    <title>Rihan Master Control</title>
                                                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                                                        </head>
                                                                                <body style="background:#0b0b0b; color:#e0e0e0; font-family:sans-serif; margin:0; padding:20px;">
                                                                                            <div style="max-width:600px; margin:0 auto; background:#141414; padding:20px; border-radius:8px; border:1px solid #ffcc00; box-shadow: 0 0 15px rgba(255,204,0,0.2);">
                                                                                                            <h2 style="color:#ffcc00; margin-top:0; border-bottom:2px solid #222; padding-bottom:10px;">👑 Mr. Rihan's Access Command Center</h2>
                                                                                                                            <p style="color:#aaa; font-size:14px;">Manage community whitelist and unlimited access limits instantly.</p>
                                                                                                                                            <table style="width:100%; border-collapse:collapse; margin-top:20px;">
                                                                                                                                                                <tr style="background:#1c1c1c; color:#ffcc00; text-align:left;">
                                                                                                                                                                                        <th style="padding:12px;">User</th>
                                                                                                                                                                                                                <th style="padding:12px;">Status</th>
                                                                                                                                                                                                                                        <th style="padding:12px;">Action</th>
                                                                                                                                                                                                                                                            </tr>
                                                                                                                                                                                                                                                                                ${tableRows}
                                                                                                                                                                                                                                                                                                </table>
                                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                                        <script>
                                                                                                                                                                                                                                                                                                                                        function toggleUser(key) {
                                                                                                                                                                                                                                                                                                                                                                fetch('/api/admin/toggle', {
                                                                                                                                                                                                                                                                                                                                                                                            method: 'POST',
                                                                                                                                                                                                                                                                                                                                                                                                                    headers: {'Content-Type': 'application/json'},
                                                                                                                                                                                                                                                                                                                                                                                                                                            body: JSON.stringify({ secretKey: key })
                                                                                                                                                                                                                                                                                                                                                                }).then(() => location.reload());
                                                                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                                                                                    </script>
                                                                                                                                                                                                                                                                                                                                                            </body>
                                                                                                                                                                                                                                                                                                                                                                    </html>
                                                                                                                                                                                                                                                                                                                                                                        `);
});

// Admin Toggle API Backend
app.post('/api/admin/toggle', (req, res) => {
        const { secretKey } = req.body;
            if (whitelistedUsers[secretKey]) {
                        whitelistedUsers[secretKey].active = !whitelistedUsers[secretKey].active;
                                res.json({ success: true });
            } else {
                        res.status(404).json({ error: "User not found" });
            }
});

// Companion Chat Endpoint
app.post('/api/companion/chat', async (req, res) => {
        const secretKey = req.body.secretKey || req.body.key;
        const incomingMessage = (req.body.message || '').trim();

        if (!secretKey || !whitelistedUsers[secretKey] || !whitelistedUsers[secretKey].active) {
                return res.status(403).json({ success: false, error: 'Forbidden: invalid or inactive access key.' });
        }

        const user = whitelistedUsers[secretKey];
        const apiKey = process.env.GEMINI_API_KEY;
        let dynamicReply = '';

        const systemInstruction = `You are SOPHIA, an elite, warm, and highly supportive AI companion for Mr. Rihan and his wife (Bhabi). Keep answers engaging, brief, friendly, and tailored perfectly to be spoken aloud. If the speaker is Bhabi, address her with deep respect as Bhabi and assist her playfully since Mr. Rihan is busy playing Roblox.`;
        const promptText = incomingMessage || `Hello ${user.name}, how can I assist you today?`;

        if (apiKey) {
                try {
                        const geminiResponse = await fetch('https://gemini.googleapis.com/v1/models/gemini-1.5:generate', {
                                method: 'POST',
                                headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${apiKey}`
                                },
                                body: JSON.stringify({
                                        model: 'gemini-1.5',
                                        prompt: {
                                                messages: [
                                                        { role: 'system', content: [{ type: 'text', text: systemInstruction }] },
                                                        { role: 'user', content: [{ type: 'text', text: promptText }] }
                                                ]
                                        },
                                        temperature: 0.7,
                                        maxOutputTokens: 512
                                })
                        });

                        const data = await geminiResponse.json();
                        const candidate = data?.candidates?.[0] || data?.response?.candidates?.[0] || data?.response?.output?.[0] || null;
                        const contentBlock = candidate?.content?.[0] || candidate || {};
                        dynamicReply = contentBlock?.text || contentBlock?.span || candidate?.text || '';

                        if (!dynamicReply) {
                                throw new Error('Empty Gemini response');
                        }
                } catch (error) {
                        console.error('Gemini API error:', error?.message || error);
                        dynamicReply = '';
                }
        }

        if (!dynamicReply) {
                if (secretKey === 'BHABI_VIP_GOLD') {
                        dynamicReply = `Ji bhabi, maine suna aapne kya kaha. Rihan bhai toh Roblox mein busy hain, aap batao main aapki kya help karoon?`;
                } else if (secretKey === 'RIHAN_MASTER_99') {
                        dynamicReply = `Welcome back, ${user.name}. Your elite companion is online and ready to execute your Roblox plans with precision.`;
                } else {
                        dynamicReply = `Hello ${user.name}, your message was received. How can I assist you today?`;
                }
        }

        return res.json({ success: true, speaker: user.name, messageReply: dynamicReply });
});

// Default Base Route
app.get('/', (req, res) => {
        res.send("<h2 style='font-family:sans-serif; text-align:center; margin-top:50px;'>🚀 Rihan's Master AI Companion Platform Is Successfully Initialized!</h2>");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
