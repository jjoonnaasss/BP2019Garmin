<?php
// Copyright 2019, 2020 Jens Wolf, Timon Böhler, Kyu Hwan Yoo, Jonas Wombacher
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

//general
$secret = "****";
$google_secret = "****";

//registration settings
$start_oauth_link = "link-to-start_oauth";

//password-reset settings
$password_reset_link = "link-to-password_reset";

//google settings
$google_link = "link-to-google_registration";

//data download settings
$dd_link = "link-to-api";
$dd_rsa_private_key = "-----BEGIN RSA PRIVATE KEY-----
-----END RSA PRIVATE KEY-----";

//google settings
$google_link = "link-to-api";
$google_d_link = "link-to-api";
$google_data_sync_link = "link-to-api";
$google_rsa_private_key = "-----BEGIN RSA PRIVATE KEY-----
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
