# ============================================================
# Synap — Automated Android APK Build Script
# Run this script using PowerShell: .\scripts\build-android.ps1
# ============================================================

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Synap Android Wrapper Compiler & Packager   " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# 1. Verification of Android setup
if (-not (Test-Path "android")) {
    Write-Host "[ERROR] Android directory not found! Run 'npx cap add android' first." -ForegroundColor Red
    Exit 1
}

# 2. Syncing Capacitor Web Assets
Write-Host ""
Write-Host "[1/3] Synchronizing web assets into native wrapper..." -ForegroundColor Yellow
npx cap sync
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Capacitor sync failed!" -ForegroundColor Red
    Exit 1
}
Write-Host "✓ Assets synchronized successfully." -ForegroundColor Green

# 3. Compiling Android Debug APK via Gradle
Write-Host ""
Write-Host "[2/3] Building native project via Gradle compiler..." -ForegroundColor Yellow
Set-Location android
cmd /c "gradlew.bat assembleDebug"
$GradleResult = $LASTEXITCODE
Set-Location ..

if ($GradleResult -ne 0) {
    Write-Host "[ERROR] Gradle build compilation failed! Check JDK installation and logs." -ForegroundColor Red
    Exit 1
}
Write-Host "✓ Native build compiled successfully." -ForegroundColor Green

# 4. Copying and verifying output file
Write-Host ""
Write-Host "[3/3] Locating and copy-packaging the compiled APK..." -ForegroundColor Yellow
$ApkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
$DestinationApk = "synap-android-debug.apk"

if (Test-Path $ApkPath) {
    Copy-Item $ApkPath $DestinationApk -Force
    Write-Host ""
    Write-Host "==============================================" -ForegroundColor Green
    Write-Host "  ✓ SUCCESS: Compilation Complete!           " -ForegroundColor Green
    Write-Host "  APK Location: .\$DestinationApk" -ForegroundColor Green
    Write-Host "==============================================" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Compiled APK file was not found at target: $ApkPath" -ForegroundColor Red
    Exit 1
}
