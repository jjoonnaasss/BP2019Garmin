<?php
//general
$secret = "****";

//navigation
$nav_bar_title = "DiaBEATit";
$nav_bar_reg = "Registrierung";
$nav_bar_dd = "Daten Download";
$nav_bar_pw = "Passwort zurücksetzen";
$nav_bar_rec = "Neu Verbinden";

//registration settings
$reg_title = "Registrierung für DiaBEATit";
$reg_headline = "Registrierung für DiaBEATit";
$start_oauth_link = "link-to-start_oauth";

//password-reset settings
$pw_title = "Passwort zurücksetzen";
$pw_headline = "Passwort zurücksetzen";
$password_reset_link = "link-to-password_reset";

//data download settings
$dd_title = "Daten Download";
$dd_headline = "Daten Download";
$dd_link = "link-to-api";

//reconnect settings
$rec_title = "Neu Verbinden";
$rec_headline = "Neu Verbinden";

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
$pw_subject = "Passwort zurücksetzen";
$pw_mail_content_link = "link-to-website";

//messages
$input_error = "Es ist ein Fehler aufgetreten. Bitte alle Felder ausfüllen";
$pw_error = "Es ist ein Fehler aufgetreten. Die Passwörter müssen gleich sein";
$registered = "Die Email ist bereits registriert! Das <a href=\"../password-reset.php\">Passwort</a> kann geändert werden oder die <a href=\"../reconnect.php\">Verbindung</a> zu Garmin erneut erfolgen.";
$mail_send_error = "Es gab leider einen Fehler... Versuchen sie es später erneut. Passiert dies öfters wenden sie sich bitte an ....";
$mail_send = "Email wurde verschickt!";
$password_reset_expired = "Die Passwort-Reset Anfrage ist abgelaufen! Bitte fordere eine neue Email an.";
$api_error = "Es ist ein Fehler aufgetreten. Bitte versuche es später erneut!";
$pw_info_text = "<p> Gib die E-Mail-Adresse, mit der du dich bei uns registriert hast, an. <br>
        Wir senden dir dann eine E-Mail mit einem Link, über den du dein Passwort zurücksetzen kannst. </p>";
$pw_reset_success = "Passwort wurde erfolgreich geändert!";
$login_error = "Es ist ein Fehler aufgetreten. Email und/oder Passwort falsch.";
$dd_login_success = "Daten werden gedownloadet";
$pw_mail_text = "Klicke auf den folgenden Link, um ein neues Passwort festzulegen:";