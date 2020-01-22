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

//callback settings
$call_title = "Registrierung in Arbeit";
$call_headline = "Registrierung in Arbeit";

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

//messages sent to the user
$input_error = "Es ist ein Fehler aufgetreten. Bitte alle Felder ausfüllen";
$pw_error = "Es ist ein Fehler aufgetreten. Die Passwörter müssen gleich sein";
$registered = "Die Email ist bereits registriert! Das <a href=\"../password-reset.php\">Passwort</a> kann geändert werden oder die <a href=\"../reconnect.php\">Verbindung</a> zu Garmin erneut erfolgen.";
$mail_send_error = "Es gab leider einen Fehler... Versuchen sie es später erneut. Passiert dies öfters wenden sie sich bitte an ....";
$mail_send = "Email wurde verschickt!";
$password_reset_expired = "Die Passwort-Reset Anfrage ist abgelaufen! Bitte fordern sie eine neue E-mail an.";
$api_error = "Es ist ein Fehler aufgetreten. Bitte versuche es später erneut!";
$pw_info_text = "<p> Sollten sie ihr Passwort vergessen haben, können sie es hier zurücksetzen lassen.<br> 
                    Wir werden ihnen dann eine E-Mail mit einem Link senden, über den sie ein neues Passwort festlegen können. </p>";
$reg_info_text = "DiaData ist eine Anwendung, die Fitnessdaten von Garmin-Connect Konten sammelt, sie in das
                    <a href=\"https://github.com/OpenDiabetes/OpenDiabetesVault/wiki/Data-Model\">OpenDiabetesVault</a>-Format konvertiert 
                    und dann dem jeweiligen Nutzer zum Download zur Verfügung stellt. <br> Wenn sie sich bei DiaData registrieren, geben 
                    sie uns die Berechtigung, alle ihre Garmin-Connect Fitnessdaten abzurufen, zu speichern und zu verarbeiten. Nach einmaliger 
                    Registrierung werden ihre Daten automatisch so lange gesammelt, bis sie in ihrem Garmin-Connect Konto die 
                    <a href=\"https://connect.garmin.com/modern/settings/accountInformation\"> Verbindung mit DiaData trennen</a>.";
$rec_info_text = "Sollten sie in ihrem Garmin-Connect Konto die Verbindung mit DiaData getrennt haben, können sie hier mit den
                    Anmeldedaten ihres DiaData Accounts die Verbindung wiederherstellen. Vor der Trennung gesammelte Daten bleiben
                    erhalten und werden mit den neuen Daten zum Download bereitgestellt.";
$dd_info_text = "Hier können sie die gesammelten Fitnessdaten ihres DiaData Accounts im <a href=\"https://github.com/OpenDiabetes/OpenDiabetesVault/wiki/Data-Model\">OpenDiabetesVault</a>-Format herunterladen.";
$pw_reset_success = "Passwort wurde erfolgreich geändert!";
$login_error = "Es ist ein Fehler aufgetreten. Email und/oder Passwort falsch.";
$dd_login_success = "Daten werden gedownloadet";
$pw_mail_text = "Klicken sie auf den folgenden Link, um ein neues Passwort festzulegen:";