<?php

use PHPMailer\PHPMailer\PHPMailer;
use setasign\Fpdi\Fpdi;

require_once "../vendor/autoload.php";

include "../config.php";

if ($_GET['lang'] == "en") {
    include "../en.php";
} else {
    include "../de.php";
}

if ($_POST['submit']) {
    //check if input is valid
    checkUserInput();

    //get input data
    $password = $_POST['password'];
    $emailAddress = strtolower($_POST['email']);
    $passwordRepeat = $_POST['passwordRepeat'];
    $firstName = $_POST['firstName'];
    $lastName = $_POST['lastName'];

    //check that password and passwordRepeat are the same
    if (strcmp($password, $passwordRepeat) !== 0) {
        header("Location: /index.php?pw_error=true&lang=$_GET[lang]");
        exit;
    }

    //hash the password
    $pwHash = hash('sha3-512', $password);

    //call lambda API with a post request, transferring mail and password hash, and retrieve redirect url from lambda function
    $postfields = array('mail' => '*' . $emailAddress . '*', 'pwhash' => '*' . $pwHash . '*', 'secret' => '*' . $secret . '*');
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $start_oauth_link);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postfields);
    $response = curl_exec($ch);

    if ($response == 'mail already registered') {
        header("Location: /index.php?registered=true&lang=$_GET[lang]");
        exit;
    }

    //get date
    $date = new \DateTime();

    //generate random filename
    $filename = uniqid();

    //set file path
    $file = __DIR__ . "/temp/$filename.pdf";

    //create new PDF
    $pdf = new FPDI('p');
    //reference the PDF
    $pagecount = $pdf->setSourceFile(__DIR__ . '/template/privacy_protection.pdf');

    //import pages from the PDF and add to dynamic PDF
    $tpl = $pdf->importPage(1);
    $pdf->AddPage();
    $pdf->useTemplate($tpl);

    $tpl = $pdf->importPage(2);
    $pdf->AddPage();
    $pdf->useTemplate($tpl);

    $tpl = $pdf->importPage(3);
    $pdf->AddPage();

    //use the imported pages as the template
    $pdf->useTemplate($tpl);

    //set the default font to use
    $pdf->SetFont('Helvetica');

    //adding date cell
    $pdf->SetFontSize('12'); // set font size
    $pdf->SetXY(23.5, 81); // set the position of the box
    $pdf->Cell(33.5, 10, $date->format('d. M Y'), 0, 0, 'L');

    //adding name cell
    $pdf->SetXY(64, 81);
    $pdf->Cell(50, 10, $firstName . ' ' . $lastName, 0, 0, 'L');

    //save pdf
    $pdf->Output('F', $file, true);

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
    $mail->AddAddress($reg_receiver);
    $mail->SetFrom($reg_sender_mail, $reg_sender_name);
    $mail->Subject = $reg_subject;
    $content = $_POST['firstName'] . ' ' . $_POST['lastName'] . ' has accepted the terms of use. <br>Email: ' . $_POST['email'] . '<br><br>';
    $mail->Body = $content;

    //add the attachment to the mail
    $mail->AddAttachment($file, 'Privacy.pdf');

    //send the message, check for errors
    if (!$mail->send()) {
        header("Location: /index.php?error=true&lang=$_GET[lang]");
        unlink(__DIR__ . "/temp/$filename.pdf");
        exit;
    } else {
        unlink(__DIR__ . "/temp/$filename.pdf");
    }

    header("Location: $response");
}

function checkUserInput()
{
    //checks whether values are empty
    if ($_POST['firstName'] == "" or $_POST['lastName'] == "" or $_POST['email'] == "") {
        header("Location: /index.php?input_error=true&lang=$_GET[lang]");
        exit;
    }
    if (!isset($_POST['password']) or !isset($_POST['passwordRepeat']) or !isset($_POST['accept'])) {
        header("Location: /index.php?input_error=true&lang=$_GET[lang]");
        exit;
    }
}

?>

<html>
<head>
    <meta charset="utf-8">
    <title><?php echo $reg_title ?></title>
    <!-- Bootstrap core CSS -->
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css"
          integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">
    <link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.1.0/css/flag-icon.min.css" rel="stylesheet">
