const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Milos Nenadic <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //   mailersend
      return 1;
      // return nodemailer.createTransport({
      //   host: 'smtp.mailersend.net',
      //   port: process.env.MAILERSEND_PORT,
      //   secure: false,
      //   auth: {
      //     user: process.env.MAILERSEND_USERNAME,
      //     pass: process.env.MAILERSEND_PASSWORD,
      //   }
      // })
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Send the actual email
  async send(template, subject) {
    // 1. render html email based on a pug template
    const emailHtml = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // 2. define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      emailHtml,
      text: htmlToText.convert(emailHtml),
    };
    console.log(mailOptions.from);

    // 3. create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours family');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token, valid for 10 minutes',
    );
  }
};
