<?php
//general
$secret = "****";

//registration settings
$start_oauth_link = "link-to-start_oauth";

//password-reset settings
$password_reset_link = "link-to-password_reset";

//data download settings
$dd_link = "link-to-api";
$dd_rsa_private_key = "-----BEGIN RSA PRIVATE KEY-----
-----END RSA PRIVATE KEY-----";

//email settings
$SMTPAuth = TRUE;
$SMTPSecure = "tls";
$port = 587;
$host = "smtp.provider.com";
$username = "email@provider.com";
$mail_password = "****";
$charSet = "UTF-8";

//registration email settings
$reg_receiver = "receiver@provider.com";
$reg_sender_mail = "sender@provider.com";
$reg_sender_name = "Garmin Demo-Anwendung";
$reg_subject = "Privacy agreement";

//password email settings
$pw_sender_mail = "sender@provider.com";
$pw_sender_name = "Garmin Demo-Anwendung";
$pw_mail_content_link = "link-to-website";
