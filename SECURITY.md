# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within this project, please send an email to the maintainers. All security vulnerabilities will be promptly addressed.

### What to include in your report:

- A description of the vulnerability
- Steps to reproduce the issue  
- Potential impact of the vulnerability
- Any suggested fixes (optional)

### Security measures implemented:

1. **Environment Variables**: All sensitive data (API keys, passwords) are stored in environment variables
2. **Input Validation**: All user inputs are validated and sanitized
3. **Authentication**: Google OAuth and admin password authentication
4. **File Upload Security**: Image uploads are processed and validated
5. **CORS Protection**: Proper CORS headers for image serving
6. **Dependency Management**: Regular updates to dependencies

### For Developers:

1. Never commit `.env` files or any files containing secrets
2. Use the provided `.env.example` as a template
3. Regularly update dependencies using `pip install -r requirements.txt --upgrade`
4. Follow secure coding practices
5. Validate all user inputs
6. Use HTTPS in production

## Environment Variables Security

Make sure to set the following environment variables securely:

- `FLASK_SECRET_KEY`: Generate a strong, random secret key
- `ADMIN_PASSWORD`: Use a strong password
- `SUPABASE_KEY`: Keep your Supabase keys secure
- `R2_SECRET_ACCESS_KEY`: Protect your Cloudflare R2 credentials
- `GOOGLE_CLIENT_SECRET`: Secure your OAuth credentials

## Production Deployment

For production deployment:

1. Set `FLASK_DEBUG=False`
2. Set `FLASK_ENV=production`
3. Use strong, unique passwords and keys
4. Enable HTTPS
5. Regularly rotate API keys and passwords
6. Monitor logs for suspicious activity