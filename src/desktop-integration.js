const fs = require('fs');
const path = require('path');
const os = require('os');

function createDesktopEntry(appPath) {
    const desktopEntry = `[Desktop Entry]
    Name=Fastmail
    Comment=Fastmail Email Client
    Exec=${appPath} %U
    Icon=fastmail-electron
    Type=Application
    Categories=Network;Email;
    MimeType=x-scheme-handler/mailto;
    StartupNotify=true
    StartupWMClass=fastmail-electron
    `;

    const desktopDir = path.join(os.homedir(), '.local', 'share', 'applications');
    const desktopFile = path.join(desktopDir, 'fastmail-electron.desktop');

    // Ensure directory exists
    if (!fs.existsSync(desktopDir)) {
        fs.mkdirSync(desktopDir, { recursive: true });
    }

    // Write desktop file
    fs.writeFileSync(desktopFile, desktopEntry);

    // Make executable
    fs.chmodSync(desktopFile, '755');

    console.log('Desktop entry created:', desktopFile);
}

function installIcon(iconPath) {
    const iconDir = path.join(os.homedir(), '.local', 'share', 'icons');
    const targetIcon = path.join(iconDir, 'fastmail-electron.png');

    // Ensure directory exists
    if (!fs.existsSync(iconDir)) {
        fs.mkdirSync(iconDir, { recursive: true });
    }

    // Copy icon
    if (fs.existsSync(iconPath)) {
        fs.copyFileSync(iconPath, targetIcon);
        console.log('Icon installed:', targetIcon);
    }
}

module.exports = { createDesktopEntry, installIcon };
