const User = require("../models/user");
const jwt = require('jsonwebtoken')
const multer = require("multer");
const crypto = require('crypto');
const config = require("../config");
const emailService = require('../services/email');
const stripe = require('stripe')('sk_test_51HtHI1Kfjrj38s81CtHDWuZTz86gateHAM0pJxCxBCtimadQq51aETMuLTJhHdX8E3HHH3dIbW7BLcr1Ea7u1tSK00ynAfbx4X');
// const notificationService = require('../services/notification');

const register = async (req, res) => {
    const { email, verificationCode } = req.body;
    let user = await User.findOneByEmail(email);
    if (user) {
        // user does not exist
        res.status(200).json({ status: 'failed', msg: 'The email has already been used' });
        return;
    } else {
        try {
            const url = req.protocol + "://" + req.get("host");
            user = await User.create({
                name: req.body.name,
                email: req.body.email.toLowerCase(),
                password: req.body.password,
                state: req.body.state,
                city: req.body.city,
                age: req.body.age,
                gender: req.body.gender,
                verified: false,
            });

            if (user) {
                // res.status(200).json("Registered Successfully");

                jwt.sign(
                    {
                        _id: user._id,
                        email: user.email.toLowerCase(),
                    },
                    config.secret,
                    {
                        // expiresIn: '365d',
                        issuer: 'ineedabeam.com',
                        subject: 'UserInformation'
                    }, async (err, token) => {
                        if (err)
                            res.status(403).json("Registration failed");
                        else {
                            try {
                                emailService.sendVerificationEmail(user.email.toLowerCase(), verificationCode)
                            } catch (err) {
                                console.log('error: ', err)
                            }

                            let resData = {
                                _id: user._id,
                                name: user.name,
                                email: user.email.toLowerCase(),
                                state: user.state,
                                city: user.city,
                                age: user.age,
                                gender: user.gender,
                                verified: false,
                                token: token
                            }
                            res.status(200).send({
                                status: 'success',
                                data: resData,
                                message: "Registered Successfully",
                            });
                        }
                    })
            }
            else {
                res.status(403).json("Registration failed");
            }

        } catch (error) {
            res.status(400).send(error);
        }
    }
}

const login = async (req, res) => {
    const { email, password, fcmToken } = req.body
    console.log('login: ', email, password, fcmToken)
    const check = (user) => {
        if (!user) {
            // user does not exist
            res.status(200).json({ status: 'failed', msg: 'Can not find user with the email' });
            throw new Error('Can not find user with the email')
            // return
            // throw new Error({ msg: 'Can not find user with the email' })
        } else {
            // user exists, check the password
            if (user.verify(password)) {
                // create a promise that generates jwt asynchronously
                const p = new Promise((resolve, reject) => {
                    jwt.sign(
                        {
                            _id: user._id,
                            email: user.email.toLowerCase(),
                        },
                        config.secret,
                        {
                            // expiresIn: '365d',
                            issuer: 'ineedabeam.com',
                            subject: 'UserInformation'
                        }, async (err, token) => {
                            if (err) reject(err)
                            if (fcmToken && fcmToken != 'undefined') {
                                let fcmTokens = user.fcmTokens ? user.fcmTokens : [];
                                let flag = true;
                                for (let i = 0; i < fcmTokens.length; i++) {
                                    let item = fcmTokens[i]
                                    if (item == fcmToken) {
                                        flag = false;
                                        break;
                                    }
                                }
                                if (flag) {
                                    fcmTokens.push(fcmToken);
                                    await User.findOneAndUpdate({ _id: user._id }, { fcmTokens: fcmTokens })
                                }
                            }
                            let res = {
                                _id: user._id,
                                email: user.email.toLowerCase(),
                                address: user.address,
                                name: user.name,
                                imagePath: user.imagePath,
                                state: user.state,
                                city: user.city,
                                age: user.age,
                                gender: user.gender,
                                quiz: user.quiz,
                                assessment: user.assessment,
                                expireDate: user.gender,
                                phoneNumber: user.phoneNumber,
                                verified: user.verified ? true : false,
                                token: token
                            }
                            resolve(res)
                        })
                })
                return p
            } else {
                res.status(200).json({ status: 'failed', msg: 'Wrong password' });
                // return;
                throw new Error({ msg: 'Wrong password' })
            }
        }
    }

    // respond the token 
    const respond = (data) => {
        res.json({
            message: 'logged in successfully',
            status: 'success',
            data: data
        })
    }
    // error occured
    const onError = (error) => {
        console.log(error);
        // res.status(200).json({
        //     message: error,
        //     status: 'failed'
        // })
    }
    // find the user
    User.findOneByEmail(email.toLowerCase())
        .then(check)
        .then(respond)
        .catch(onError)
}