</head>
<body>
<!--create a navbar to navigate across the different sites-->
<nav class="navbar navbar-expand-lg navbar-light bg-light">
    <a class="navbar-brand" href="../<?php echo "?lang=$_GET[lang]" ?>"><?php echo $nav_bar_title ?></a>
    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavAltMarkup"
            aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
        <div class="navbar-nav">
            <a class="nav-item nav-link active" href="../<?php echo "?lang=$_GET[lang]" ?>"><?php echo $nav_bar_reg ?>
                <span class="sr-only">(current)</span></a>
            <a class="nav-item nav-link"
               href="../data-download.php<?php echo "?lang=$_GET[lang]" ?>"><?php echo $nav_bar_dd ?></a>
            <a class="nav-item nav-link"
               href="../password-reset.php<?php echo "?lang=$_GET[lang]" ?>"><?php echo $nav_bar_pw ?></a>
            <a class="nav-item nav-link"
               href="../reconnect.php<?php echo "?lang=$_GET[lang]" ?>"><?php echo $nav_bar_rec ?></a>
            <a class="nav-item nav-link"
               href="../google.php<?php echo "?lang=$_GET[lang]" ?>
            "><?php echo $nav_bar_google ?></a>
            <a class="nav-item nav-link"
               href="../google-download.php<?php echo "?lang=$_GET[lang]" ?>
            "><?php echo $nav_bar_google_d ?></a>
            <?php
            if ($_GET['lang'] == "en") {
                echo "<li class=\"nav-item dropdown\">
                <a class=\"nav-link dropdown-toggle\" href=\"http://example.com\" id=\"dropdown09\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\"><span class=\"flag-icon flag-icon-gb\"> </span> English</a>
                <div class=\"dropdown-menu\" aria-labelledby=\"dropdown09\">
                    <a class=\"dropdown-item\" href=\"?lang=de\"><span class=\"flag-icon flag-icon-de\"> </span>  Deutsch</a>
                </div>
            </li>";
            } else {
                echo "<li class=\"nav-item dropdown\">
                <a class=\"nav-link dropdown-toggle\" href=\"http://example.com\" id=\"dropdown09\" data-toggle=\"dropdown\"
                   aria-haspopup=\"true\" aria-expanded=\"false\"><span class=\"flag-icon flag-icon-de\"> </span> Deutsch</a>
                <div class=\"dropdown-menu\" aria-labelledby=\"dropdown09\">
                    <a class=\"dropdown-item\" href=\"?lang=en\"><span class=\"flag-icon flag-icon-gb\"> </span> English</a>
                </div>
            </li>";
            }
            ?>
        </div>
    </div>
</nav>
<div class="container">
    <br><br>
    <h1><?php echo $reg_headline ?></h1>
    <br>
    <p><?php echo $reg_info_text ?></p>
    <br>
    <!--show error message to user-->
    <?php
    if (isset($_GET['input_error'])) {
        echo '<div class="alert alert-danger" role="alert">' . $input_error . '</div>';
    } elseif (isset($_GET['pw_error'])) {
        echo '<div class="alert alert-danger" role="alert">' . $pw_error . '</div>';
    } elseif (isset($_GET['registered'])) {
        echo '<div class="alert alert-danger" role="alert">' . $registered . '</div>';
    } elseif (isset($_GET['error'])) {
        echo '<div class="alert alert-danger" role="alert">' . $mail_send_error . '</div>';
    }
    ?>

    <!--create input fields-->
    <form id="authorize-plugin-form" method="post">
        <div class="form-group">
            <input name="firstName" class="form-control" type="text" placeholder="<?php echo $first_name_input ?>"
                   value="<?php echo $_POST['firstName']; ?>" required>
        </div>
        <div class="form-group">
            <input name="lastName" class="form-control" type="text" placeholder="<?php echo $last_name_input ?>"
                   value="<?php echo $_POST['lastName']; ?>" required>
        </div>
        <div class="form-group">
            <input name="email" class="form-control" type="email" placeholder="<?php echo $email_input ?>"
                   value="<?php echo $_POST['email']; ?>" required>
        </div>
        <div class="form-group">
            <input name="password" type="password" class="form-control" placeholder="<?php echo $password_input ?>"
                   required>
        </div>
        <div class="form-group">
            <input name="passwordRepeat" type="password" class="form-control"
                   placeholder="<?php echo $repeat_password_input ?>"
                   required>
        </div>
        <label>
            <input name="accept" type="checkbox" required>
            <a href="" data-toggle="modal" data-target="#modal"><?php echo $term_of_use ?></a>
            <?php echo $term_of_use_accept ?>
        </label>
        <br><br>
        <input data-loading-text="<i class='fa fa-circle-o-notch fa-spin'></i> Processing Order" id="authorize-plugin"
               name="submit" class="btn btn-primary" type="submit" value="<?php echo $reg_button ?>"
               data-loading-text="<i class='fa fa-spinner fa-spin '></i> Processing Order">
    </form>
</div>

<!--create pop-up with privacy protection document-->
<div class="modal fade" id="modal" tabindex="-1" role="dialog" aria-labelledby="modalLabel"
     aria-hidden="true">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 style="width: 100%" class="modal-title"><?php echo $reg_privacy_text ?></h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <iframe style="width: 100%;height: 75vh" src="<?php echo $reg_privacy_path ?>"></iframe>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary"
                        data-dismiss="modal"><?php echo $reg_privacy_close ?></button>
            </div>
        </div>
    </div>
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