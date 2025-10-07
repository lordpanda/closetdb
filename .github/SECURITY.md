# Security Policy

## Reporting Security Vulnerabilities

We take security vulnerabilities seriously. If you discover a security vulnerability, please report it to us privately.

### How to Report

1. **Do not** open a public GitHub issue for security vulnerabilities
2. Send an email to the repository maintainers
3. Include detailed information about the vulnerability
4. We will respond within 48 hours

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Security Measures

This project implements several security measures:

- Environment variable protection
- Input validation and sanitization  
- Secure session management
- HTTPS enforcement in production
- Security headers (XSS, CSRF, etc.)
- File upload validation and size limits
- Regular dependency updates

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| < 2.0   | :x:                |