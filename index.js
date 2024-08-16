const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers // pra ver toda a lista de membros
    ]
});

const ownerId = '226913332463009793'; // Seu ID como dono do bot

client.once('ready', () => {
    console.log('Bot está online!');
});

client.on('messageCreate', async message => {
    // Evitar que o bot responda a suas próprias mensagens
    if (message.author.bot) return;

    try {
        // Comando !ping
        if (message.content === '!ping') {
            message.reply('Pong!');
        }

        // Falar que o mancra é low mestre
        if (message.content.toLowerCase() === 'low mestre') {
            const userId = '332998701922648066'; // ID do mancra
            try {
                const user = await message.guild.members.fetch(userId);
                message.channel.send(`igual o ${user},`);
            } catch (error) {
                message.channel.send('O mancra1 é tão ruim que não foi encontrado.');
            }
        }

        // Comando !miranda funcionar
        if (message.content === '!miranda') {
            const userId = '386968770750447628'; // ID do usuário MIRANDA
            try {
                const user = await message.guild.members.fetch(userId);
                message.channel.send(`${user}, se fuder ganka top lixo`);
            } catch (error) {
                message.channel.send('Miranda é tão ruim que não foi encontrado.');
            }
        }

        // Responder "tu é pior" para mensagens específicas
        const triggerPhrases = ['tu e ruim', 'tu é ruim', 'tu é horible', 'tu e horible', 'tu e rui'];
        if (triggerPhrases.some(phrase => message.content.toLowerCase().includes(phrase))) {
            message.channel.send('tu é pior');
        }

        // Responder "RACIST" para palavras ofensivas
        const offensiveWords = ['preto', 'escuro', 'macaco'];
        if (offensiveWords.some(word => message.content.toLowerCase().includes(word))) {
            message.reply('RACIST');
        }
    } catch (error) {
        // Enviar uma DM para o dono do bot com a mensagem de erro
        const owner = await client.users.fetch(ownerId);
        if (owner) {
            owner.send(`Ocorreu um erro no bot: ${error.message}`);
        }
        console.error('Erro ao processar a mensagem:', error);
    }
});

client.on('messageCreate', async message => {
    if (message.content === '!membros') {
        try {
            const members = await message.guild.members.fetch();
            const memberTags = members.map(member => member.user.tag).join(', ');
            const memberCount = members.size;
            message.channel.send(`Membros do servidor (${memberCount}): ${memberTags}`);
        } catch (error) {
            message.channel.send('Não foi possível listar os membros.');
            // Enviar uma DM para o dono do bot com a mensagem de erro
            const owner = await client.users.fetch(ownerId);
            if (owner) {
                owner.send(`Erro ao listar membros: ${error.message}`);
            }
            console.error('Erro ao listar membros:', error);
        }
    }
});




client.login();
