# scripts/create-cert.ps1
$cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=Satya Technologies, O=Satya BillFlow" -CertStoreLocation "Cert:\CurrentUser\My"
$password = ConvertTo-SecureString -String "BillFlow2026!" -Force -AsPlainText
If (!(Test-Path "build")) { New-Item -ItemType Directory -Path "build" }
Export-PfxCertificate -Cert $cert -FilePath "build\billflow-codesign.pfx" -Password $password
Write-Host "Code signing certificate created successfully at build\billflow-codesign.pfx"
