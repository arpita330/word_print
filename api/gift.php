<?php
header('Content-Type: image/jpeg');

$code = $_GET['code'] ?? 'NO CODE';

$bgImage = 'https://raw.githubusercontent.com/arpita330/word_print/main/IMG_20260215_144053_492.jpg';
$img = imagecreatefromjpeg($bgImage);

if (!$img) {
    $img = imagecreatetruecolor(800, 600);
    $bg = imagecolorallocate($img, 30, 30, 30);
    imagefill($img, 0, 0, $bg);
}

$gold = imagecolorallocate($img, 255, 215, 0);

$codeX = (imagesx($img) - (strlen($code) * 30)) / 2;
imagestring($img, 5, $codeX, imagesy($img) * 0.7, $code, $gold);

imagejpeg($img, null, 90);
imagedestroy($img);
?>
