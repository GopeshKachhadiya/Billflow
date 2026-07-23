@echo off
echo Installing Satya BillFlow Code Signing Certificate to Trusted Root Store...
powershell -Command "Import-Certificate -FilePath 'build\billflow-codesign.pfx' -CertStoreLocation 'Cert:\LocalMachine\Root'"
echo Certificate installed successfully! Windows Defender SmartScreen will now trust Satya BillFlow binaries.
pause
