param(
  [string]$Port = "9400",
  [string]$Profile,
  [string]$Width = "430",
  [string]$Height = "900"
)
$exe = 'C:\Users\Admin\AppData\Local\ms-playwright\chromium-1234\chrome-win64\chrome.exe'
if (Test-Path $Profile) { Remove-Item -Recurse -Force $Profile }
$args = @(
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-software-rasterizer',
  '--no-first-run',
  '--mute-audio',
  '--hide-scrollbars',
  '--disable-dev-shm-usage',
  '--disable-background-networking',
  '--disable-extensions',
  '--disable-component-update',
  '--disable-breakpad',
  '--disable-features=Crashpad,MojoIpcz,VizDisplayCompositor',
  "--user-data-dir=`"$Profile`"",
  "--window-size=$Width,$Height",
  "--remote-debugging-port=$Port",
  '--remote-allow-origins=*',
  '--no-default-browser-check',
  'about:blank'
)
$p = Start-Process -FilePath $exe -ArgumentList $args -PassThru -WindowStyle Hidden
Write-Output ("CHILDPID=" + $p.Id)