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
const BOT_ID = '1275905234123624470'; // ID do bot

let rpsGames = new Map(); // Armazena o estado do jogo RPS para cada usuário
let rpsStats = {}; // Armazena estatísticas do jogo RPS
const statsFilePath = path.join(__dirname, 'rpsStats.json');
const lastReplyTimes = new Map(); // Map para rastrear o tempo da última resposta
const REPLY_INTERVAL_MS = 60 * 1000; // 1 minuto em milissegundos


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
        rpsStats[BOT_ID] = { victories: 0, losses: 0, draws: 0, totalGames: 0 };
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    try {
        const content = message.content.toLowerCase();
         // Verifica se a mensagem menciona o bot e não é de um bot
         if (message.mentions.has(client.user) && !message.author.bot) {
            const now = Date.now();
            const lastReplyTime = lastReplyTimes.get(message.author.id);

            // Verifica se o intervalo de tempo foi respeitado
            if (!lastReplyTime || (now - lastReplyTime) >= REPLY_INTERVAL_MS) {
                await message.reply('fala judeu');
                lastReplyTimes.set(message.author.id, now); // Atualiza o tempo da última resposta
            }
            return;
        }

        // Comando !ping
        
        if (content === '!ping') {
            await message.reply('Pong');
            console.log(`Enviado "Pong" para ${message.author.tag} no canal ${message.channel.name}`);
            return;
        }
        const triggerPhrases = ['tu e ruim', 'tu e horivel', 'tu e rui', 'tu é ruim'];
        if (triggerPhrases.some(phrase => content.includes(phrase))) {
            await message.channel.send('Tu é pior');
            console.log(`Enviado "Tu é pior" para ${message.author.tag} no canal ${message.channel.name}`);
            return;
        }
        const trriggerPhrases = ['preto', 'macaco', 'escuro', 'pretao'];
        const lowerCaseContent = content.toLowerCase();

        if (trriggerPhrases.some(phrase => lowerCaseContent.includes(phrase))) {
         await message.reply('RACIST');
         console.log(`Enviado "RACIST" para ${message.author.tag} no canal ${message.channel.name}`);
         return;
}


        // low mestre e miranda 
        if (content === 'low mestre') {
            await message.channel.send('igual ao <@332998701922648066>'); // ID do LOW MESTRE
            console.log(`Enviado "low mestre" para ${message.author.tag} no canal ${message.channel.name}`);
            return;
        }

        if (content === '!miranda') {
            await message.channel.send('<@386968770750447628> se fuder ganka top lixo'); // ID do MIRANDA
            console.log(`Enviado "comando do miranda" para ${message.author.tag} no canal ${message.channel.name}`);
            return;
        }

        //!ajuda
        if (content === '!ajuda') {
            await message.reply(`**comandos disponíveis:**
1. **!ping** - responde com "pong"
2. **!rps** - faz um jogo de pedra papel e tesoura com ranking
3. **!imagem <termo>** - pesquisa uma imagem na internet
4. **!gif <termo>** - pesquisa um gif na internet
5. **!userinfo <@usuario>** - exibe informações sobre o usuário mencionado
6. **!rpsranking** - mostra o ranking de vitórias, derrotas e empates
7. **!membros** - lista todos os membros do servidor
8. **!miranda** - MANDA O MIRANDA GANKA TOP `);
console.log(`Enviado "!ajuda etc" para ${message.author.tag} no canal ${message.channel.name}`);
            return;
        }

        // comando !membros para listar todos os membros do servidor
        if (content === '!membros') {
            try {
                const members = await message.guild.members.fetch();
                const memberTags = members.map(member => member.user.tag).join(', ');
                const memberCount = members.size;
                await message.channel.send(`Membros do servidor (${memberCount}): ${memberTags}`);
            } catch (error) {
                await message.channel.send('não consegui listar os membros.');
                const owner = await client.users.fetch(ownerId);
                if (owner) {
                    owner.send(`deu erro ao listar membros: ${error.message}`);
                }
                console.error('Erro ao listar membros:', error);
            }
            console.log(`Enviado "!membros etc" para ${message.author.tag} no canal ${message.channel.name}`);
            return;
        }

        // Comando !rps para iniciar o jogo
        if (content === '!rps') {
            rpsGames.set(message.author.id, { waitingForResponse: true });
            await message.reply('escolhe ai, animal: pedra, papel ou tesoura');
            console.log(`Enviado "escolhe ai, animal: pedra, papel ou tesoura" para ${message.author.tag} no canal ${message.channel.name}`);
            return;
        }

        // Comando !reset para limpar dados de RPS e ranking
        if (content === '!reset' && message.author.id === ownerId) {
            rpsStats = {};
            rpsStats[BOT_ID] = { victories: 0, losses: 0, draws: 0, totalGames: 0 };
            saveStats(); // Salva os dados após resetar
            await message.reply('os dados de RPS e ranking foram limpos');
            console.log(`Enviado "os dados de RPS e ranking foram limpos" para ${message.author.tag} no canal ${message.channel.name}`);
            return;
        }

// Comando !rpsranking para exibir o ranking de RPS sem incluir o bot
/*if (content === '!rpsranking') {
    // Filtra o ranking para não incluir o bot
    const sortedStats = Object.entries(rpsStats)
        .filter(([userId]) => userId !== BOT_ID) // Remove o bot do ranking
        .map(([userId, stats]) => {
            const totalGames = stats.victories + stats.losses;
            const winPercentage = totalGames > 0 ? (stats.victories / totalGames) * 100 : 0;
            return { userId, stats, winPercentage };
        })
        .sort((a, b) => b.winPercentage - a.winPercentage);

    let rankingMessage = 'Ranking de RPS:\n';
    let rank = 1;

    for (const { userId, stats, winPercentage } of sortedStats) {
        try {
            const user = await client.users.fetch(userId);
            const userName = user.username;
            const totalGames = stats.victories + stats.losses + stats.draws;

            // Mostrar ranking, nome do usuário e porcentagem de vitórias
            rankingMessage += `(${rank}) ${userName} - ${stats.victories} vitórias (${winPercentage.toFixed(2)}%), ${stats.losses} derrotas, ${stats.draws} empates, ${totalGames} partidas\n`;

            rank++;
        } catch (error) {
            console.error('Erro ao buscar informações do usuário:', error);
            rankingMessage += `(${rank}) Usuário <@${userId}> - Erro ao buscar nome\n`;
            rank++;
        }
    }

    await message.reply(rankingMessage || 'ninguém jogou ainda, tá tudo zerado');
}
*/


// Comando !rpsranking para exibir o ranking de RPS sem incluir o bot
if (content === '!rpsranking') {
    // Filtra o ranking para não incluir o bot
    const sortedStats = Object.entries(rpsStats)
        .filter(([userId]) => userId !== BOT_ID) // Remove o bot do ranking
        .map(([userId, stats]) => {
            const totalGames = stats.victories + stats.losses;
            const winPercentage = totalGames > 0 ? (stats.victories / totalGames) * 100 : 0;
            return { userId, stats, winPercentage };
        })
        .sort((a, b) => b.winPercentage - a.winPercentage);

    let rankingMessage = 'Ranking de RPS:\n';
    let rank = 1;

    for (const { userId, stats, winPercentage } of sortedStats) {
        try {
            const user = await client.users.fetch(userId);
            const userName = user.username;
            const totalGames = stats.victories + stats.losses + stats.draws;

            // Mostrar ranking, nome do usuário e porcentagem de vitórias
            rankingMessage += `(${rank}) ${userName} - ${stats.victories} vitórias (${winPercentage.toFixed(2)}%), ${stats.losses} derrotas, ${stats.draws} empates, ${totalGames} partidas\n`;

            rank++;
            console.log(`Enviado "!rpsranking" para ${message.author.tag} no canal ${message.channel.name}`);
        } catch (error) {
            console.error('Erro ao buscar informações do usuário:', error);
            rankingMessage += `(${rank}) Usuário <@${userId}> - Erro ao buscar nome\n`;
            rank++;
        }
    }

    await message.reply(rankingMessage || 'ninguém jogou ainda, tá tudo zerado');
    console.log(`Enviado "rank de rps" para ${message.author.tag} no canal ${message.channel.name}`);
}

// Comando !rpsranking1 para exibir o ranking de RPS incluindo o bot
if (content === '!rpsranking1') {
    // Inclui o bot no ranking
    const sortedStats = Object.entries(rpsStats)
        .map(([userId, stats]) => {
            const totalGames = stats.victories + stats.losses;
            const winPercentage = totalGames > 0 ? (stats.victories / totalGames) * 100 : 0;
            return { userId, stats, winPercentage };
        })
        .sort((a, b) => b.winPercentage - a.winPercentage);

    let rankingMessage = 'Ranking de RPS:\n';
    let rank = 1;

    for (const { userId, stats, winPercentage } of sortedStats) {
        try {
            const user = await client.users.fetch(userId);
            const userName = user.username;
            const totalGames = stats.victories + stats.losses + stats.draws;

            // Mostrar ranking, nome do usuário e porcentagem de vitórias
            rankingMessage += `(${rank}) ${userName} - ${stats.victories} vitórias (${winPercentage.toFixed(2)}%), ${stats.losses} derrotas, ${stats.draws} empates, ${totalGames} partidas\n`;
            console.log(`Enviado "!rpsranking1" para ${message.author.tag} no canal ${message.channel.name}`);
            rank++;
        } catch (error) {
            console.error('Erro ao buscar informações do usuário:', error);
            rankingMessage += `(${rank}) Usuário <@${userId}> - Erro ao buscar nome\n`;
            rank++;
        }
    }

    // Envia a mensagem de ranking
    await message.reply(rankingMessage || 'ninguém jogou ainda, tá tudo zerado');
    // Verifica se o bot está em primeiro lugar e envia um GIF
    if (sortedStats[0] && sortedStats[0].userId === BOT_ID) {
        try {
            const response = await axios.get('https://api.giphy.com/v1/gifs/search', {
                params: {
                    api_key: GIPHY_API_KEY,
                    q: 'yasuo',
                    limit: 1
                }
            });
            const gifUrl = response.data.data[0]?.images.original.url;
            await message.channel.send(gifUrl || 'não achei nenhum gif');
        } catch (error) {
            console.error('Erro ao buscar GIF:', error);
            await message.channel.send('Erro ao buscar GIF.');

        }
    }
}

// Comando !rank para exibir o ranking de RPS mencionando os usuários e incluindo o bot
if (content === '!rank') {
    // Inclui o bot no ranking
    const sortedStats = Object.entries(rpsStats)
        .map(([userId, stats]) => {
            const totalGames = stats.victories + stats.losses;
            const winPercentage = totalGames > 0 ? (stats.victories / totalGames) * 100 : 0;
            return { userId, stats, winPercentage };
        })
        .sort((a, b) => b.winPercentage - a.winPercentage);

    let rankingMessage = 'Ranking de RPS:\n';
    let rank = 1;

    for (const { userId, stats, winPercentage } of sortedStats) {
        try {
            const user = await client.users.fetch(userId);
            const userName = user.username;
            const totalGames = stats.victories + stats.losses + stats.draws;

            // Mostrar ranking, menção do usuário e porcentagem de vitórias
            rankingMessage += `(${rank}) <@${userId}> - ${userName} - ${stats.victories} vitórias (${winPercentage.toFixed(2)}%), ${stats.losses} derrotas, ${stats.draws} empates, ${totalGames} partidas\n`;
            console.log(`Enviado "!rank" para ${message.author.tag} no canal ${message.channel.name}`);
            rank++;
        } catch (error) {
            console.error('Erro ao buscar informações do usuário:', error);
            rankingMessage += `(${rank}) Usuário <@${userId}> - Erro ao buscar nome\n`;
            rank++;
        }
    }

    await message.reply(rankingMessage || 'ninguém jogou ainda, tá tudo zerado');
}

// Bot em primeiro (opcional, se quiser uma mensagem diferente)
// if (sortedStats[0] && sortedStats[0][0] === BOT_ID) {
//     const response = await axios.get('https://api.giphy.com/v1/gifs/search', {
//         params: {
//             api_key: GIPHY_API_KEY,
//             q: 'yasuo',
//             limit: 1
//         }
//     });
//     const gifUrl = response.data.data[0]?.images.original.url;
//     await message.channel.send(gifUrl || 'não achei nenhum gif');
// }


// Bot em primeiro (opcional, se quiser uma mensagem diferente)
// if (sortedStats[0] && sortedStats[0][0] === BOT_ID) {
//     const response = await axios.get('https://api.giphy.com/v1/gifs/search', {
//         params: {
//             api_key: GIPHY_API_KEY,
//             q: 'yasuo',
//             limit: 1
//         }
//     });
//     const gifUrl = response.data.data[0]?.images.original.url;
//     await message.channel.send(gifUrl || 'não achei nenhum gif');
// }


// Bot em primeiro (opcional, se quiser uma mensagem diferente)
// if (sortedStats[0] && sortedStats[0][0] === BOT_ID) {
//     const response = await axios.get('https://api.giphy.com/v1/gifs/search', {
//         params: {
//             api_key: GIPHY_API_KEY,
//             q: 'yasuo',
//             limit: 1
//         }
//     });
//     const gifUrl = response.data.data[0]?.images.original.url;
//     await message.channel.send(gifUrl || 'não achei nenhum gif');
// }


        // comando !imagem <termo> 
        if (content.startsWith('!imagem ')) {
            const searchTerm = content.slice(8).trim();
            if (!searchTerm) {
                await message.reply('manda o que você quer buscar, porra');
                console.log(`Enviado "!iamgem" para ${message.author.tag} no canal ${message.channel.name}`);
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
                    await message.channel.send({ content: 'aqui tá a imagem que achei:', files: [{ attachment: imageUrl, name: 'imagem.jpg' }] });
                    console.log(`Enviado achou imagem mandou" para ${message.author.tag} no canal ${message.channel.name}`);
                    
                } else {
                    await message.reply('não achei nenhuma imagem, caralho');
                    console.log(`Enviado nao achei nenhuma imagem caralho" para ${message.author.tag} no canal ${message.channel.name}`);
                    console.log(`Enviado "nao achou imagem" para ${message.author.tag} no canal ${message.channel.name}`);
                }
            } catch (error) {
                console.error('Erro ao buscar imagem:', error.message || error);
                await message.reply('deu erro ao buscar a imagem');
            }
            return;
        }

        // comando !gif <termo> 
        if (content.startsWith('!gif ')) {
            const searchTerm = content.slice(5).trim();
            if (!searchTerm) {
                await message.reply('manda o que você quer buscar, porra');
                console.log(`Enviado manda oque voce quer buscar porra" para ${message.author.tag} no canal ${message.channel.name}`);
                return;
            }
            try {
                const response = await axios.get('https://api.giphy.com/v1/gifs/search', {
                    params: {
                        api_key: GIPHY_API_KEY,
                        q: searchTerm,
                        limit: 1
                    }
                });console.log(`Enviado gif  para ${message.author.tag} no canal ${message.channel.name}`);
                const gifUrl = response.data.data[0]?.images.original.url;
                await message.reply(gifUrl || 'não achei nenhum gif, caralho');
            } catch (error) {
                console.error('Erro ao buscar gif:', error.message || error);
                await message.reply('deu erro ao buscar o gif');
            }
            return;
        }

        // Comando !userinfo <@usuario> para exibir informações do usuário
