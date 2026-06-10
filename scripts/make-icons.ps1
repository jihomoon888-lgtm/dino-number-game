# 알 모양 PWA 아이콘 생성 (System.Drawing 사용)
Add-Type -AssemblyName System.Drawing
foreach ($size in 192, 512) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.Clear([System.Drawing.Color]::FromArgb(255, 129, 199, 132))
  $w = $size * 0.62; $h = $size * 0.78
  $x = ($size - $w) / 2; $y = $size * 0.11
  $g.FillEllipse([System.Drawing.Brushes]::Ivory, $x, $y, $w, $h)
  $font = New-Object System.Drawing.Font('Arial', ($size * 0.22), [System.Drawing.FontStyle]::Bold)
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = 'Center'; $fmt.LineAlignment = 'Center'
  $rect = New-Object System.Drawing.RectangleF(0, ($size * 0.08), $size, $size)
  $g.DrawString('123', $font, [System.Drawing.Brushes]::Coral, $rect, $fmt)
  $g.Dispose()
  $bmp.Save("assets/icons/icon-$size.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}
Write-Output "아이콘 생성 완료"
