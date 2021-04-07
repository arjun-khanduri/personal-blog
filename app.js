var express = require('express');
var app = express();
var methodOverride = require('method-override');
var expressSanitizer = require('express-sanitizer');
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var passportLocalMongoose = require('passport-local-mongoose');


var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/PersonalBlog', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(expressSanitizer());
app.use(passport.initialize());
app.use(passport.session());

var blogSchema = new mongoose.Schema({
    title: String,
    image: String,
    body: String,
    created: { type: Date, default: Date.now },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});

var userSchema = new mongoose.Schema({
    username: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

var Blog = mongoose.model('Blog', blogSchema);
var User = mongoose.model('User', userSchema);

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/blogs', function (req, res) {
    Blog.find({username: req.user.username}, function (err, blogs) {
        if (err)
            console.log('Error!');
        else
            res.render('index', { blogs: blogs, title: 'All Blogs' });
    })
});

app.get('/', function (req, res) {
    res.redirect('/login');
});

app.listen(4000, function (req, res) {
    console.log('Server is online on port 4000 now');
});

app.get('/blogs/new', function (req, res) {
    res.render('new', { title: 'New Blog' });
});

app.post('/blogs', function (req, res) {
    Blog.create(req.body.blog, function (err, newBlog) {
        if (err)
            res.render('new', { title: 'New Blog' });
        else
            res.redirect('/blogs');
    });
});

app.get('/blogs/:id', function (req, res) {
    Blog.findById(req.params.id, function (err, foundBlog) {
        if (err)
            res.redirect('/blogs');
        else
            res.render('show', { blog: foundBlog, title: foundBlog.title });
    });
});


app.get('/blogs/:id/edit', function (req, res) {
    Blog.findById(req.params.id, function (err, foundBlog) {
        if (err)
            res.redirect('/blogs');
        else
            res.render('edit', { blog: foundBlog, title: foundBlog.title });
    });
});


app.put('/blogs/:id', function (req, res) {
    Blog.findByIdAndUpdate(req.params.id, req.body.blog, function (err, updatedBlog) {
        if (err)
            res.redirect('/blogs');
        else
            res.redirect('/blogs/' + req.params.id);
    })
});


app.delete('/blogs/:id', function (req, res) {
    Blog.findByIdAndRemove(req.params.id, function (err) {
        if (err)
            res.redirect('/blogs');
        else
            res.redirect('/blogs');
    })
});

app.get('/login', (req, res) => {
    res.render('login', {
        title: 'Login'
    });
});

app.get('/register', (req, res) => {
    res.render('register', {
        title: 'Register'
    });
});

app.post('/register', (req, res) => {
    var newUser = new User({ username: req.body.username });
    User.register(newUser, req.body.password, (err, user) => {
        if (err) {
            res.redirect('/register');
        }
        else {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/blogs');
            });
        }
    });
});

app.post('/login', passport.authenticate('local',
    {
        successRedirect: '/blogs',
        failureRedirect: '/login'
    }), (req, res) => {
    }
);