const _ = require('lodash');
const Promise = require('bluebird');
const Transaction = require('../../models/transaction');
const TreasureHunterGame = require('../../models/treasureHunterGame');
const TreasureHunterPlayer = require('../../models/treasureHunterPlayer');
const User = require('../../models/user');

const makeUnregisteredMessage = (chatId) => {
  const text = `Hi, you don't seem to \
be registered yet! Do /start to register first!`;
  
  const message = JSON.stringify({
    chat_id: chatId,
    text: text
  });
  return message;
};

const makeJoinGameMessage = (chatId) => {
  const text = `You have successfully joined the game!`;
  const message = JSON.stringify({
    chat_id: chatId,
    text: text
  });
  return message;
};

const makeNoGameMessage = (chatId) => {
  const text = `There are no active games right now. Please \
start a game using /treasure before trying to join.`;
  const message = JSON.stringify({
    chat_id: chatId,
    text: text
  });
  return message;
};

const makeRunningGameMessage = (chatId) => {
  const text = `A game is currently in progress, and is \
not opened for joining!`;
  const message = JSON.stringify({
    chat_id: chatId,
    text: text
  });
  return message;
};

const makeNotEnoughGoldMessage = (chatId) => {
  const text = `You do not have enough gold in your \
personal Deer Daily Inn balance to join the game now! You \
will need at least 20 gold to join the game.`;
  const message = JSON.stringify({
    chat_id: chatId,
    text: text
  });
  return message;
};

const joinhunt = (params) => {
  if (_.isNil(params.bot)) {
    return Promise.reject('Rejected in joinhunt: Bot cannot be missing');
  }
  if (_.isNil(params.telegramId) || _.isNil(params.chatId)) {
    return Promise.reject('Rejected in joinhunt: Missing telegram user id or chat id');
  }

  const bot = params.bot;
  const telegramId = params.telegramId;
  const chatId = params.chatId;

  return TreasureHunterGame.query()
  .whereIn('status', ['pending', 'started'])
  .andWhere('chatId', chatId)
  .first()
  .then((game) => {
    if (_.isNil(game)) {
      const message = makeNoGameMessage(chatId);
      bot.sendTelegramMessage('sendMessage', message);
      return Promise.reject('Game has not started yet.');
    }
    if (game.status === 'pending') {
      const message = makeRunningGameMessage(chatId);
      bot.sendTelegramMessage('sendMessage', message);
      return Promise.reject('Game is already running.');
    }

    const user = User.query().where('telegramId', telegramId).first();
    return Promise.all([game, user]);
  })
  .then(([game, user]) => {
    if (_.isNil(user) || _.isNil(user.chtwrsToken)) {
      const message = makeUnregisteredMessage(chatId);
      bot.sendTelegramMessage('sendMessage', message);
      return Promise.reject('User is not registered.');
    }
    if (user.balance < 20) {
      const message = makeNotEnoughGoldMessage(chatId);
      bot.sendTelegramMessage('sendMessage', message);
      return Promise.reject('User does not have enough gold.');
    }

    const userAttributes = {
      balance: user.balance - 20
    };
    return user.$query()
    .patch(userAttributes)
    .then(() => {
      const transactionAttributes = {
        fromId: user.id,
        quantity: 20,
        reason: 'Entry fee for treasure hunter game',
        status: 'completed',
        toId: 0
      };
      return Transaction.create(transactionAttributes);
    })
    .then(() => {
      const playerAttributes = {
        gameId: game.id,
        outcome: 0,
        userId: user.id
      };
      return TreasureHunterPlayer.create(playerAttributes);
    })
    .then(() => {
      const message = makeJoinGameMessage(chatId);
      return bot.sendTelegramMessage('sendMessage', message);
    });
  });
};

module.exports = joinhunt;
