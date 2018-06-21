const { transports, format, createLogger } = require('winston');;
const { combine, timestamp, printf } = format;

const logFormat = printf(info => {
  return `${info.timestamp} ${info.level} [${process.argv[1]}]: ${info.message}`;
});

module.exports = createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    logFormat,
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: '/var/log/rebalance-ethereum.log' })
  ],
  exceptionHandlers: [
    new transports.Console(),
    new transports.File({ filename: '/var/log/rebalance-ethereum.log' })
  ],
});
