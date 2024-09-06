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

const ownerId = '226913332463009793'; // meu id de dono // você muda para o seu dai
const UNSPLASH_ACCESS_KEY = 'AQUI A CHAVE DA API DO UNSPLASH FOTOS'; // chave api do unsplash
const GIPHY_API_KEY = 'AQUI A CHAVE DA GIF '; // chave api do  acesso do Giphy
const PANELA_ROLE_NAME = 'Panela'; // bot verifica se x pessoa tem x cargo NESSE CASO está verificando se é o cargo panela
const BOT_ID = '1275905234123624470'; // id do discord do bot

let rpsGames = new Map(); // Armazena o estado do jogo RPS para cada usuário
let rpsStats = {}; // armazena estatísticas do jogo RPS
let birthdays = {};
const statsFilePath = path.join(__dirname, 'rpsStats.json');
const lastReplyTimes = new Map(); // mapa de etempo para o bot ficar falando que continua online
const REPLY_INTERVAL_MS = 60 * 1000; // 1 minuto em milissegundos 


// função para carregar o ranking do arquivo JSON
function loadStats() {
    if (fs.existsSync(statsFilePath)) {
        const data = fs.readFileSync(statsFilePath);
        rpsStats = JSON.parse(data);
    } else {
        rpsStats = {};
    }
}
if (fs.existsSync('./birthdays.json')) {
    birthdays = JSON.parse(fs.readFileSync('./birthdays.json'));
}

// função para salvar o ranking no arquivo JSON
function saveStats() {
    fs.writeFileSync(statsFilePath, JSON.stringify(rpsStats, null, 2));
}

