# 플레이버 휠 이미지 선명도 개선 (Windows 내장 .NET System.Drawing 만 사용)
# 내용은 바꾸지 않고 해상도 변환 + 언샤프 마스크만 적용 (CC BY-NC-ND 2(a)(4) 기술적 변경 범위)
# 사용: powershell -ExecutionPolicy Bypass -File scripts\upscale-wheel.ps1 [-Scale 2] [-Amount 0.7]
param(
  [string]$In = "$PSScriptRoot\..\public\flavor-wheel.jpg",
  [string]$Out = "$PSScriptRoot\..\public\flavor-wheel-hd.jpg",
  [double]$Scale = 2.0,
  [double]$Amount = 1.3,   # 선명화 세기 (0.7 은 차이가 작았음)
  [double]$Sigma = 1.8,    # 흐림 반경(확대 후 픽셀 기준)
  [int]$Threshold = 3,     # 이 값보다 작은 차이(잡음)는 선명화하지 않음
  [int]$Quality = 92
)

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class Sharpen {
  static double[] Kernel(double sigma) {
    int r = (int)Math.Ceiling(sigma * 3);
    double[] k = new double[2 * r + 1];
    double sum = 0;
    for (int i = -r; i <= r; i++) { k[i + r] = Math.Exp(-(i * i) / (2 * sigma * sigma)); sum += k[i + r]; }
    for (int i = 0; i < k.Length; i++) k[i] /= sum;
    return k;
  }

  public static void Unsharp(Bitmap bmp, double sigma, double amount, int threshold) {
    int w = bmp.Width, h = bmp.Height;
    Rectangle rect = new Rectangle(0, 0, w, h);
    BitmapData d = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format24bppRgb);
    int stride = d.Stride;
    byte[] src = new byte[stride * h];
    Marshal.Copy(d.Scan0, src, 0, src.Length);

    double[] k = Kernel(sigma);
    int r = k.Length / 2;
    double[] tmp = new double[stride * h];
    double[] blur = new double[stride * h];

    // 가로 흐림
    for (int y = 0; y < h; y++)
      for (int x = 0; x < w; x++)
        for (int c = 0; c < 3; c++) {
          double s = 0;
          for (int i = -r; i <= r; i++) {
            int xx = Math.Min(w - 1, Math.Max(0, x + i));
            s += src[y * stride + xx * 3 + c] * k[i + r];
          }
          tmp[y * stride + x * 3 + c] = s;
        }
    // 세로 흐림
    for (int y = 0; y < h; y++)
      for (int x = 0; x < w; x++)
        for (int c = 0; c < 3; c++) {
          double s = 0;
          for (int i = -r; i <= r; i++) {
            int yy = Math.Min(h - 1, Math.Max(0, y + i));
            s += tmp[yy * stride + x * 3 + c] * k[i + r];
          }
          blur[y * stride + x * 3 + c] = s;
        }
    // 원본 + (원본 - 흐림) × 세기
    for (int y = 0; y < h; y++)
      for (int x = 0; x < w; x++)
        for (int c = 0; c < 3; c++) {
          int i = y * stride + x * 3 + c;
          double diff = src[i] - blur[i];
          if (Math.Abs(diff) < threshold) continue;
          double v = src[i] + diff * amount;
          src[i] = (byte)Math.Max(0, Math.Min(255, Math.Round(v)));
        }

    Marshal.Copy(src, 0, d.Scan0, src.Length);
    bmp.UnlockBits(d);
  }
}
"@

$inPath = (Resolve-Path $In).Path
$img = [System.Drawing.Image]::FromFile($inPath)
$w = [int]([math]::Round($img.Width * $Scale))
$h = [int]([math]::Round($img.Height * $Scale))

$bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
# 가장자리 번짐 방지
$attr = New-Object System.Drawing.Imaging.ImageAttributes
$attr.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
$g.DrawImage($img, (New-Object System.Drawing.Rectangle(0, 0, $w, $h)), 0, 0, $img.Width, $img.Height, [System.Drawing.GraphicsUnit]::Pixel, $attr)
$g.Dispose()
$img.Dispose()

[Sharpen]::Unsharp($bmp, $Sigma, $Amount, $Threshold)

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)
$outPath = [System.IO.Path]::GetFullPath($Out)
$bmp.Save($outPath, $codec, $ep)
$bmp.Dispose()
"saved $outPath ($w x $h, " + [math]::Round((Get-Item $outPath).Length / 1KB) + " KB)"
