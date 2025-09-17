require('dotenv').config()
const jwt = require('jsonwebtoken')
const express = require('express')
const path = require('path')
const bcrypt = require('bcrypt')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')
const db = require('better-sqlite3')('myApp.db')
const validateInputs = require('./validateInputs')
db.pragma('journal_mode = WAL')
const app = express()

// DB setup //
const createTables = db.transaction(() => {
db.prepare(`
CREATE TABLE IF NOT EXISTS users (
id INTEGER PRIMARY KEY AUTOINCREMENT,
username TEXT NOT NULL UNIQUE,
password TEXT NOT NULL,
role TEXT NOT NULL,
created_at TEXT NOT NULL
)
`).run()

db.prepare(`
CREATE TABLE IF NOT EXISTS admin (
id INTEGER PRIMARY KEY AUTOINCREMENT,
username TEXT NOT NULL UNIQUE,
password TEXT NOT NULL,
role TEXT NOT NULL
)
`).run()

const user = 'Administrator'
const pass = 'AdministratorSuperSecretPassword'
const role = 'admin'
const check = db.prepare('SELECT 1 FROM admin WHERE username = ?').get(user)

if (!check) {
db.prepare(`INSERT INTO admin (username, password, role) VALUES (?, ?, ?)`).run(user, pass, role)
}

})

createTables()
// DB setup //

// Middleware //

const limiter = rateLimit({
windowMs: 1 * 60 * 1000,
max: 20,
message: "Something went wrong."
})

app.set('view engine','ejs')
app.set('trust proxy', 1)
app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))
app.use(validateInputs)
app.use(cookieParser())
app.use(limiter)

app.use((req, res, next) => {
const bannedIPs = ['5.156.64.57']

if (bannedIPs.includes(req.ip)) {
return res.status(403).send("Forbidden")
}

next()
})

app.use((err, req, res, next) => {

if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
return res.status(400).json({ error: 'Invalid JSON' })
}

next(err)
})

app.use((req, res, next) => {
console.log(`Request from ${req.ip}: ${req.method} ${req.url}`)
next()
})

app.use((req, res, next) => {
try {

const cookie = req.cookies.token
const verify = jwt.verify(cookie, process.env.JWTSECRET)
req.user = verify

} catch(err) {
req.user = false
}

res.locals.user = req.user
next()
})
// Middleware //

// Functions //
function isUserLoggedIn(req, res, next) {

if (req.user) {
return next()
}

res.redirect('/')
}

function isAdmin(req, res, next) {

if (req.user.role === 'admin') {
return next()
}

res.redirect('/')
}
// Functions //

// routes //
app.get('/', (req, res) => {
res.render('index')
})

app.get('/login', (req, res) => {
res.render('login')
})

app.get('/signup', (req, res) => {
res.render('signup')
})

app.get('/cart', isUserLoggedIn, (req, res) => {
res.render('cart')
})

app.get('/dashboard', isUserLoggedIn, (req, res) => {

const usersStatement = db.prepare('SELECT * FROM users WHERE username = ?')
const users = usersStatement.get(req.user.username)

res.render('dashboard', { users })
})

app.get('/products', isUserLoggedIn, (req, res) => {
res.render('products')
})

app.get('/admin', (req, res) => {
res.redirect('/admin/login')
})

app.get('/admin/login', (req, res) => {
res.render('admin/login')
})

app.get('/admin/dashboard', isAdmin, (req, res) => {

const usersStatement = db.prepare('SELECT * FROM users')
const users = usersStatement.all()

res.render('admin/dashboard', { users })
})

app.post('/signup', async (req, res) => {

try {
const { username, password } = req.body

if (typeof username !== 'string') username = ''
if (typeof password !== 'string') password = ''

if (!username || !password) {
return res.status(400).json({ error: 'You cannot leave it empty' })
}

if (username && !username.match(/^[A-Za-z0-9]+$/)) {
return res.status(400).json({ error: 'Invalid username or password' })
}

const checkStatement = db.prepare('SELECT * FROM users WHERE username = ?')
const check = checkStatement.get(username)

if (check) {
return res.status(400).json({ error: 'Invalid username or password' })
}

const salt = await bcrypt.genSaltSync(10)
const hashed = await bcrypt.hashSync(password, salt)
const createdAt = new Date().toISOString().split('T')[0];

const insertStatement = db.prepare('INSERT INTO users (username, password, role, created_at) VALUES (?, ?, ?, ?)')
const insert = insertStatement.run(username, hashed, 'user', createdAt)

res.status(201).json({ message: 'User created successfully' })

} catch(err) {
return res.status(500).json({ error: 'Internal Server Error' })
}

})

app.post('/login', async (req, res) => {

try {
const { username, password } = req.body

if (typeof username !== 'string') username = ''
if (typeof password !== 'string') password = ''

if (!username || !password) {
return res.status(400).json({ error: 'You cannot leave it empty' })
}

if (username && !username.match(/^[A-Za-z0-9]+$/)) {
return res.status(400).json({ error: 'Invalid username or password' })
}

const checkStatement = db.prepare('SELECT * FROM users WHERE username = ?')
const check = checkStatement.get(username)

if (!check) {
return res.status(400).json({ error: 'Invalid username or password' })
}

const hashed = await bcrypt.compareSync(password, check.password)

if (!hashed) {
return res.status(400).json({ error: 'Invalid username or password' })
}

const jwtToken = jwt.sign({ id: check.id, username: check.username, role: check.role}, process.env.JWTSECRET, {expiresIn: '24h'})
res.cookie('token', jwtToken, {
httpOnly: true,
sameSite: 'strict',
maxAge: 1000 * 60 * 60 * 24
})

res.status(200).json({ message: 'User login successfully', user_details: { id: check.id, username: check.username, role: check.role }, token: jwtToken })

} catch {
return res.status(500).json({ error: 'Internal Server Error' })
}

})

app.post('/admin/login', async (req, res) => {

try {
const { username, password } = req.body

if (typeof username !== 'string') username = ''
if (typeof password !== 'string') password = ''

if (!username || !password) {
return res.status(400).json({ error: 'You cannot leave it empty' })
}

const names = ['union', 'select', 'insert', 'update', 'delete', 'drop', 'alter', 'create', 'replace', 'exec', 'pragma', 'attach', 'detach', '--', '#', ';']

if (username) {
const loweruser = username.toLowerCase()
const notAllowed = names.some(keywords => loweruser.includes(keywords))

if (notAllowed) {
return res.status(400).json({ error: 'Username contains forbidden words!' })
}

}

const adminStatement = db.prepare(`SELECT * FROM admin WHERE username = '${username}' AND password = '${password}'`)
const admin = adminStatement.get()

if (!admin) {
return res.status(400).json({ error: 'Invalid username or password' })
}

const jwtToken = jwt.sign({ id: admin.id, username: admin.username, role: admin.role}, process.env.JWTSECRET, {expiresIn: '24h'})
res.cookie('token', jwtToken, {
httpOnly: true,
sameSite: 'strict',
maxAge: 1000 * 60 * 60 * 24
})

res.status(200).json({ message: 'Admin login successfully', admin_details: { id: admin.id, username: admin.username, role: admin.role}, token: jwtToken })

} catch(err) {
return res.status(500).json({ error: 'Internal Server Error' })
}

})

// routes //

app.listen(3000)
