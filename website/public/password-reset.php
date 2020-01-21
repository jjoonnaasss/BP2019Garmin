<?php

use PHPMailer\PHPMailer\PHPMailer;

require_once "../vendor/autoload.php";

include "../config.php";

if ($_POST['submit']) {
    //check if input is valid
    checkUserInput();

    //get input data
    $emailAddress = strtolower($_POST['email']);

    //generate random value to identify the password reset request
    $permitted_chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $randomValue = substr(str_shuffle($permitted_chars), 0, 16);

    //call lambda API with a post request, transferring mail and random value, and retrieve success or error code
    $postfields = array('mail' => '*' . $emailAddress . '*', 'randomValue' => '*' . $randomValue . '*', 'secret' => '*' .$secret .'*');
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $password_reset_link);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postfields);
    $response = curl_exec($ch);

    if ($response == 'error') {
        header("Location: /password-reset.php?email=true");
        exit;
    }

    //initialize PHP Mailer and set SMTP as mailing protocol
    $mail = new PHPMailer();
    $mail->IsSMTP();
    $mail->Mailer = "smtp";

    //set required parameters for making an SMTP connection
    $mail->SMTPAuth = $SMTPAuth;
    $mail->SMTPSecure = $SMTPSecure;
    $mail->Port = $port;
    $mail->Host = $host;
    $mail->Username = $username;
    $mail->Password = $mail_password;
    $mail->CharSet = $charSet;

    //set the required parameters for email header and body
    $mail->IsHTML(true);
    $mail->AddAddress($emailAddress);
    $mail->SetFrom($pw_sender_mail, $pw_sender_name);
    $mail->Subject = $pw_subject;
    $content = "$pw_mail_text<br>$pw_mail_content_link/password.php?randomValue=$randomValue&email=$emailAddress<br>";
    $mail->Body = $content;

    //send the message, check for errors
    if (!$mail->send()) {
        header("Location: /index.php?error=true");
        exit;
    }

    //show user that email was send
    header("Location: /password-reset.php?email=true");
}

function checkUserInput()
{
    //checks whether values are empty
    if ($_POST['email'] == "") {
        header("Location: /password-reset.php?input_error=true");
        exit;
    }
}

?>

<html>
<head>
    <meta charset="utf-8">
    <title><?php echo $pw_title?></title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css"
          integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">
</head>
<body>
<!--create a navbar to navigate across the different sites-->
<nav class="navbar navbar-expand-lg navbar-light bg-light">
    <a class="navbar-brand" href="../"><?php echo $nav_bar_title ?></a>
    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavAltMarkup"
            aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
        <div class="navbar-nav">
            <a class="nav-item nav-link" href="../"><?php echo $nav_bar_reg ?></a>
            <a class="nav-item nav-link" href="../data-download.php"><?php echo $nav_bar_dd ?></a>
            <a class="nav-item nav-link active" href="../password-reset.php"><?php echo $nav_bar_pw ?><span class="sr-only">(current)</span></a>
            <a class="nav-item nav-link" href="../reconnect.php"><?php echo $nav_bar_rec ?></a>
        </div>
    </div>
</nav>
<div class="container">
    <br><br>
    <h1><?php echo $pw_headline?></h1>
    <br>
    <?php echo $pw_info_text?>
    <br>

    <!--show error message to user-->
    <?php
    if (isset($_GET['input_error'])) {
        echo '<div class="alert alert-danger" role="alert">'. $input_error . '</div>';
    } elseif (isset($_GET['email'])) {
        echo '<div class="alert alert-success" role="alert">'. $mail_send . '</div>';
    } elseif (isset($_GET['expired'])) {
        echo '<div class="alert alert-danger" role="alert">'. $password_reset_expired . '</div>';
    } elseif (isset($_GET['error'])) {
        echo '<div class="alert alert-danger" role="alert">' . $mail_send_error . '</div>';
    }
    ?>

    <!--create input fields-->
    <form id="authorize-plugin-form" method="post">
        <div class="form-group">
            <input name="email" class="form-control" type="email" placeholder="Email-Adresse"
                   value="<?php echo $_POST['email']; ?>" required>
        </div>
        <br>
        <input data-loading-text="<i class='fa fa-circle-o-notch fa-spin'></i> Processing Order" id="authorize-plugin"
               name="submit" class="btn btn-primary" type="submit" value="Passwort zurücksetzen">
    </form>
</div>

<!--external libraries-->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.js"></script>
<script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js"
        integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo"
        crossorigin="anonymous"></script>
<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js"
        integrity="sha384-wfSDF2E50Y2D1uUdj0O3uMBJnjuUD4Ih7YwaYd1iqfktj0Uod8GCExl3Og8ifwB6"
        crossorigin="anonymous"></script>
</body>
</html>