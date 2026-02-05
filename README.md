# 🎙️ TalkBack Control

A professional-grade talkback communication system for recording studios and live performance environments. TalkBack Control provides a sleek, modern interface for managing audio communication between control rooms and musicians.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![React](https://img.shields.io/badge/React-19.2-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)

## ✨ Features

- **🎚️ Real-time Audio Control** - Adjust gain levels with smooth, responsive vertical sliders
- **🎤 Push-to-Talk Interface** - Large, tactile talk button with visual feedback
- **📊 Live Audio Metering** - Multi-channel VU meters with color-coded level indicators
- **👥 Multi-Musician Support** - Quick switching between different musicians/talkback channels
- **🔌 WebSocket Communication** - Low-latency real-time state synchronization
- **🖼️ Custom Branding** - Upload and display custom logos
- **🎨 Premium UI/UX** - Modern glassmorphism design with smooth animations
- **📱 Responsive Design** - Works seamlessly on desktop and tablet/smartphone devices on browser
- **🔐 Simple Authentication** - Basic auth system for configuration protection

## 🆕 Recent Features

- **🏠 Dashboard Homescreen** — New entry screen with glassmorphism design matching the app aesthetic; provides quick access to Talkback and FOH Assistant.
- **📞 FOH Assistant** — Separate FOH view that displays incoming FOH calls as large, dismissible call buttons (supports multiple simultaneous calls).
- **🔔 FOH Call Queue** — Musicians can trigger `FOH CALL` from their Talkback page; each call appears in a queue on FOH Assistant and can be dismissed individually by FOH or toggled off by the caller.
- **🌐 Cross-device Real-time Calls** — FOH calls are now broadcast over WebSocket (`FOH_CALL` / `FOH_DISMISS`) so calls appear across devices in real time.
- **🔗 Header Logo Shortcut** — App logo in the header is a clickable link back to the Dashboard.


## 🏗️ Architecture

TalkBack Control is built as a full-stack TypeScript application:

### Frontend
- **React 19** with TypeScript
- **Vite** for blazing-fast development
- **TailwindCSS 4** for modern styling
- **React Router** for navigation
- **WebSocket** client for real-time updates
- **Axios** for HTTP requests

### Backend
- **Express.js** server with TypeScript
- **WebSocket** server for real-time communication
- **Multer** for file uploads
- **CORS** enabled for cross-origin requests
- **JSON-based configuration** storage

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** (v7 or higher)
- **PowerShell** (for Windows development script)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Joao-R-Ferreira/talkback-control.git
   cd talkback-control
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

## 🎮 Usage

### Development Mode

#### Windows (PowerShell)
Run both frontend and backend simultaneously:
```powershell
.\start-dev.ps1
```

#### Manual Start
**Backend** (Terminal 1):
```bash
cd backend
npm run dev
```

**Frontend** (Terminal 2):
```bash
cd frontend
npm run dev
```

The application will be available at:
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001`

### Default Credentials
- **Username**: `Admin`
- **Password**: `Admin`

> ⚠️ **Security Note**: Change these credentials in production environments!

## 📁 Project Structure

```
talkback-control/
├── backend/
│   ├── src/
│   │   ├── server.ts          # Express server & API routes
│   │   ├── socket.ts          # WebSocket handling
│   │   └── config.ts          # Configuration management
│   ├── uploads/               # Uploaded images storage
│   └── config.json            # System configuration
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── MainControlPage.tsx    # Main talkback interface
│   │   │   └── SettingsPage.tsx       # Configuration panel
│   │   ├── context/
│   │   │   └── AppContext.tsx         # Global state management
│   │   ├── services/
│   │   │   ├── api.ts                 # HTTP API client
│   │   │   └── socket.ts              # WebSocket client
│   │   └── types.ts                   # TypeScript definitions
│   └── index.html
└── start-dev.ps1              # Development startup script
```

## 🔧 Configuration

Configuration is managed through the Settings page (`/settings`) and stored in `backend/config.json`:

```json
{
  "musicians": [
    {
      "id": "musician-1",
      "name": "Musician Name",
      "talkbackId": "talkback-1"
    }
  ],
  "talkbacks": [
    {
      "id": "talkback-1",
      "name": "TB1"
    }
  ],
  "logoPath": "/uploads/logo.png"
}
```

### Adding Musicians
1. Navigate to Settings
2. Click "Add Musician"
3. Enter name and assign talkback channel
4. Save configuration

### Adding Talkback Channels
1. Navigate to Settings
2. Click "Add Talkback"
3. Enter channel name
4. Save configuration

## 🎨 UI Features

### Main Control Page
- **Musician Selector**: Dropdown to switch between configured musicians
- **VU Meters**: Real-time audio level visualization for all talkback channels
- **Gain Control**: Vertical slider for precise gain adjustment (0-100%)
- **Talk Button**: Large push-to-talk button with active state indication
- **Connection Status**: Visual indicator for WebSocket connection state

### Dashboard
- **Entry Screen**: Clean, centered layout with app logo, title and two large buttons for `TALKBACK` and `FOH ASSISTANT`.
- **Same Design Language**: Uses `bg-zinc-950`, backdrop blur, gradients and shadows matching the main app look.

### FOH Assistant
- **Multi-call View**: Displays active calls as large circular buttons showing musician name and talkback label.
- **Dismissal Options**: FOH can dismiss individual calls, or the calling musician can cancel their own call from the Talkback page.

### Settings Page
- **Logo Upload**: Custom branding with image upload
- **Musician Management**: Add, edit, and remove musicians
- **Talkback Configuration**: Manage communication channels
- **Image Gallery**: View and delete uploaded images

## 🔌 API Endpoints

### Authentication
- `POST /api/login` - User authentication

### Configuration
- `GET /api/config` - Retrieve current configuration
- `POST /api/config` - Update configuration (requires auth)

### File Management
- `POST /api/upload` - Upload image files (requires auth)
- `GET /api/images` - List uploaded images (requires auth)
- `DELETE /api/images/:filename` - Delete image (requires auth)

### WebSocket Events
- `mute` - Toggle talk state for a talkback channel
- `gain` - Adjust gain level for a talkback channel
- `meter` - Receive real-time audio meter updates
- `talkbackState` - Receive talkback state updates

## 🛠️ Development

### Build for Production

**Frontend**:
```bash
cd frontend
npm run build
```

**Backend**:
```bash
cd backend
npm run build  # If build script is configured
```

### Linting
```bash
cd frontend
npm run lint
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies for professional audio environments
- Designed for low-latency, real-time communication
- Inspired by professional studio talkback systems

## 📧 Contact

João Ferreira - [@Joao-R-Ferreira](https://github.com/Joao-R-Ferreira)

Project Link: [https://github.com/Joao-R-Ferreira/talkback-control](https://github.com/Joao-R-Ferreira/talkback-control)

---

**Made with ❤️ for audio professionals**
