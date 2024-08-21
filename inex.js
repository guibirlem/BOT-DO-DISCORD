const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const ownerId = '226913332463009793'; // Seu ID como dono do bot
const UNSPLASH_ACCESS_KEY = 'cDtj6FU00rFerG7wgs9tCitN5B-P6_vF3DeDCqVakGQ'; // Chave de acesso do Unsplash
const GIPHY_API_KEY = 'jcB3EFrD0zO0VJfKQkqxSIek5P68GKnH'; // Chave de acesso do Giphy
const PANELA_ROLE_NAME = 'Panela'; // Nome do cargo que o bot verificará
const BOT_ID = '1273990603536859261'; // ID do bot

let rpsGames = new Map(); // Armazena o estado do jogo RPS para cada usuário
let rpsStats = {}; // Armazena estatísticas do jogo RPS
const statsFilePath = path.join(__dirname, 'rpsStats.json');

// Função para carregar o ranking do arquivo JSON
function loadStats() {
    if (fs.existsSync(statsFilePath)) {
        const data = fs.readFileSync(statsFilePath);
        rpsStats = JSON.parse(data);
    } else {
        rpsStats = {};
    }
}

// Função para salvar o ranking no arquivo JSON
function saveStats() {
    fs.writeFileSync(statsFilePath, JSON.stringify(rpsStats, null, 2));
}

