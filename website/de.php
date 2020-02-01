<?php
//input fields
$first_name_input = "Vorname";
$last_name_input = "Nachname";
$email_input = "Email";
$password_input = "Passwort";
$repeat_password_input = "Passwort wiederholen";
$term_of_use = "Nutzungsbedingungen und Datenschutz";
$term_of_use_accept = "akzeptiert";

//navigation settings
$nav_bar_title = "DiaConvert";
$nav_bar_reg = "Registrierung";
$nav_bar_dd = "Daten Download";
$nav_bar_pw = "Passwort zurücksetzen";
$nav_bar_rec = "Neu Verbinden";

//registration settings
$reg_title = "Registrierung für DiaConvert";
$reg_headline = "Registrierung für DiaConvert";
$reg_button = "Plugin autorisieren";
$reg_privacy_text = "Datenschutz";
$reg_privacy_path = "template/privacy_protection.pdf";
$reg_privacy_close = "Schließen";

//reconnect settings
$rec_title = "Neu Verbinden";
$rec_headline = "Neu Verbinden";
$rec_button = "Account mit Garmin verbinden";

//callback settings
$call_title = "Registrierung in Arbeit";
$call_headline = "Registrierung in Arbeit";

//password-reset settings
$pw_title = "Passwort zurücksetzen";
$pw_headline = "Passwort zurücksetzen";
$pw_request_button = "Passwort zurücksetzen";
$pw_reset_button = "Passwort ändern";

//data download settings
$dd_title = "Daten Download";
$dd_headline = "Daten Download";
$dd_button = "Daten downloaden";

//password reset mail subject
$pw_subject = "Passwort zurücksetzen";

//messages sent to the user
$input_error = "Es ist ein Fehler aufgetreten. Bitte alle Felder ausfüllen";
$pw_error = "Es ist ein Fehler aufgetreten. Die Passwörter müssen gleich sein";
$registered = "Die Email ist bereits registriert! Das <a href=\"../password-reset.php\">Passwort</a> kann geändert werden oder die <a href=\"../reconnect.php\">Verbindung</a> zu Garmin erneut erfolgen.";
$mail_send_error = "Es gab leider einen Fehler... Versuchen sie es später erneut. Passiert dies öfters wenden sie sich bitte an ....";
$mail_send = "Email wurde verschickt!";
$password_reset_expired = "Die Passwort-Reset Anfrage ist abgelaufen! Bitte fordern sie eine neue E-mail an.";
$api_error = "Es ist ein Fehler aufgetreten. Bitte versuche es später erneut!";
$pw_info_text = "Sollten sie ihr Passwort vergessen haben, können sie es hier zurücksetzen lassen.<br>
Wir werden ihnen dann eine E-Mail mit einem Link senden, über den sie ein neues Passwort festlegen können.";
$pw_reset_info_text = "Geben sie bitte ein neues Passwort ein und bestätigen sie es.";
$reg_info_text = "DiaConvert ist eine Anwendung, die Fitnessdaten von Garmin-Connect Konten sammelt, sie in das
<a href=\"https://github.com/OpenDiabetes/OpenDiabetesVault/wiki/Data-Model\">OpenDiabetesVault</a>-Format konvertiert
und dann dem jeweiligen Nutzer zum Download zur Verfügung stellt. <br> Wenn sie sich bei DiaConvert registrieren, geben
sie uns die Berechtigung, alle ihre Garmin-Connect Fitnessdaten abzurufen, zu speichern und zu verarbeiten. Nach einmaliger
Registrierung werden ihre Daten automatisch so lange gesammelt, bis sie in ihrem Garmin-Connect Konto die
<a href=\"https://connect.garmin.com/modern/settings/accountInformation\"> Verbindung mit DiaConvert trennen</a>.";
$rec_info_text = "Sollten sie in ihrem Garmin-Connect Konto die Verbindung mit DiaConvert getrennt haben, können sie hier mit den
Anmeldedaten ihres DiaConvert Accounts die Verbindung wiederherstellen. Vor der Trennung gesammelte Daten bleiben
erhalten und werden mit den neuen Daten zum Download bereitgestellt.";
$call_info_text = "Ihre Registrierung ist in circa 5 Minuten abgeschlossen. <br>Danach können Sie ihre Daten über den Menüpunkt \"Daten Download\" anfordern.";
$dd_info_text = "Hier können sie die gesammelten Fitnessdaten ihres DiaConvert Accounts im <a href=\"https://github.com/OpenDiabetes/OpenDiabetesVault/wiki/Data-Model\">OpenDiabetesVault</a>-Format herunterladen.";
$pw_reset_success = "Passwort wurde erfolgreich geändert!";
$login_error = "Es ist ein Fehler aufgetreten. Email und/oder Passwort falsch.";
$dd_login_success = "Daten werden gedownloadet";
$dd_data_error = "Es wurden noch keine Fitnessdaten für sie gesammelt";
$pw_mail_text = "Klicken sie auf den folgenden Link, um ein neues Passwort festzulegen:";