const validateToken = async (req, res) => {
    const { token, fcmToken } = req.body
    let user = jwt.decode(token, config.secret);
    if (!user) {
        res.status(401).json({ status: 'failed', message: 'You are not authorized' })
    } else {
        let userData = await User.findById(user._id);

        if (fcmToken && fcmToken != 'undefined') {
            let fcmTokens = userData.fcmTokens ? userData.fcmTokens : [];
            let flag = true;
            for (let i = 0; i < fcmTokens.length; i++) {
                let item = fcmTokens[i]
                if (item == fcmToken) {
                    flag = false;
                    break;
                }
            }
            if (flag) {
                fcmTokens.push(fcmToken);
                await User.findOneAndUpdate({ _id: user._id }, { fcmTokens: fcmTokens })
            }
        }

        if (userData) {

            let resData = {
                _id: userData._id,
                email: userData.email.toLowerCase(),
                address: userData.address,
                name: userData.name,
                imagePath: userData.imagePath,
                state: userData.state,
                city: userData.city,
                age: userData.age,
                gender: userData.gender,
                quiz: userData.quiz,
                assessment: userData.assessment,
                expireDate: userData.gender,
                phoneNumber: userData.phoneNumber,
                verified: userData.verified ? true : false,
                token: token
            }
            // let resData = {
            //     _id: user._id,
            //     email: userData._doc.email.toLowerCase(),
            //     address: userData._doc.address,
            //     name: userData._doc.name,
            //     postCode: userData._doc.postCode,
            //     imagePath: userData._doc.imagePath,
            //     role: userData._doc.role,
            //     phoneNumber: userData._doc.phoneNumber,
            //     verified: userData._doc.verified ? true : false,
            //     token: token
            // }
            res.status(200).json({ data: resData, status: 'success' });
        }
        else {
            res.status(200).json({ status: 'failed', message: 'You are not authorized' })
        }
    }
}

const logout = async (req, res) => {
    const { token, fcmToken } = req.body
    console.log('logout: ', req)
    let user = jwt.decode(token, config.secret);
    if (!user) {
        res.status(200).json({ status: 'failed', message: 'You are not authorized' })
    } else {
        let userData = await User.findById(user._id);

        if (userData) {
            let fcmTokens = userData.fcmTokens ? userData.fcmTokens : [];
            console.log('fcmTokens: ', fcmTokens)
            if (!fcmTokens || fcmTokens.length == 0) {
                res.status(200).json({ status: 'success' });
            } else {
                let newFcmTokens = [];
                for (let i = 0; i < fcmTokens.length; i++) {
                    let item = fcmTokens[i]
                    if (item.token != fcmToken) {
                        newFcmTokens.push(item)
                    }
                }
                await User.findOneAndUpdate({ _id: user._id }, { fcmTokens: newFcmTokens })
                res.status(200).json({ status: 'success' });
            }
        }
        else {
            res.status(200).json({ status: 'success', message: 'You are not authorized' })
        }
    }
}
const verifyEmail = async (req, res) => {
    const { token } = req.body;
    let user = jwt.decode(token, config.secret);
    if (!user) {
        res.status(401).json({ status: 'failed' });
    } else {
        let userData = await User.findByIdAndUpdate(user._id, { verified: true }, { new: true });
        let to = [];
        let admins = await User.find({ role: 'admin' });
        for (let i = 0; i < admins.length; i++) {
            let admin = admins[i];
            let fcmTokens = admin.fcmTokens;
            if (!fcmTokens || fcmTokens == 'undefined')
                continue;
            for (let j = 0; j < fcmTokens.length; j++) {
                let item = fcmTokens[j];
                if (item.token && item.token != 'null')
                    to.push(item.token);
            }
        }
        let data = {
            tokens: to,
            notification: {
                title: 'New customer registered',
                body: `${userData.name} (${userData.email})`
            },
            webpush: {
                headers: {
                    Urgency: "high"
                },
                notification: {
                    icon: 'https://myonlinebeam.com/assets/images/logo.png',
                    click_action: '/#/users'
                }
            },
        }
        // console.log('to: ', to);
        if (to && to.length > 0)
            notificationService.sendNotification(data)
        res.status(200).json({ status: 'success' });
    }
};
const resetPassword = async (req, res) => {
    const { email, password } = req.body;
    let user = await User.findOne({ email: email })
    if (!user) {
        res.status(404).json({ status: 'failed' })
    } else {
        const encrypted = crypto.createHmac('sha1', config.secret)
            .update(password)
            .digest('base64');
        await User.findOneAndUpdate({ email: email }, { password: encrypted }, { upsert: true })
        res.status(200).json({ status: 'success' })
    }
};
const sendCode = async (req, res) => {
    const { email, verificationCode } = req.body;
    let user = await User.findOne({ email: email });
    if (!user) {
        res.status(200).json({ status: 'failed', msg: 'User not found' });
        return;
    }
    try {
        await emailService.sendVerificationEmail(user.email.toLowerCase(), verificationCode);
        res.status(200).json({ status: 'success' })
    } catch (err) {
        res.status(403).json({ status: 'failed' })
    }
};

