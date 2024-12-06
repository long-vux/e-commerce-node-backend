const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const MongoStore = require('connect-mongo');
const multer = require('multer');

// Import Routes
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const productRoutes = require("./routes/product");
const cartRoutes = require("./routes/cart");
const couponRoutes = require("./routes/coupon");
const userRoutes = require("./routes/user");
const orderRoutes = require("./routes/order");  

const session = require("express-session");
dotenv.config();
const app = express();
connectDB();

app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true,
}));

const upload = multer({ dest: 'uploads/' });

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

app.use(express.static('public'));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/product', productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupon", couponRoutes);
app.use("/api/order", orderRoutes);

const PORT = process.env.PORT || 5000;  

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
