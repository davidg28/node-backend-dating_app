const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('');

const sendVerificationEmail = async (email, code) => {

    let from = '';
    // name = 'Damian Jablonski' //user.firstName + ' ' + user.lastName;

    let subject = `Verify your email`;
    let html = `Your verification code is ${code}`;
    let msg = {
        from: from,
        to: {
            email: email,
            // name: name
        },
        subject: subject,
        html: html,
    };

    try {
        await sgMail.send(msg);
        // console.log('success');
    }
    catch (err) {
        // console.error('Error', err.response.body);
    }
}

module.exports = { sendVerificationEmail }