client.once('ready', async () => {
    console.log('o bot da panela está online');

    loadStats(); 
    
    if (!rpsStats[BOT_ID]) {
        rpsStats[BOT_ID] = { victories: 0, losses: 0, draws: 0, totalGames: 0 };
    }

    const channelId = '1014602859481935872'; // ID do canal de comandos
    const channel = client.channels.cache.get(channelId);
    
    const birthdayChannelId = '1281689598954573904'; // ID do canal de aniversários
    const birthdayChannel = client.channels.cache.get(birthdayChannelId); // Obtém o canal de aniversários

    if (channel) {
        // Obter a data e hora atuais
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Janeiro é 0
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        const currentDate = `${day}/${month}/${year}`;
        const currentTime = `${hours}:${minutes}:${seconds}`;

        // Enviar a mensagem com a hora atual no canal de comandos
        channel.send(`estou online e pronto pra faze nada. hora atual: ${currentDate} ${currentTime}`);
        
        // Intervalo para enviar uma mensagem a cada 4 horas no canal de comandos
        setInterval(() => {
            channel.send('continuo online ainda');
        }, 4 * 60 * 60 * 1000); // 4 horas em milissegundos
    } else {
        console.error('canal de comandos não encontrado');
    }

    // Verificação de aniversários ao iniciar o bot
    const today = new Date();
    const currentBirthdayDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}`;

    if (birthdayChannel) {
        for (const userId in birthdays) {
            if (birthdays[userId] === currentBirthdayDate) {
                try {
                    const user = await client.users.fetch(userId);
                    birthdayChannel.send(`Feliz aniversário, ${user}! 🎉🎂 `);
                    console.log(`hoje é aniversário do @${user.username}, mandando parabéns para o usuário`); 
                } catch (error) {
                    console.error(`Erro ao mencionar o usuário: ${error}`);
                }
            }
        }
    } else {
        console.error('canal de aniversários bugo porraaa');
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    try {
        const content = message.content.toLowerCase();
         // verifica se a mensagem menciona o bot e não é de um bot
         if (message.mentions.has(client.user) && !message.author.bot) {
            const now = Date.now();
            const lastReplyTime = lastReplyTimes.get(message.author.id);

            // verifica se o intervalo de tempo foi respeitado
            if (!lastReplyTime || (now - lastReplyTime) >= REPLY_INTERVAL_MS) {
                await message.reply('fala meu brother');
                console.log(`${message.author.tag} Mencionou o bot no canal ${message.channel.name}`);
                lastReplyTimes.set(message.author.id, now); 
                return;
            }
            return;
        }
        

        //primeiros comandos do bot
            if (message.content === '!dia') {
                const now = new Date();
                const day = String(now.getDate()).padStart(2, '0');
                const month = String(now.getMonth() + 1).padStart(2, '0'); // janeiro é 0 como toda lista em 0
                const year = now.getFullYear();
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');
        
                const currentDate = `${day}/${month}/${year}`;
                const currentTime = `${hours}:${minutes}:${seconds}`;
        
                message.reply(`hoje é ${currentDate} e agora são ${currentTime}`);
            };
        
        
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
         await message.reply('RACISTA');
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
            await message.channel.send('<@386968770750447628>  ganka top lixo'); // ID do MIRANDA
            console.log(`Enviado "comando do miranda" para ${message.author.tag} no canal ${message.channel.name}`);
            return;
        }
        if (message.content === '!aniversario') {
            const userId = message.author.id;
            const filter = response => response.author.id === userId;
    
            // solicita a data de aniversário do usuário
            await message.reply('insira sua data de aniversário no formato dd/mm.');
    
            // aguarda a resposta do usuário
            try {
                const collected = await message.channel.awaitMessages({
                    filter,
                    max: 1,
                    time: 30000, // 30 segundos para responder
                    errors: ['time']
                });
    
                const response = collected.first();
                const birthday = response.content;
    
                // valida o formato da data (dd/mm)
                const regex = /^\d{2}\/\d{2}$/;
                if (!regex.test(birthday)) {
                    return message.reply('Use dd/mm.');
                }
    
                // salva a data no objeto JSON
                birthdays[userId] = birthday;
                fs.writeFileSync('./birthdays.json', JSON.stringify(birthdays, null, 2));
    
                message.reply(`aniversário salvo: ${birthday}`);
                console.log(`enviado "aniversario salvo" para ${message.author.tag} no canal ${message.channel.name}`);
            } catch (error) {
                message.reply('ACABOU O TEMPO.');
            }
        };
        
        
        
        if (content === '!ajuda') {
            await message.reply(`**comandos disponíveis:**
1. **!ping** - responde com "pong"
2. **!rps** - faz um jogo de pedra papel e tesoura com ranking
3. **!imagem <termo>** - pesquisa uma imagem na internet
4. **!gif <termo>** - pesquisa um gif na internet
5. **!userinfo <@usuario>** - exibe informações sobre o usuário mencionado
6. **!rpsranking** - mostra o ranking de vitórias, derrotas e empates
7. **!membros** - lista todos os membros do servidor
8. **!miranda** - MANDA O MIRANDA GANKA TOP
9. **!aniversario** - salva o seu aniversario no bot :)
10. **!aniversarios** - lista todos os aniversarios salvos no bot
11. **!dia** - fala o dia e a hora
`);
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
        // !rps para iniciar o jogo
        if (content === '!rps') {
            rpsGames.set(message.author.id, { waitingForResponse: true });
            await message.reply('escolhe ai: pedra, papel ou tesoura');
            console.log(`Enviado "escolhe ai, animal: pedra, papel ou tesoura" para ${message.author.tag} no canal ${message.channel.name}`);
            return;
        }
        // !reset para limpar dados de RPS e ranking
        if (content === '!reset' && message.author.id === ownerId) {
            rpsStats = {};
            rpsStats[BOT_ID] = { victories: 0, losses: 0, draws: 0, totalGames: 0 };
            saveStats(); // Salva os dados após resetar
            await message.reply('os dados de RPS e ranking foram limpos');
            console.log(`Enviado "os dados de RPS e ranking foram limpos" para ${message.author.tag} no canal ${message.channel.name}`);
            return;
        }
// !rpsranking para exibir o ranking de RPS sem incluir o bot
if (content === '!rpsranking') {
    
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

            // logica para mostrar o rank de todos
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

// aqui mostra o bot no ranking
if (content === '!rpsranking1') {
    // bot 
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

            // mostrar rank, nome do usuario e porcentagem de vitórias
            rankingMessage += `(${rank}) ${userName} - ${stats.victories} vitórias (${winPercentage.toFixed(2)}%), ${stats.losses} derrotas, ${stats.draws} empates, ${totalGames} partidas\n`;
            console.log(`Enviado "!rpsranking1" para ${message.author.tag} no canal ${message.channel.name}`);
            rank++;
        } catch (error) {
            console.error('Erro ao buscar informações do usuário:', error);
            rankingMessage += `(${rank}) Usuário <@${userId}> - Erro ao buscar nome\n`;
            rank++;
        }
    }

    // nunca vai ta zerado pq o bot ja ta no json mas so pra garantir
    await message.reply(rankingMessage || 'ninguém jogou ainda, tá tudo zerado');
    // MELHOR LOGICA DO BOT // IF BOT == 1 MANDAR GIF YASUO
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
// comando !rank para exibir o ranking de RPS mencionando os usuários e incluindo o bot
if (content === '!rank') {
    // bot no ranking
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

            // mostrar rank, menção do usuário e porcentagem de vitórias
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
        // comando !imagem <termo> 
        if (content.startsWith('!imagem ')) {
            const searchTerm = content.slice(8).trim();
            if (!searchTerm) {
                await message.reply('manda o que você quer buscar logo');
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
                    await message.reply('não achei nenhuma imagem');
                    console.log(`Enviado nao achei nenhuma imagem" para ${message.author.tag} no canal ${message.channel.name}`);
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
                await message.reply('manda o que você quer buscar');
                console.log(`Enviado manda oque voce quer buscar " para ${message.author.tag} no canal ${message.channel.name}`);
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

        //  !userinfo <@usuario> para exibir informações do usuário
            if (content === '!aniversarios') {
                if (Object.keys(birthdays).length === 0) {
                    message.reply('Nenhum aniversário salvo.');
                } else {
                    const birthdayList = await Promise.all(
                        Object.entries(birthdays).map(async ([id, date]) => {
                            try {
                                const user = await client.users.fetch(id);
                                return `${user.username}: ${date}`;
                            } catch (error) {
                                console.error(`Não foi possível buscar o usuário com ID ${id}: ${error}`);
                                return `Usuário com ID ${id} não encontrado: ${date}`;
                            }
                        })
                    ).then(entries => entries.join('\n'));
            
                    message.reply(`Aniversários salvos:\n${birthdayList}`);
                }
                console.log(`Enviado aniversários salvos para ${message.author.tag} no canal ${message.channel.name}`);
                return;
            }
