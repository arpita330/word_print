<?php
// Get code from URL
$code = isset($_GET['code']) ? $_GET['code'] : 'NO CODE';

// Set content type to JPEG
header('Content-Type: image/jpeg');

// Background image URL
$bgImage = 'https://raw.githubusercontent.com/arpita330/word_print/main/IMG_20260215_144053_492.jpg';

// Load the image
$img = imagecreatefromjpeg($bgImage);

if (!$img) {
    // Create fallback image if loading fails
    $img = imagecreatetruecolor(800, 600);
    $bg = imagecolorallocate($img, 50, 50, 50);
    imagefill($img, 0, 0, $bg);
}

// Add text to image
$gold = imagecolorallocate($img, 255, 215, 0);
$black = imagecolorallocate($img, 0, 0, 0);
$font_size = 5; // Built-in font size

// Calculate position to center text
$text_width = strlen($code) * imagefontwidth($font_size) * 2;
$x = (imagesx($img) - $text_width) / 2;
$y = (imagesy($img) / 2) + 20;

// Add shadow for better visibility
imagestring($img, $font_size, $x+2, $y+2, $code, $black);
// Add main text
imagestring($img, $font_size, $x, $y, $code, $gold);

// Output as JPEG
imagejpeg($img, null, 90);
imagedestroy($img);
?>
