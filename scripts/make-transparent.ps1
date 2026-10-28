Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\Suraj\Desktop\crunchybag\public\tihar_banana_tree.jpg"
$destPath = "c:\Users\Suraj\Desktop\crunchybag\public\tihar_banana_tree.png"

$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$newBmp = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($newBmp)
$graphics.DrawImage($bmp, 0, 0, $bmp.Width, $bmp.Height)
$bmp.Dispose()
$graphics.Dispose()

$rect = New-Object System.Drawing.Rectangle(0, 0, $newBmp.Width, $newBmp.Height)
$bmpData = $newBmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$ptr = $bmpData.Scan0
$bytes = [Math]::Abs($bmpData.Stride) * $newBmp.Height
$rgbValues = New-Object byte[] $bytes
[System.Runtime.InteropServices.Marshal]::Copy($ptr, $rgbValues, 0, $bytes)

for ($i = 0; $i -lt $bytes; $i += 4) {
    $b = $rgbValues[$i]
    $g = $rgbValues[$i+1]
    $r = $rgbValues[$i+2]
    $max = [Math]::Max($r, [Math]::Max($g, $b))
    if ($max -le 16) {
        $rgbValues[$i+3] = 0
    } elseif ($max -le 38) {
        $alpha = [int](($max - 16) * 11.5)
        if ($alpha -gt 255) { $alpha = 255 }
        $rgbValues[$i+3] = [byte]$alpha
    }
}

[System.Runtime.InteropServices.Marshal]::Copy($rgbValues, 0, $ptr, $bytes)
$newBmp.UnlockBits($bmpData)
$newBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$newBmp.Dispose()
Write-Host "Transparent PNG successfully generated!"