if (content.startsWith('!userinfo')) {
    const user = message.mentions.users.first() || message.author;
    const member = message.guild.members.cache.get(user.id);
    const role = message.guild.roles.cache.find(role => role.name === PANELA_ROLE_NAME);
    const hasPanelaRole = role && member.roles.cache.has(role.id);
    const roleMessage = hasPanelaRole ? 'esse é da panela' : 'esse tá invadindo a panela';

    const userStats = rpsStats[user.id] || { totalGames: 0, victories: 0, losses: 0, draws: 0 };
    const totalGames = userStats.totalGames; 
    
    // puxa o aniversario
    const birthday = birthdays[user.id] || 'Não informado';

    await message.reply(`${user.username}'s avatar: ${user.displayAvatarURL({ dynamic: true })}
- jogos de RPS: ${totalGames} partidas
- ${roleMessage}
- Aniversário: ${birthday}`);
    
    console.log(`Enviado userinfo para ${message.author.tag} no canal ${message.channel.name}`);
    return;
}
        // verificacao para RPS (pedra, papel, tesoura)
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
                resultMessage = 'você ganhou, AZAR.';
                console.log(`Enviado "bot perdeu" para ${message.author.tag} no canal ${message.channel.name}`);
                rpsStats[message.author.id] = rpsStats[message.author.id] || { victories: 0, losses: 0, draws: 0, totalGames: 0 };
                rpsStats[message.author.id].victories++;
                rpsStats[BOT_ID].losses++;
            } else {
                resultMessage = 'perdeu, FACIL..';
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

        // enviar mensagem para mim
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

client.login('aqui a chave do seu bot.');
