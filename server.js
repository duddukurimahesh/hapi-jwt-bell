'use strict';

const Hapi = require('hapi');

const mongoose = require('mongoose');

const jwt = require('jsonwebtoken');

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 3000
});


mongoose.connect('mongodb://localhost/prumaheshDb');

//db  model

let Schema = mongoose.Schema;

let userSchema = new Schema({
    username: { type: String },
    password: { type: String },
    role: { type: String }
});


let User = mongoose.model('User', userSchema);



const plugins = [
    { register: require('hapi-auth-jwt2') }, {
        register: require('hapi-authorization'),
        options: {
            roles: ['ADMIN', 'USER', 'GUEST']
        }
    },
    { register: require('bell') },
    { register: require('hapi-auth-cookie') }
];

server.register(plugins, (err) => {

});


var validate = function(decoded, request, callback) {


    if (decoded.id) {

        User.findOne({ _id: decoded.id }, function(err, user) {

            if (!user) {
                return callback(null, false);
            } else {
                return callback(null, true, { role: user.role });
            }
        });

    } else {
        return callback(null, false);
    }
};

server.auth.strategy('jwt', 'jwt', {
    key: 'sdkjfglsjdg', // Never Share your secret key 
    validateFunc: validate, // validate function defined above 
    verifyOptions: { algorithms: ['HS256'] } // pick a strong algorithm 
});




// just change the strategy and credentials for different social login providers..
server.auth.strategy('facebook', 'bell', {
        provider: 'facebook',
        password: 'cookie_encryption_password_secure',
        clientId: '1334257603356426',
        clientSecret: '73dbd8910c3808f02d10f8ada3adf8bd',
        isSecure: false     
    });
server.auth.default('jwt');


// Add the route
server.route([{
    method: 'GET',
    path: '/hello',
    config: { auth: 'facebook' },
    handler: function(request, reply) {

        if(request.auth.credentials){
            //save the facebook details which are obtained from, req.auth.credentials
            //after saving user details to db, in the response callback, extract the ._id and username and create a jwt
            // send the jwt to the client and it automatically validates as we have already written validate function for jwt.
        }

            return reply ('awesome, it happend..!!');
    }
},  {
    method: 'POST',
    path: '/register',
    config: { auth: false },

    handler: function(request, reply) {

        //SAVE USER TO DB..

        let user = new User({
            username: request.payload.username,
            password: request.payload.password,
            role: request.payload.role


        });

        user.save(function(err, data) {
            if (data)
                console.log("user successfully saved..!")
            else
                console.log(err);

        })

        return reply('hello world');
    }
}, {
    method: '*',
    path: '/login',
    config: { auth: false },

    handler: function(request, reply) {

        User.findOne({ username: request.payload.username, password: request.payload.password }, function(err, user) {
            if (err) {
                console.log(err);
                return reply('LOGIN error');

            }
            if (user) {
                console.log(user);

                let obj = {
                    id: user._id,
                    username: user.username
                }

                let token = jwt.sign(obj, 'sdkjfglsjdg');

                return reply("login successfully")
                    .header("Authorization", token) // where token is the JWT 

            } else {
                return reply('no  user found');


            }

        });
    }
}, {
    method: 'GET',
    path: '/test',
    config: {
        plugins: {
            'hapiAuthorization': { roles: ['USER', 'ADMIN'] }
        }
    },
    handler: function(request, reply) {

        return reply('hello world3');
    }
}, {
    method: 'GET',
    path: '/r4',
    handler: function(request, reply) {

        return reply('hello world4');
    }
}]);

// Start the server
server.start((err) => {

    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});