client.once('ready', () => {
    console.log('o Bot da panela está Online');
    loadStats(); // Carrega as estatísticas do arquivo JSON
    if (!rpsStats[BOT_ID]) {
        rpsStats[BOT_ID] = { victories: 0, losses: 0, draws: 0 };
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    try {
        const content = message.content.toLowerCase();

        // Comando !ping
        if (content === '!ping') {
            await message.reply('pong');
            return;
        }

        // Comando !ajuda
        if (content === '!ajuda') {
            await message.reply(`**comandos disponíveis:**
1. **!ping** - responde com "pong"
2. **!rps** - faz um jogo de pedra papel e tesoura com ranking
3. **!imagem <termo>** - pesquisa uma imagem na internet
4. **!gif <termo>** - pesquisa um gif na internet
5. **!userinfo <@usuario>** - exibe informações sobre o usuário mencionado
6. **!rpsranking** - mostra o ranking de vitórias, derrotas e empates
7. **!membros** - lista todos os membros do servidor`);
            return;
        }

        // Comando !membros para listar todos os membros do servidor
        if (content === '!membros') {
            try {
                const members = await message.guild.members.fetch();
                const memberTags = members.map(member => member.user.tag).join(', ');
                const memberCount = members.size;
                await message.channel.send(`Membros do servidor (${memberCount}): ${memberTags}`);
            } catch (error) {
                await message.channel.send('Não foi possível listar os membros.');
                const owner = await client.users.fetch(ownerId);
                if (owner) {
                    owner.send(`Erro ao listar membros: ${error.message}`);
                }
                console.error('Erro ao listar membros:', error);
            }
            return;
        }

        // Comando !rps para iniciar o jogo
        if (content === '!rps') {
            rpsGames.set(message.author.id, { waitingForResponse: true });
            await message.reply('Escolha: pedra, papel ou tesoura');
            return;
        }

        // Comando !reset para limpar dados de RPS e ranking
        if (content === '!reset' && message.author.id === ownerId) {
            rpsStats = {};
            rpsStats[BOT_ID] = { victories: 0, losses: 0, draws: 0 };
            saveStats(); // Salva os dados após resetar
            await message.reply('Dados de RPS e ranking foram limpos');
            return;
        }

        // Comando !rpsranking para exibir o ranking de RPS
        if (content === '!rpsranking') {
            const sortedStats = Object.entries(rpsStats).sort(([, a], [, b]) => b.victories - a.victories);
            let rankingMessage = 'Ranking de RPS:\n';
            sortedStats.forEach(([userId, stats], index) => {
                rankingMessage += `${index + 1}. <@${userId}> - ${stats.victories} vitórias, ${stats.losses} derrotas, ${stats.draws} empates\n`;
            });
            await message.reply(rankingMessage || 'Não há dados suficientes para mostrar o ranking');

            // Verificar se o bot está em primeiro lugar no ranking
            if (sortedStats[0] && sortedStats[0][0] === BOT_ID) {
                const response = await axios.get('https://api.giphy.com/v1/gifs/search', {
                    params: {
                        api_key: GIPHY_API_KEY,
                        q: 'yasuo',
                        limit: 1
                    }
                });
                const gifUrl = response.data.data[0]?.images.original.url;
                await message.channel.send(gifUrl || 'Nenhum gif encontrado');
            }
            return;
        }

        // Comando !imagem <termo> para buscar imagem
        if (content.startsWith('!imagem ')) {
            const searchTerm = content.slice(8).trim();
            if (!searchTerm) {
                await message.reply('Você precisa fornecer um termo de pesquisa');
                return;
            }
            try {
                const response = await axios.get('https://api.unsplash.com/search/photos', {
                    params: {
                        query: searchTerm,
                        client_id: UNSPLASH_ACCESS_KEY,
                        orientation: 'landscape',
                        per_page: 1
                    }
                });
                if (response.data.results.length > 0) {
                    const imageUrl = response.data.results[0].urls.regular;
                    await message.channel.send({ content: 'Aqui está a imagem que encontrei:', files: [{ attachment: imageUrl, name: 'imagem.jpg' }] });
                } else {
                    await message.reply('Nenhuma imagem encontrada');
                }
            } catch (error) {
                console.error('Erro ao buscar imagem:', error.message || error);
                await message.reply('Houve um erro ao buscar a imagem');
            }
            return;
        }

        // Comando !gif <termo> para buscar GIF
        if (content.startsWith('!gif ')) {
            const searchTerm = content.slice(5).trim();
            if (!searchTerm) {
                await message.reply('Você precisa fornecer um termo de pesquisa');
                return;
            }
            try {
                const response = await axios.get('https://api.giphy.com/v1/gifs/search', {
                    params: {
                        api_key: GIPHY_API_KEY,
                        q: searchTerm,
                        limit: 1
                    }
                });
                const gifUrl = response.data.data[0]?.images.original.url;
                await message.reply(gifUrl || 'Nenhum gif encontrado');
            } catch (error) {
                console.error('Erro ao buscar gif:', error.message || error);
                await message.reply('Houve um erro ao buscar o gif');
            }
            return;
        }

        // Comando !userinfo <@usuario> para exibir informações do usuário
        if (content.startsWith('!userinfo')) {
            const user = message.mentions.users.first() || message.author;
            const member = message.guild.members.cache.get(user.id);
            const role = message.guild.roles.cache.find(role => role.name === PANELA_ROLE_NAME);
            const hasPanelaRole = role && member.roles.cache.has(role.id);
            const roleMessage = hasPanelaRole ? 'Esse é da panela' : 'Esse tá invadindo a panela';
            await message.reply(`${user.username}'s avatar: ${user.displayAvatarURL({ dynamic: true })}
- Desde quando é membro: ${member ? member.joinedAt.toDateString() : 'desconhecido'}
${roleMessage}`);
            return;
        }

        // Responder a frases que indicam que a pessoa é ruim
        const triggerPhrases = ['tu e ruim', 'tu e horivel', 'tu e rui'];
        if (triggerPhrases.some(phrase => content.includes(phrase))) {
            await message.channel.send('Tu e pior');
            return;
        }

        // Responder a frases específicas
        if (content === 'low mestre') {
            await message.channel.send('igual ao <@332998701922648066>'); // ID do LOW MESTRE
            return;
        }

        if (content === '!miranda') {
            await message.channel.send('<@386968770750447628> se fuder ganka top lixo'); // ID do MIRANDA
            return;
        }

        // Comando para Pedra, Papel ou Tesoura (aguardando resposta)
        if (rpsGames.has(message.author.id)) {
            const game = rpsGames.get(message.author.id);
            const choices = ['pedra', 'papel', 'tesoura'];
            const userChoice = content;
            if (choices.includes(userChoice)) {
                const botChoice = choices[Math.floor(Math.random() * choices.length)];
                let result;
                if (userChoice === botChoice) {
                    result = `Dei azar gege, eu escolhi ${botChoice}`;
                    rpsStats[BOT_ID].draws++;
                } else if (
                    (userChoice === 'pedra' && botChoice === 'tesoura') ||
                    (userChoice === 'papel' && botChoice === 'pedra') ||
                    (userChoice === 'tesoura' && botChoice === 'papel')
                ) {
                    result = `Ganhei! TU É RUIM PACARAI ${botChoice}`;
                    rpsStats[BOT_ID].victories++;
                } else {
                    result = `Perdi... vtnc escolhi ${botChoice}`;
                    rpsStats[BOT_ID].losses++;
                }
                await message.reply(result);

                // Atualizar estatísticas do usuário
                if (!rpsStats[message.author.id]) {
                    rpsStats[message.author.id] = { victories: 0, losses: 0, draws: 0 };
                }
                if (result.includes('Dei azar')) {
                    rpsStats[message.author.id].draws++;
                } else if (result.includes('Ganhei')) {
                    rpsStats[message.author.id].victories++;
                } else {
                    rpsStats[message.author.id].losses++;
                }
                rpsGames.delete(message.author.id);

                // Salvar estatísticas após uma partida
                saveStats();
            } else {
                await message.reply('Escolha inválida! É PEDRA PAPEL OU TESOURA PORRA..');
            }
            return;
        }
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
    }
});
client.login('MTI3Mzk5MDYwMzUzNjg1OTI2MQ.G-ypo3.FWFmU_HvX25xbUo5iRPp-tpwByeOaFSOV_DoUw'); // Substitua com o token do seu bot