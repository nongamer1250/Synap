@echo off

:: Automatically detect and bind the latest JDK 21 or JDK 17 folder dynamically
for /d %%i in ("C:\Program Files\Java\jdk-21*") do (
    set "JAVA_HOME=%%i"
    set "PATH=%%i\bin;%PATH%"
)
if not defined JAVA_HOME (
    for /d %%i in ("C:\Program Files\Java\jdk-17*") do (
        set "JAVA_HOME=%%i"
        set "PATH=%%i\bin;%PATH%"
    )
)

echo ==============================================
echo   Synap Android Wrapper Compiler ^& Packager
echo ==============================================

if not exist android (
    echo [ERROR] Android directory not found! Run 'npx cap add android' first.
    exit /b 1
)

echo.
echo [1/3] Synchronizing web assets into native wrapper...
call npx cap sync
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Capacitor sync failed!
    exit /b 1
)
echo ✓ Assets synchronized successfully.

echo.
echo [2/3] Building native project via Gradle compiler...
cd android
call gradlew.bat assembleDebug
set GRADLE_RESULT=%ERRORLEVEL%
cd ..

if %GRADLE_RESULT% neq 0 (
    echo [ERROR] Gradle build compilation failed! Check JDK installation and logs.
    exit /b 1
)
echo ✓ Native build compiled successfully.

echo.
echo [3/3] Locating and copy-packaging the compiled APK...
set APK_PATH=android\app\build\outputs\apk\debug\app-debug.apk
set DESTINATION_APK=synap-android-debug.apk

if exist %APK_PATH% (
    copy /y %APK_PATH% %DESTINATION_APK% > nul
    echo.
    echo ==============================================
    echo   ✓ SUCCESS: Compilation Complete!
    echo   APK Location: .\%DESTINATION_APK%
    echo ==============================================
) else (
    echo [ERROR] Compiled APK file was not found at target: %APK_PATH%
    exit /b 1
)
