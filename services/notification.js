var admin = require("firebase-admin");

var serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://push-notifications-cc667.firebaseio.com"
});
const sendNotification = async (data) => {
    // let message = {
    //     notification: { ...notification },
    //     tokens: to,
    // }
    admin.messaging().sendMulticast(data)
        .then((response) => {
            // console.log(response)
        });
    // let message = {
    //     notification: { ...data },
    //     token: to[0],
    // }


    // admin.messaging().send(message)
    //     .then((response) => {
    //         console.log(response)
    //     });
}

module.exports = { sendNotification }