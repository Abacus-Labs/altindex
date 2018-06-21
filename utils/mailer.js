const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
         user: process.env.MAIL_USER,
         pass: process.env.MAIL_PASSWORD,
     },
 });

// Set this env variable accordingly, comma-separated, no space
const receivers = process.env.MAIL_RECEIVERS.split(',');

module.exports = (
  subject='(no subject provided)',
  html='<p>(no content)</p>',
) => {
  const opts = {
    from: process.env.MAIL_USER,
    to: receivers,
    subject,
    html,
  };

  transporter.sendMail(opts, function (err, info) {
    if (err) {
      logger.error(`Notification email sending failed - ${err}`);
      return;
    }

    logger.info(`Notification email sent to ${info.accepted.join(', ')}`);
  });
}
