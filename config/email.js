const nodemailer = require("nodemailer");
require("dotenv").config();

class Email {
  constructor(service, username, password) {
    this.username = username;
    this.password = password;
    this.service = service;
    this.createTransport(this.service, this.username, this.password);
  }

  createTransport(service, username, password) {
    this.transporter = nodemailer.createTransport({
      service,
      auth: {
        user: username,
        pass: password,
      },
    });
    return this.transporter;
  }

  getFrom() {
    return this.username;
  }

  async sendEmail(from, to, subject, message, html) {
    const options = {
      from: `${from.toString()} | VIMA <${this.username}>`,
      to,
      subject,
      text: message,
      html,
    };

    try {
      this.transporter.sendMail(options, async (error, info) => {
        if (error) return error;
        else info;
      });
    } catch (err) {
      // Implement logs
    }
  }
}

module.exports.EmailHandler = EmailHandler = new Email(
  process.env.EMAIL_SERVICE,
  process.env.EMAIL_USERNAME,
  process.env.EMAIL_PASSWORD
);
