var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const hbs = require('handlebars');

//routes
var indexRoute = require('./routes/index');

//init app
var app=express();
app.use(logger('dev'));

app.set('views', path.join(__dirname,'views'));
app.engine('hbs', exphbs({
    // defaultLayout: 'index',
    extname: '.hbs'
}));
app.set('view engine', 'hbs');
hbs.registerHelper('if_eq', function(a, b, opts) {
    if(a == b)
        return opts.fn(this);
    else
        return opts.inverse(this);
});

//BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//set static folder
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRoute);

//set port
app.set('port', (process.env.PORT || 3000));

app.listen(app.get('port'), function(){
    console.log('server started on port: '+ app.get('port'));
  });