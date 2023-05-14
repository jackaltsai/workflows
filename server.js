const cfg = require('./config');

const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const bcrypt = require('bcrypt');
const passport = require("passport");
const initializePassport = require("./passport-config");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const mongoose = require('mongoose');
const { MongoClient, ServerApiVersion } = require('mongodb');

const url = "mongodb+srv://dbUser:passw0rd@cluster0.zdujr.mongodb.net/?retryWrites=true&w=majority";

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));
app.use(flash());

app.use(session({
    secret: cfg.secured_key,
    resave: false, // We wont resave the session variable if nothing is changed
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(methodOverride("_method"));


const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
)

async function main() {
    
    try {
        await client.connect();

        await listDatabases(client);
        
    } catch (error) {
        console.log(error);
    } finally {
        await client.close();
    }
    
};

main().catch(console.error);

async function listDatabases(client) {
    const databasesList = await client.db().admin().listDatabases();
    console.log("Databases:");
    databasesList.databases.forEach(db => {
        console.log(`- ${db.name}`);
    });
}

const Schema = mongoose.Schema;

const postSchma = new Schema({
    title: String,
    content: String,
    image: {
        data: Buffer,
        contentType: String,
    },
});

const Post = mongoose.model("postmodel", postSchma);

const userSchma = new Schema({
    name: String,
    email: String,
    message: String
});

const User = mongoose.model("usermodel", userSchma);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const users = [{
    id: '1680796175100',
    email: 'admin@xyz.com', // passw0rd
    password: '$2b$08$VuUOw1UmbQqijSi/yZ1tm.3Myd.pBW1Sz6eaAVt4ustXv/Vw6MpAe'
}];

// root route
app.get("/", async (req, res) => {
    
    try {
        await mongoose.connect(url);
        await client.connect();
        
        const blogPosts = await Post.find().sort({_id:-1}).limit(3);
        
        res.render("home", {
            posts: blogPosts
        });

    } catch (error) {
        console.log(error);
        res.status(500);
    } finally{
        await client.close();
    }

});

app.post("/", async (req, res) => {

    try {
        await mongoose.connect(uri);
        await client.connect();
        const user = new User({
            name: req.body.newName,
            email: req.body.newEmailAddress,
            message: req.body.newMessage
        });

        await client.db("posts").collection("usermodel").insertOne(user);
        user.save();
        res.status(200).redirect("/");

    } catch (error) {
        console.log(error);
        res.status(500);
    } finally {
        await client.close();
    }
});

app.get("/admin", async (req, res) => {
    res.render("login");
});

app.post("/login", checkNotAuthenticated, passport.authenticate("local", {
    successRedirect: "/compose",
    failureRedirect: "/admin",
    failureFlash: true
}))

// app.post("/register", async (req, res) => {

//     try {
//         const hashedPassword = await bcrypt.hash(req.body.password, 8);
//         users.push({
//             id: Date.now().toString(),
//             email: req.body.email,
//             password: hashedPassword
//         });
//         console.log(users);
//         res.render("/login");
//     } catch (error) {
//         console.log(error);
//         res.redirect("/register")
//     }
// });


app.get("/users", checkAuthenticated, async (req, res) => {

    try {
        await mongoose.connect(url);
        await client.connect();
        
        const userConnData = await User.find();
        console.log(userConnData);
        res.render("users", {
            users: userConnData
        });
    } catch (error) {
        console.log(error);
        res.status(500);
    } finally {
        await client.close();
    }
});

app.get("/compose", checkAuthenticated, function(req, res){
    res.render("compose");
});

app.post("/compose", checkAuthenticated, upload.single('image'), async (req, res) => {
    
    try {
        await mongoose.connect(url);
        await client.connect();
        const post = new Post({
            title: req.body.postTitle,
            content: req.body.postBody,
            image: {
                data: req.file.buffer,
                contentType: req.file.mimetype,
            },
        });
        
        await client.db("posts").collection("postmodels").insertOne(post);
        await post.save();
        res.status(200).redirect("/");
    } catch (error) {
        console.log(error);
        res.status(500);
    } finally {
        await client.close();
    }
});

app.get("/posts/:postId", async (req, res) => {
    
    try {
        await mongoose.connect(url);
        await client.connect();
        const blogPost = await Post.findById(req.params.postId);

        res.status(200).render("post", {
            title: blogPost.title,
            content: blogPost.content,
            image: blogPost.image
        });
    } catch (error) {
        console.log(error);
        res.status(500);
    } finally {
        await client.close();
    }
});

app.delete("/logout", (req, res) => {
    req.logout(req.user, err => {
        if (err) return next(err)
        res.redirect("/admin")
    })
})

function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next()
    }
    res.redirect("/admin")
}

function checkNotAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect("/admin")
    }
    next()
}


// english route
app.get("/en", function(req, res){
    res.render("englishHome");
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});