const { Client, GatewayIntentBits, SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const fetch = require('node-fetch');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// === Register Slash Commands ===
const commands = [
  new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('Schedule a shift or training session')
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('Shift or Training')
        .setRequired(true)
        .addChoices(
          { name: 'Shift', value: 'Shift' },
          { name: 'Training', value: 'Training Session' }
        ))
    .addStringOption(opt =>
      opt.setName('time')
        .setDescription('Time of the session')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('host')
        .setDescription('Host Roblox username')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('cohost')
        .setDescription('Optional Co-Host Roblox username')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('end')
    .setDescription('End your scheduled session'),

  new SlashCommandBuilder()
    .setName('edit')
    .setDescription('Edit your scheduled session')
    .addStringOption(opt =>
      opt.setName('time')
        .setDescription('New time (optional)')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('cohost')
        .setDescription('New Co-Host (optional)')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('cancel')
    .setDescription('Cancel your scheduled session')
].map(c => c.toJSON());

// Deploy commands globally
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    console.log('✅ Slash commands registered');
  } catch (err) {
    console.error(err);
  }
})();

// === Trello Helpers ===
async function createTrelloCard(title, description) {
  const url = `https://api.trello.com/1/cards?idList=${process.env.TRELLO_LIST_ID}&key=${process.env.TRELLO_KEY}&token=${process.env.TRELLO_TOKEN}`;
  const body = new URLSearchParams({ name: title, desc: description });
  const res = await fetch(url, { method: 'POST', body });
  return res.json();
}

client.on('ready', () => console.log(`🤖 Logged in as ${client.user.tag}`));

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'schedule') {
    const type = interaction.options.getString('type');
    const time = interaction.options.getString('time');
    const host = interaction.options.getString('host');
    const cohost = interaction.options.getString('cohost') || 'None';

    const title = `${type}`;
    const description = `Host: ${host}\nCo-Host: ${cohost}\nTime: ${time}`;

    const card = await createTrelloCard(title, description);
    await interaction.reply(`✅ Scheduled **${type}** at **${time}**\n🔗 Trello card: ${card.shortUrl}`);
  }

  if (interaction.commandName === 'end') {
    await interaction.reply("🔚 (Placeholder) This would mark your Trello card as ended.");
  }

  if (interaction.commandName === 'edit') {
    const time = interaction.options.getString('time');
    const cohost = interaction.options.getString('cohost');
    await interaction.reply(`✏️ (Placeholder) Update Trello card → Time: ${time || "Unchanged"}, Co-Host: ${cohost || "Unchanged"}`);
  }

  if (interaction.commandName === 'cancel') {
    await interaction.reply("❌ (Placeholder) This would cancel/delete your Trello card.");
  }
});

client.login(process.env.DISCORD_TOKEN);