if (content.startsWith('!userinfo')) {
    const user = message.mentions.users.first() || message.author;
    const member = message.guild.members.cache.get(user.id);
    const role = message.guild.roles.cache.find(role => role.name === PANELA_ROLE_NAME);
    const hasPanelaRole = role && member.roles.cache.has(role.id);
    const roleMessage = hasPanelaRole ? 'esse é da panela' : 'esse tá invadindo a panela';
    
    const userStats = rpsStats[user.id] || { totalGames: 0, victories: 0, losses: 0, draws: 0 };
    const totalGames = userStats.totalGames; 
    
    await message.reply(`${user.username}'s avatar: ${user.displayAvatarURL({ dynamic: true })}
- jogos de RPS: ${totalGames} partidas
- ${roleMessage}`);
console.log(`Enviado userinfo para ${message.author.tag} no canal ${message.channel.name}`);
    return;
}


        // Verificação para RPS (Pedra, Papel, Tesoura)
        if (rpsGames.has(message.author.id) && rpsGames.get(message.author.id).waitingForResponse) {
            const userChoice = content;
            const validChoices = ['pedra', 'papel', 'tesoura'];
            if (!validChoices.includes(userChoice)) {
                await message.reply('escolha inválida, animal. É PEDRA PAPEL OU TESOURA NÃO ME TESTA FOI O GULUPA QUE ME CODO.');
                console.log(`Enviado "tao trollando o bot no rps" para ${message.author.tag} no canal ${message.channel.name}`);
                return;
            }

            const botChoice = validChoices[Math.floor(Math.random() * validChoices.length)];
            await message.reply(`você escolheu **${userChoice}** e eu escolhi **${botChoice}**.`);

            let resultMessage = '';
            if (userChoice === botChoice) {
                resultMessage = 'deu empate, tu er uim \nr\nu\ni\nm.';
                console.log(`Enviado "bot empatou" para ${message.author.tag} no canal ${message.channel.name}`);
                rpsStats[message.author.id] = rpsStats[message.author.id] || { victories: 0, losses: 0, draws: 0, totalGames: 0 };
                rpsStats[message.author.id].draws++;
                rpsStats[BOT_ID].draws++;
            } else if (
                (userChoice === 'pedra' && botChoice === 'tesoura') ||
                (userChoice === 'papel' && botChoice === 'pedra') ||
                (userChoice === 'tesoura' && botChoice === 'papel')
            ) {
                resultMessage = 'você ganhou, CARALHO AZAR DA PORRA.';
                console.log(`Enviado "bot perdeu" para ${message.author.tag} no canal ${message.channel.name}`);
                rpsStats[message.author.id] = rpsStats[message.author.id] || { victories: 0, losses: 0, draws: 0, totalGames: 0 };
                rpsStats[message.author.id].victories++;
                rpsStats[BOT_ID].losses++;
            } else {
                resultMessage = 'perdeu, lixo fudido.';
                console.log(`Enviado "bot ganhou" para ${message.author.tag} no canal ${message.channel.name}`);
                rpsStats[message.author.id] = rpsStats[message.author.id] || { victories: 0, losses: 0, draws: 0, totalGames: 0 };
                rpsStats[message.author.id].losses++;
                rpsStats[BOT_ID].victories++;
            }

            rpsStats[message.author.id].totalGames++;
            rpsStats[BOT_ID].totalGames++;

            await message.channel.send(resultMessage);
            rpsGames.delete(message.author.id);
            saveStats(); // Salva as estatísticas depois do jogo
            return;
        }

    } catch (error) {
        console.error('Erro ao processar comando:', error.message || error);
        await message.reply('deu erro ao processar o comando');

        // Enviar mensagem para mim
        const owner = await client.users.fetch(ownerId);
        if (owner) {
            owner.send(`Erro ocorrido:
            - Mensagem: ${message.content}
            - Usuário: ${message.author.tag}
            - Canal: ${message.channel.name}
            - Data/Hora: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour12: false })}`);
        }
    }
});
client.login('MTI3NTkwNTIzNDEyMzYyNDQ3MA.GHChuT.Om0dKqXFktuYjdvHsGrtFmVp7oxbH0Igb3s33M'); 
