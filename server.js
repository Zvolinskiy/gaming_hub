require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Ultra подключена'))
    .catch(err => console.error('❌ Ошибка MongoDB:', err.message));

const Content = mongoose.model('Content', new mongoose.Schema({
    type: { type: String, required: true },
    title: String,
    content: String,
    author: String,
    stars: { type: Number, default: 5 },
    createdAt: { type: Date, default: Date.now }
}));

const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true },
    password: { type: String },
    balance: { type: Number, default: 5000 },
    xp: { type: Number, default: 0 },
    inventory: { type: Array, default: [] }
}));

app.get('/api/top-players', async (req, res) => {
    try {
        const topPlayers = await User.find({}, 'username xp')
            .sort({ xp: -1 })
            .limit(10);
            
        res.json(topPlayers);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

app.post('/api/shop/buy', async (req, res) => {
    try {
        const { username, itemName, price } = req.body;
        const user = await User.findOne({ username });

        if (!user) return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        if (user.balance < price) return res.status(400).json({ success: false, error: 'Недостаточно ₸' });

        user.balance -= Number(price);
        user.xp += Math.floor(price / 100);
        user.inventory.push({ itemName, date: new Date() });
        
        await user.save();
        res.json({ success: true, newBalance: user.balance });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/wallet/topup', async (req, res) => {
    try {
        const { username, amount } = req.body;
        const user = await User.findOne({ username });
        if (user) {
            user.balance += Number(amount);
            await user.save();
            res.json({ success: true, newBalance: user.balance });
        } else {
            res.status(404).json({ success: false, error: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        let user = await User.findOne({ username });
        if (!user) {
            user = new User({ username, password });
            await user.save();
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/news', async (req, res) => {
    try {
        const news = await Content.find({ type: 'news' }).sort({ createdAt: -1 });
        res.json(news);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await Content.find({ type: 'review' }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/reviews', async (req, res) => {
    try {
        const { content, author, stars } = req.body;
        const newReview = new Content({ type: 'review', content, author, stars });
        await newReview.save();
        res.status(201).json(newReview);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/dashboard', async (req, res) => {
    const { username } = req.query;
    try {
        const user = await User.findOne({ username }) || { balance: 0, xp: 0, inventory: [] };
        const { data: profile } = await supabase
            .from('profiles')
            .select('rank')
            .eq('username', username)
            .maybeSingle();
        
        res.json({
            profile: { 
                username, 
                rank: profile?.rank || 'Silver I', 
                xp: user.xp 
            },
            wallet: user.balance,
            inventory: user.inventory
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', (req, res, next) => {
    if (req.method !== 'GET') {
        return res.status(404).json({ success: false, error: `API route ${req.originalUrl} not found` });
    }
    next();
});

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`---`);
    console.log(`🚀 GAMING HUB SERVER ONLINE`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`---`);
});