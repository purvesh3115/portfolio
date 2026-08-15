const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
}));

// Serve static files from the portfolio directory
app.use(express.static(__dirname));

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        message: 'Backend server is running',
        timestamp: new Date().toISOString()
    });
});

// Contact Form Submission Endpoint
app.post('/api/contact', [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email')
        .trim()
        .isEmail().withMessage('Valid email is required')
        .normalizeEmail(),
    body('subject')
        .trim()
        .notEmpty().withMessage('Subject is required')
        .isLength({ min: 3 }).withMessage('Subject must be at least 3 characters'),
    body('message')
        .trim()
        .notEmpty().withMessage('Message is required')
        .isLength({ min: 10 }).withMessage('Message must be at least 10 characters')
], async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        const { name, email, subject, message } = req.body;

        // Email to Portfolio Owner
        const ownerMailOptions = {
            from: process.env.EMAIL_FROM,
            to: process.env.EMAIL_USER,
            subject: `New Contact Form Submission: ${subject}`,
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>From:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <hr>
                <h3>Message:</h3>
                <p>${message.replace(/\n/g, '<br>')}</p>
                <hr>
                <p><small>Submitted at: ${new Date().toLocaleString()}</small></p>
            `
        };

        // Confirmation Email to User
        const userMailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: `Thank You for Contacting - ${process.env.EMAIL_USER || 'Purvesh Budhecha'}`,
            html: `
                <h2>Thank You for Your Message!</h2>
                <p>Hi ${name},</p>
                <p>We have received your message and will get back to you as soon as possible.</p>
                <hr>
                <h3>Your Message Details:</h3>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
                <hr>
                <p>Best regards,<br>Purvesh Budhecha</p>
            `
        };

        // Send both emails
        await Promise.all([
            transporter.sendMail(ownerMailOptions),
            transporter.sendMail(userMailOptions)
        ]);

        res.status(200).json({
            success: true,
            message: 'Your message has been sent successfully! We will get back to you soon.'
        });

    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending message. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get Project Data (Optional - for portfolio projects)
app.get('/api/projects', (req, res) => {
    const projects = [
        {
            id: 1,
            title: "Digital Signage Management System",
            description: "Designed a comprehensive digital signage platform with intuitive UI for content management.",
            tags: ["Figma", "Prototyping", "UI Design"],
            link: "https://behance.net/project/digital-signage"
        },
        {
            id: 2,
            title: "Food Order and Delivery App Redesign",
            description: "Redesigned mobile app interface focusing on improved user flow and accessibility.",
            tags: ["Mobile Design", "UX Research", "Adobe XD"],
            link: "https://behance.net/project/food-app"
        },
        {
            id: 3,
            title: "Bubble App Redesign",
            description: "Complete redesign of social messaging application with focus on modern UI patterns.",
            tags: ["App Redesign", "Figma", "UI/UX"],
            link: "https://behance.net/project/bubble-app"
        },
        {
            id: 4,
            title: "HRMS (Human Resource Management System)",
            description: "Designed enterprise HRMS platform with focus on user experience for both admin and employees.",
            tags: ["Enterprise Design", "Prototyping", "User Research"],
            link: "https://behance.net/project/hrms"
        }
    ];
    
    res.status(200).json({
        success: true,
        data: projects
    });
});

// Get Skills Data
app.get('/api/skills', (req, res) => {
    const skills = [
        { name: "Figma", level: 90 },
        { name: "Adobe XD", level: 85 },
        { name: "Prototyping", level: 88 },
        { name: "HTML/CSS", level: 80 },
        { name: "JavaScript", level: 75 },
        { name: "User Research", level: 82 }
    ];
    
    res.status(200).json({
        success: true,
        data: skills
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start Server
// If USE_HTTPS is set, create a self-signed HTTPS server on PORT (default 5000)
// and an HTTP server on PORT+1 that redirects to HTTPS. Otherwise, start plain HTTP.
const useHttps = process.env.USE_HTTPS === '1' || process.env.USE_HTTPS === 'true';
if (useHttps) {
    const https = require('https');
    let pems;
    try {
        // generate a temporary self-signed certificate at runtime
        const selfsigned = require('selfsigned');
        pems = selfsigned.generate(null, { days: 365 });
    } catch (e) {
        console.error('Please run `npm install selfsigned` to enable HTTPS support.');
        process.exit(1);
    }

    const HTTPS_PORT = PORT;
    const HTTP_PORT = Number(PORT) + 1;

    https.createServer({ key: pems.private, cert: pems.cert }, app).listen(HTTPS_PORT, () => {
        console.log(`\n🔒 HTTPS server running on https://localhost:${HTTPS_PORT}`);
        console.log(`📧 Email notifications enabled (${process.env.EMAIL_SERVICE})`);
        console.log(`🔗 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);
    });

    // simple HTTP server to redirect to HTTPS
    const http = require('http');
    http.createServer((req, res) => {
        const host = req.headers.host ? req.headers.host.split(':')[0] : 'localhost';
        res.writeHead(301, { Location: `https://${host}:${HTTPS_PORT}${req.url}` });
        res.end();
    }).listen(HTTP_PORT, () => {
        console.log(`➡️  HTTP redirector running on http://localhost:${HTTP_PORT} -> https://localhost:${HTTPS_PORT}`);
    });

} else {
    app.listen(PORT, () => {
        console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
        console.log(`📧 Email notifications enabled (${process.env.EMAIL_SERVICE})`);
        console.log(`🔗 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);
    });
}
