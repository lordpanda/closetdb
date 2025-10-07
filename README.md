# ClosetDB - Digital Closet Management System

A modern web application for managing your digital wardrobe with advanced image processing and organization features.

## 🚀 Features

- **Digital Wardrobe Management**: Organize and catalog your clothing items
- **Advanced Image Processing**: Support for stitched images and individual photos
- **Smart Categorization**: Organize by category, brand, size, and season
- **Measurement Tracking**: Track detailed measurements for each item
- **Material Composition**: Record fabric composition and care instructions
- **Search & Filter**: Find items quickly with advanced filtering
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Cloud Storage**: Images stored securely on Cloudflare R2

## 🛠️ Technology Stack

- **Backend**: Python Flask
- **Database**: Supabase (PostgreSQL)
- **Image Storage**: Cloudflare R2
- **Image Processing**: Python PIL (Pillow)
- **Authentication**: Google OAuth + Admin Password
- **Frontend**: Vanilla JavaScript, CSS3, HTML5
- **Fonts**: Custom Sequel font family

## 📋 Prerequisites

- Python 3.8+
- Node.js 18+ (for some dependencies)
- Supabase account
- Cloudflare R2 account
- Google OAuth credentials

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lordpanda/closetdb.git
   cd closetdb
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

5. **Run the application**
   ```bash
   python app.py
   ```

6. **Access the application**
   Open your browser and go to `http://localhost:5000`

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure the following:

- `FLASK_SECRET_KEY`: Strong secret key for Flask sessions
- `SUPABASE_URL` & `SUPABASE_KEY`: Your Supabase project credentials
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, etc.: Cloudflare R2 storage credentials
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
- `ADMIN_PASSWORD`: Admin access password

### Database Setup

The application uses Supabase. Make sure your database has the required tables:
- `items`: Main items table with all clothing information
- Required columns: `item_id`, `category`, `brand`, `images`, `measurements`, etc.

## 📱 Usage

### Adding Items
1. Navigate to the "Add" page
2. Choose between stitched image mode (single image split into sections) or individual images
3. Fill in item details: category, brand, size, measurements, materials
4. Upload images and submit

### Editing Items
1. View any item and click "Edit"
2. Modify any field including replacing images
3. Save changes

### Browsing & Filtering
- Use the "All" page to browse all items
- Apply filters by category, brand, size, season
- Search functionality available

## 🔒 Security

Please read [SECURITY.md](SECURITY.md) for security guidelines and best practices.

### Key Security Features:
- Environment variable protection
- Input validation and sanitization
- Secure image upload handling
- Authentication via Google OAuth
- CORS protection for image serving

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Sequel font family for typography
- Supabase for backend services
- Cloudflare R2 for image storage
- Flask community for the excellent framework

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Note**: This application is designed for personal use. Ensure you comply with all relevant privacy and data protection regulations when storing personal clothing information.