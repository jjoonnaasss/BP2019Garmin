<?php

use PhpOffice\PhpWord\TemplateProcessor;

use PHPMailer\PHPMailer\PHPMailer;

require_once "../vendor/autoload.php";

if ($_POST['submit']) {
    //check if input is valid
    checkUserInput();

    //get input data
    $password = $_POST['password'];
    $emailAddress = $_POST['email'];
    $passwordRepeat = $_POST['passwordRepeat'];

    //check that password and passwordRepeat are the same
    if (strcmp($password, $passwordRepeat) !== 0) {
        header("Location: /index.php?pwerror=true");
        exit;
    }

    //hash the password
    $pwHash = hash('sha3-512', $password);

    //get date
    $datum = new \DateTime();

    //set values to replace in the privacy protection document
    $values = [
        'date' => $datum->format('d. M Y'),
        'firstName' => $_POST['firstName'],
        'lastName' => $_POST['lastName'],
    ];

    //generate random filename
    $filename = uniqid();

    //load privacy protection template
    $templateProcessor = new TemplateProcessor(__DIR__ . '/template/privacy_protection.docx');
    //replacing values
    $templateProcessor->setValues($values);

    //save file in temp directory
    $file = __DIR__ . "/temp/$filename.docx";
    $templateProcessor->saveAs($file);

    //initialize PHP Mailer and set SMTP as mailing protocol
    $mail = new PHPMailer();
    $mail->IsSMTP();
    $mail->Mailer = "smtp";

    //set required parameters for making an SMTP connection
    $mail->SMTPAuth = TRUE;
    $mail->SMTPSecure = "tls";
    $mail->Port = 587;
    $mail->Host = "smtp.gmail.com";
    $mail->Username = "xxx@gmail.com";
    $mail->Password = 'xxxxxxxx';
    $mail->CharSet = 'UTF-8';

    //set the required parameters for email header and body
    $mail->IsHTML(true);
    $mail->AddAddress("email@receiver.com");
    $mail->SetFrom("email@sender.com", "Garmin Demo-Anwendung");
    $mail->Subject = "Privacy agreement";
    $content = $_POST['firstName'] . ' ' . $_POST['lastName'] . ' has accepted the terms of use. <br>Email: ' . $_POST['email'] . '<br><br>';
    $mail->Body = $content;

    //add the attachment to the mail
    $mail->AddAttachment($file, 'Privacy.docx');

    //send the message, check for errors
    if (!$mail->send()) {
        echo('Mailer Error: ' . $mail->ErrorInfo);
        exit;
    }

    //call lambda API with a post request, transferring mail and password hash, and retrieve redirect url from lambda function
    $postfields = array('mail'=>'*'.$emailAddress.'*', 'pwhash'=>'*'.$pwHash.'*');
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://eu0kfjg03f.execute-api.eu-central-1.amazonaws.com/default/start_oauth');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postfields);
    $url = curl_exec($ch);

    //redirect user to Garmin website
    header("Location: $url");
}

function checkUserInput()
{
    //checks whether values are empty
    if ($_POST['firstName'] == "") {
        header("Location: /index.php?error=true");
        exit;
    }
    if ($_POST['lastName'] == "") {
        header("Location: /index.php?error=true");
        exit;
    }
    if ($_POST['email'] == "") {
        header("Location: /index.php?error=true");
        exit;
    }
    if (!isset($_POST['password'])) {
        header("Location: /index.php?error=true");
        exit;
    }
    if (!isset($_POST['passwordRepeat'])) {
        header("Location: /index.php?error=true");
        exit;
    }
    if (!isset($_POST['accept'])) {
        header("Location: /index.php?error=true");
        exit;
    }
}

?>

<html>
<header>
    <meta charset="utf-8">
    <title>Registrierung für DiaBEATit</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css"
          integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">
</header>
<body>
<div class="container">
    <br><br>
    <h1>Registrierung für DiaBEATit</h1>
    <br><br>

    <!--show error message to user-->
    <?php
    if (isset($_GET['error'])) {
        echo '<div class="alert alert-danger" role="alert">Es ist ein Fehler aufgetreten. Bitte alle Felder ausfüllen</div>';
    } elseif (isset($_GET['pwerror'])) {
        echo '<div class="alert alert-danger" role="alert">Es ist ein Fehler aufgetreten. Die Passwörter müssen gleich sein</div>';
    }
    ?>

    <!--create input fields-->
    <form id="authorize-plugin-form" method="post">
        <div class="form-group">
            <input name="firstName" class="form-control" type="text" placeholder="Vorname"
                   value="<?php echo $_POST['firstName']; ?>" required>
        </div>
        <div class="form-group">
            <input name="lastName" class="form-control" type="text" placeholder="Nachname"
                   value="<?php echo $_POST['lastName']; ?>" required>
        </div>
        <div class="form-group">
            <input name="email" class="form-control" type="email" placeholder="Email-Adresse"
                   value="<?php echo $_POST['email']; ?>" required>
        </div>
        <div class="form-group">
            <input name="password" type="password" class="form-control" placeholder="Passwort" required>
        </div>
        <div class="form-group">
            <input name="passwordRepeat" type="password" class="form-control" placeholder="Passwort wiederholen"
                   required>
        </div>
        <label>
            <input name="accept" type="checkbox" required>
            <a href="" data-toggle="modal" data-target="#modal">Nutzungsbedingungen und Datenschutz</a>
            akzeptiert
        </label>
        <br><br>
        <input data-loading-text="<i class='fa fa-circle-o-notch fa-spin'></i> Processing Order" id="authorize-plugin"
               name="submit" class="btn btn-primary" type="submit" value="Plugin autorisieren">
    </form>
</div>

<!--create pop-up with privacy protection document-->
<div class="modal fade" id="modal" tabindex="-1" role="dialog" aria-labelledby="modalLabel"
     aria-hidden="true">
    <div class="modal-dialog modal-xl" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Datenschutz</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <iframe style="width: 100%;height: 100%" src="template/privacy_protection.pdf" frameborder="0"></iframe>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
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

<!--update button to loading button-->
<script>
    $('#authorize-plugin-form').on('submit', function () {
        $('#authorize-plugin').button('loading');
    });
</script>
</body>
</html>