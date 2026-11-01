import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ROLES } from '../config/constants.js';

function generateTokens(user) {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
    garageId: user.garageId
  };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET || 'autonear_access_secret_super_secure_key_2026',
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h' }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'autonear_refresh_secret_super_secure_key_2026',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
}

export async function register(req, res, next) {
  try {
    const { name, email, password, role, phone, garageId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || ROLES.CUSTOMER,
      phone,
      garageId
    });

    const tokens = generateTokens(user);

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        garageId: user.garageId
      },
      ...tokens
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const tokens = generateTokens(user);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        garageId: user.garageId
      },
      ...tokens
    });
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req, res, next) {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token is required.' });
    }

    const secret = process.env.JWT_REFRESH_SECRET || 'autonear_refresh_secret_super_secure_key_2026';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    const tokens = generateTokens(user);
    res.json({ success: true, ...tokens });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Expired or invalid refresh token.' });
  }
}

export async function getMe(req, res) {
  res.json({
    success: true,
    user: req.user
  });
}

