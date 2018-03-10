const Promise = require('bluebird');
const _ = require('lodash');

const channelController = require('./telegram/channel');
const defaultController = require('./telegram/unknown');

const authController = require('./telegram/auth');
const balanceController = require('./telegram/balance');
const confirmController = require('./telegram/confirm');
const dealsController = require('./telegram/deals');
const depositController = require('./telegram/deposit');
const flashController = require('./telegram/flash');
const grantController = require('./telegram/grant');
const helpController = require('./telegram/help');
const infoController = require('./telegram/info');
const joinHuntController = require('./telegram/joinhunt');
const startController = require('./telegram/start');
const treasureController = require('./telegram/treasure');
const updateLogController = require('./telegram/updatelog');
const withdrawController = require('./telegram/withdraw');

const controllerRouter = {
  auth: authController,
  balance: balanceController,
  confirm: confirmController,
  deals: dealsController,
  deposit: depositController,
  flash: flashController,
  grant: grantController,
  help: helpController,
  info: infoController,
  joinhunt: joinHuntController,
  purchases: dealsController,
  sales: dealsController,
  start: startController,
  treasure: treasureController,
  updatelog: updateLogController,
  withdraw: withdrawController
};

const usableCommandsInChannel = new Set([
  'deals',
  'flash',
  'help',
  'info',
  'joinhunt',
  'purchases',
  'sales',
  'treasure',
  'updatelog']);
const definedCommands = new Set(_.keys(controllerRouter));

const telegramRouter = (params) => {
  let controllerName = params.controllerName;
  const controller = controllerRouter[controllerName];
  const usableController = !_.isNil(controller) ? controller : defaultController;

  // If command is not understood in channel, we assume it is not for us
  if (params.isChannel && !definedCommands.has(controllerName)) {
    return Promise.resolve();
  } else if (params.isChannel && !usableCommandsInChannel.has(controllerName)) {
    return channelController(params);
  } else {
    return usableController(params);
  }
};

module.exports = telegramRouter;
