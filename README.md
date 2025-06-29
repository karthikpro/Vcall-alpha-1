# 🎥 Warp Video Calling v2.0

A modern, secure, and feature-rich video calling application built with React and WebSocket technology. Now with Google Sign-in authentication, user management, admin panel, and enhanced video calling features.

## ✨ New Features in v2.0

### 🔐 Authentication & Authorization
- **Google Sign-in Integration**: Secure authentication via Google OAuth
- **Role-based Access Control**: Master users and Beta users with different permissions
- **User Management**: Admin panel for managing user access
- **Session Management**: Persistent login sessions with logout functionality

### 👨‍💼 Admin Panel (Master Users Only)
- **User Management**: Add/remove beta users and master users
- **System Statistics**: Real-time server monitoring and statistics
- **Debug & Monitoring**: System logs export and real-time health monitoring
- **Server Health**: Live status indicators for all system components

### 🎬 Enhanced Video Calling
- **Professional UI**: Modern gradient design with glassmorphic effects
- **Screen Sharing**: Share your screen with other participants
- **Recording**: Start/stop call recording (demo implementation)
- **Virtual Backgrounds**: Apply background filters (blur, office, nature)
- **Connection Quality**: Real-time connection quality indicators
- **Call Statistics**: Duration tracking and participant management
- **Enhanced Chat**: Improved messaging with user identification
- **Settings Panel**: In-call settings with debug information

### 🛠️ Technical Improvements
- **Enhanced Server**: Logging, monitoring, and authentication support
- **Real-time Monitoring**: Server statistics and health monitoring
- **Improved Error Handling**: Better error messages and user feedback
- **Responsive Design**: Mobile-optimized interface
- **Performance Optimizations**: Improved loading and rendering

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd WarpVideoCalling
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Copy `.env.example` to `.env` and update the values:
   ```env
   REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id-here
   REACT_APP_SERVER_URL=ws://localhost:8080
   REACT_APP_VERSION=2.0.0
   REACT_APP_APP_NAME=Warp Video Calling
   ```

4. **Start the development servers**
   ```bash
   # Start both client and server
   npm run dev
   
   # Or start them separately
   npm run server    # Start WebSocket server on port 8080
   npm start         # Start React app on port 3000
   ```

5. **Access the application**
   - Open http://localhost:3000 in your browser
   - Use the demo login options to test different user roles

## 🔑 User Roles & Access

### Master Users
- Full administrative access
- Can access admin panel
- Add/remove beta users
- View system logs and statistics
- Monitor server health

**Default Master Users:**
- admin@company.com
- master@company.com

### Beta Users
- Standard video calling access
- Can create and join rooms
- Chat functionality
- Basic settings access

**Default Beta Users:**
- beta1@company.com
- beta2@company.com
- tester@company.com

## 🎮 How to Use

### For Regular Users

1. **Sign In**
   - Click "Sign in with Google" (demo mode available)
   - Choose from demo login options for testing

2. **Start a Video Call**
   - Click "Start Video Call" from the landing page
   - Create a new room or join an existing one with a passkey

3. **During the Call**
   - Toggle video/audio with control buttons
   - Use screen sharing for presentations
   - Chat with other participants
   - Access settings for background effects
   - View participant list

### For Admin Users

1. **Access Admin Panel**
   - After signing in as a master user, click "Admin Panel"

2. **Manage Users**
   - Add new beta users or master users by email
   - Remove users (cannot remove the last master user)

3. **Monitor System**
   - View real-time server statistics
   - Check system health indicators
   - Export server logs for analysis
   - Monitor active sessions and rooms

## 🏗️ Architecture

### Client-Side (React)
- **Authentication Context**: Manages user state and permissions
- **Component Structure**: Modular components for each feature
- **Modern UI**: CSS-in-JS with gradient designs and animations
- **Real-time Updates**: WebSocket integration for live data

### Server-Side (Node.js + WebSocket)
- **WebSocket Server**: Real-time communication for video calls
- **Authentication**: User role validation and session management
- **Monitoring**: Statistics collection and health monitoring
- **Room Management**: Dynamic room creation and participant handling

### Key Technologies
- **Frontend**: React 18, CSS3, WebRTC API
- **Backend**: Node.js, WebSocket (ws library)
- **Authentication**: Google OAuth (configurable)
- **Real-time**: WebSocket for signaling and chat
- **Styling**: Modern CSS with glassmorphic design

## 📱 Features Overview

### Core Video Calling
- ✅ HD video and audio calls
- ✅ Multiple participants support
- ✅ Real-time chat messaging
- ✅ Screen sharing
- ✅ Recording capabilities
- ✅ Virtual backgrounds

### User Management
- ✅ Google Sign-in authentication
- ✅ Role-based access control
- ✅ Session persistence
- ✅ User profile management

### Admin Features
- ✅ User management interface
- ✅ Real-time server monitoring
- ✅ System health dashboard
- ✅ Log export functionality
- ✅ Statistics tracking

### Technical Features
- ✅ WebRTC peer-to-peer connections
- ✅ Custom STUN server implementation
- ✅ Responsive design
- ✅ Error handling and recovery
- ✅ Performance optimization

## 🔧 Configuration

### User Management
Edit `src/config/appConfig.js` to modify:
- Master user email addresses
- Beta user email addresses
- Feature flags
- Application settings

### Environment Variables
Configure `.env` for:
- Google OAuth client ID
- Server URL
- App branding
- Version information

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run server
```

### Docker (Optional)
```bash
docker build -t warp-video-calling .
docker run -p 3000:3000 -p 8080:8080 warp-video-calling
```

## 🔐 Security Features

- **Authentication**: Secure Google OAuth integration
- **Authorization**: Role-based access control
- **Session Management**: Secure session handling
- **Input Validation**: Server-side validation
- **Rate Limiting**: Connection and message rate limiting
- **Encryption**: WebRTC built-in encryption

## 📊 Monitoring & Analytics

### Server Statistics
- Connection counts and durations
- Room creation and usage
- Message exchange statistics
- Memory and performance metrics

### Health Monitoring
- WebSocket server status
- Video processing health
- Authentication service status
- Storage system monitoring

### Logging
- Structured logging with levels
- User activity tracking
- Error logging and reporting
- Export capabilities for analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs in the admin panel
3. Open an issue on GitHub

## 🔮 Roadmap

### Upcoming Features
- Real Google OAuth integration
- Database persistence
- Mobile app development
- Advanced recording features
- AI-powered features
- Enterprise SSO integration

---

**Warp Video Calling v2.0** - Secure, modern, and feature-rich video calling made simple.