const updateUserMembership = async (req, res) => {
    try {
        let tokenStr = req.header('authorization');
        let jwtToken = tokenStr.split(' ')[1];
        let user = jwt.decode(jwtToken, config.secret);
        let userData = await User.findById(user._id);
        if (userData) {
            let amount = 0;
            switch (req.body.membership) {
                case 'basic':
                    amount = 39.99 * 1;
                    break;
                case 'plus':
                    amount = 29.99 * 3;
                    break;
                case 'pro':
                    amount = 21.99 * 6;
                    break;
                default:
                    amount = 39.99 * 1;
                    break;
            }
            stripe.charges.create({
                amount: amount * 100,
                currency: 'usd',
                source: req.body.tokenId
            }).then(async charge => {
                let expireDate;
                if (userData.expireDate && userData.expireDate != 'undefined') {
                    expireDate = new Date(userData.expireDate)
                } else {
                    expireDate = new Date();
                }
                switch (req.body.membership) {
                    case 'basic':
                        expireDate = new Date(expireDate.setMonth(expireDate.getMonth() + 1));
                        break;
                    case 'plus':
                        expireDate = new Date(expireDate.setMonth(expireDate.getMonth() + 3));
                        break;
                    case 'pro':
                        expireDate = new Date(expireDate.setMonth(expireDate.getMonth() + 6));
                        break;
                    default:
                        expireDate = new Date(expireDate.setMonth(expireDate.getMonth() + 1));
                        break;
                }
                const user_update = new User({
                    _id: user._id,
                    expireDate: expireDate.toString()
                })
                const updatedUser = await User.findByIdAndUpdate(user._id, user_update, { new: true });
                if (updatedUser) {
                    res.status(200).json({ status: 'success', data: { expireDate: expireDate }, msg: 'Your membership has been updated successfully' })
                } else {
                    res.status(200).json({ status: 'failed', msg: 'Server error' });
                }
            }).catch(error => {
                console.log('failed: ', error);
                res.status(200).json({ status: 'failed', msg: 'Payment has been failed' });
            })
        } else {
            res.status(200).json({ status: 'failed', msg: 'You are not authorized' });
        }
    } catch (error) {
        console.log(error)
        res.status(400).json(error);
    }
}
const updateUser = async (req, res) => {
    try {
        let tokenStr = req.header('authorization');
        let jwtToken = tokenStr.split(' ')[1];
        let user = jwt.decode(jwtToken, config.secret);
        let userData = await User.findById(user._id);

        if (userData) {
            const url = req.protocol + "://" + req.get("host");
            if (req.body.email) {
                let existingUser = await User.findOne({ email: req.body.email.toLowerCase() });
                if (existingUser && existingUser._id != user._id) {
                    res.status(200).json({ status: 'failed', msg: 'Can\'t change email to another user\'s email' });
                    return;
                }
            }
            const user_update = new User({
                _id: user._id,
                ...req.body.name && req.body.name != "undefined" && { name: req.body.name },
                ...req.body.email && req.body.email != "undefined" && { email: req.body.email.toLowerCase() },
                ...req.body.state && req.body.state != "undefined" && { state: req.body.state },
                ...req.body.city && req.body.city != "undefined" && { city: req.body.city },
                ...req.body.gender && req.body.gender != "undefined" && { gender: req.body.gender },
                ...req.body.age && req.body.age != "undefined" && { age: req.body.age },
                ...req.body.quiz && req.body.quiz != "undefined" && { quiz: JSON.parse(req.body.quiz) },
                ...req.body.assessment && req.body.assessment != "undefined" && { assessment: JSON.parse(req.body.assessment) },
                ...req.file && req.file.location && {
                    imagePath: req.file.location
                },
            })
            const updatedUser = await User.findByIdAndUpdate(user._id, user_update, { new: true });
            if (!updatedUser) {
                res.status(200).json({ status: "failed" });
            } else {
                let resData = {
                    _id: user._id,
                    email: updatedUser.email.toLowerCase(),
                    address: updatedUser.address,
                    name: updatedUser.name,
                    imagePath: updatedUser.imagePath,
                    state: updatedUser.state,
                    city: updatedUser.city,
                    age: updatedUser.age,
                    gender: updatedUser.gender,
                    quiz: updatedUser.quiz,
                    assessment: updatedUser.assessment,
                    expireDate: updatedUser.expireDate,
                    phoneNumber: updatedUser.phoneNumber,
                    verified: updatedUser.verified ? true : false,
                    token: jwtToken
                }
                res.status(200).json({ status: 'success', data: resData });
            }
        } else {
            res.status(401).json({ status: 'failed', msg: 'You are not authorized' });
        }
    } catch (error) {
        console.log(error)
        res.status(400).json(error);
    }
}
module.exports = { register, login, logout, verifyEmail, sendCode, resetPassword, validateToken, updateUser, updateUserMembership };