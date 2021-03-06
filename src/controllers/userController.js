/* eslint-disable no-underscore-dangle */
const bcrypt = require('bcrypt');
const _ = require('lodash');
const { signToken } = require('../middleware/authMiddleware');
const passport = require('../middleware/passportMiddleware');
const User = require('../models/user');

// Sign a user up
exports.signup = (req, res) => {
  const {
    password, name, email, phoneNo
  } = req.body;

  User.findOne({ $or: [{ phoneNo }, { email }] })
    .then((userFound) => {
      if (userFound) {
        res.status(409).json({
          error: 'Email or Phone No. already exists.'
        });
      } else {
        bcrypt.hash(password, 10).then((hash) => {
          const user = new User({
            name,
            email,
            phoneNo,
            password: hash
          });

          user.save().then((createdUser) => {
            // Generate a token for the user
            const token = signToken(createdUser);

            res.status(201).json({
              message: 'Registration successful!',
              token
            });
          }).catch((error) => {
            res.status(500).json({
              error
            });
          });
        });
      }
    })
    .catch((error) => res.status(500).json({
      error
    }));
};

// Login a user
exports.login = (req, res) => {
  User.findOne({ email: req.body.email }).then((user) => {
    if (!user) {
      res.status(404).json({
        error: 'No account with that email was found!'
      });
    } else {
      bcrypt.compare(req.body.password, user.password).then((valid) => {
        if (!valid) {
          return res.status(401).json({
            error: new Error('Incorrect password!')
          });
        }

        const token = signToken(user);

        return res.status(200).json({
          user: _.omit(user.toObject(), ['password', '__v', 'createdAt', 'modifiedAt']),
          token
        });
      }).catch((error) => {
        res.status(500).json({
          error
        });
      });
    }
  }).catch((error) => {
    res.status(500).json({
      error
    });
  });
};

exports.profile = (req, res) => {
  User.findById(req.params.id)
    .then((user) => {
      if (user) {
        return res.status(200).json({
          user
        });
      }

      return res.status(404).json({
        error: 'User not found.'
      });
    })
    .catch((error) => {
      res.status(500).json({
        error
      });
    });
};

// Edit a user's details
exports.edit = (req, res) => {
  const user = new User({
    _id: req.params.id,
    name: req.body.name,
    phoneNo: req.body.phoneNo,
    emergencyContact: {
      name: req.body.emergencyContact.name,
      phoneNo: req.body.emergencyContact.phoneNo
    }
  });

  User.updateOne({ _id: req.params.id }, user)
    .then(() => {
      res.status(201).json({
        message: 'Profile updated successfully!'
      });
    })
    .catch((error) => {
      res.status(400).json({
        error
      });
    });
};

// TODO: User - DELETE PROFILE

// Update a user's password
exports.changePassword = (req, res) => {
  bcrypt.hash(req.body.password, 10).then((hash) => {
    const user = new User({
      _id: req.params.id,
      password: hash
    });

    User.updateOne({ _id: req.params.id }, user)
      .then(() => {
        res.status(201).json({
          message: 'Password updated successfully!'
        });
      })
      .catch((error) => {
        res.status(400).json({
          error
        });
      });
  });
};

// Auth with Facebook
exports.facebookLogin = (req, res, next) => {
  passport.authenticate('facebook', { scope: ['email'] })(req, res);

  return next();
};

// Send success message when Facebook / Google login is successful
exports.socialLoginSuccess = (req, res) => {
  if (req.user) {
    const { user, cookies } = req;
    res.status(200)
      .cookie('jwt', signToken(user), {
        maxAge: 5400000,
        secure: true,
        sameSite: 'none'
      })
      .json({
        message: `${user.provider} authentication successful!`,
        success: true,
        user,
        cookies
      });
  }

  res.status(401).json({
    message: `User authentication through google or facebook failed.`,
    success: false
  });
};

// Send failed msg when Facebook login is unsuccessful
exports.facebookLoginFail = (req, res) => {
  res.status(401).json({
    message: 'Facebook authentication failed!',
    success: false
  });
};

// Auth with Google
exports.googleLogin = (req, res, next) => {
  passport.authenticate('google', {
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email']
  })(req, res);

  next();
};

// Send success message when Google login is successful
exports.googleLoginSuccess = (req, res) => {
  if (req.user) {
    const { user, cookies } = req;
    res.status(200)
      .cookie('jwt', signToken(req.user), {
        maxAge: 5400000,
        secure: true,
        sameSite: 'none'
      })
      .json({
        message: 'Google authentication successful!',
        success: true,
        user,
        cookies
      });
  }

  res.status(401).json({
    message: 'User not authenticated through facebook',
    success: false
  });
};

// Send failed msg when Google login is unsuccessful
exports.googleLoginFail = (req, res) => {
  res.status(401).json({
    message: 'Google authentication failed!',
    success: false
  });
};

exports.logout = (req, res) => {
  req.logout();
  res.status(200).clearCookie('jwt').json({
    message: 'Cookie cleared successfully!'
  });
};
