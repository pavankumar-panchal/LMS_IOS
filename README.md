# Relyon LMS – iOS App

React Native CLI project, **iOS only** (no Expo, no Android).

## Requirements (macOS only)
- macOS 13+
- Xcode 15+
- Node.js 18+
- CocoaPods — `sudo gem install cocoapods`
- Ruby 3.x (via rbenv recommended)

## Setup on Mac

```bash
# 1. Copy/clone this project to your Mac
# 2. Install JS dependencies
npm install

# 3. Install iOS native pods
cd ios && pod install && cd ..

# 4. Start Metro bundler
npm start

# 5. Run on iOS Simulator (new terminal)
npm run ios
```

To run on a **physical iPhone**: open `ios/RelyonLMS.xcworkspace` in Xcode,
select your device, set your Apple Developer Team under Signing & Capabilities,
then press Run (▶).

## Project structure

```
mobile/
├── App.tsx              # Root component
├── index.js             # Entry point
├── ios/                 # Xcode / CocoaPods project
├── src/
│   ├── context/         # Auth + Theme providers
│   ├── lib/             # API client (axios), static data
│   ├── navigation/      # Drawer + bottom tabs + stack navigator
│   ├── screens/         # All screen components
│   └── components/      # Shared components
└── assets/              # Icons, images
```

## Key libraries installed

| Library | Purpose |
|---------|---------|
| `@react-navigation/native` + `drawer` + `bottom-tabs` + `native-stack` | Navigation |
| `react-native-gesture-handler` | Gesture support (required by drawer) |
| `react-native-reanimated` | Animations |
| `react-native-safe-area-context` | Safe area insets |
| `react-native-screens` | Native screen optimisation |
| `react-native-paper` | Material UI components |
| `@react-native-async-storage/async-storage` | Persistent auth storage |
| `axios` | HTTP API client |
| `react-native-vector-icons` | Icons |
