<?php

include "../config.php";

if ($_POST['submit']) {
    //check if input is valid
    checkUserInput();

    //get input data
    $password = $_POST['password'];
    $emailAddress = strtolower($_POST['email']);

    //hash the password
    $pwHash = hash('sha3-512', $password);

    //call lambda API with a post request, transferring mail and password hash, and retrieve zip file
    $postfields = array('mail' => '*' . $emailAddress . '*', 'pwhash' => '*' . $pwHash . '*', 'secret' => '*' .$secret .'*');
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $dd_link);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postfields);
    $response = curl_exec($ch);

    //show error message to user
    if ($response == 'error with login') {
        header("Location: /data-download.php?loginError=true");
        exit;
    } elseif ($response == 'no data') {
        header("Location: /data-download.php?data_error=true");
        exit;
    }

    //initialize RSA module, load private key and decrypt the received data
    $rsa = new RSA();
    $rsa->loadKey($dd_rsa_private_key, RSA::PRIVATE_FORMAT_PKCS1);
    $diaConvert = $rsa->decrypt(base64_decode($response));

    //save  JSON file in temp directory
    $filenameJson = __DIR__ . "/temp/" . uniqid() . ".json";
    file_put_contents($filenameJson, $diaConvert);

    //initialize ZIP module
    $zip = new ZipArchive();
    //generate random filename
    $filename = __DIR__ . "/temp/" . uniqid() . ".zip";

    if ($zip->open($filename, ZipArchive::CREATE) !== TRUE) {
        exit("cannot open <$filename>\n");
    }

    //add JSON file to zip
    $zip->addFile($filenameJson, "DiaConvert.json");
    $zip->close();

    //read DiaConvert.zip from $zip and let client download it
    header("Content-disposition: attachment; filename=DiaConvert.zip");
    header('Content-type: application/zip');

    readfile($filename);

    //delete temp files
    unlink($filenameJson);
    unlink($filename);
    exit;
}

function checkUserInput()
{
    //checks whether values are empty
    if ($_POST['email'] == "" or !isset($_POST['password'])) {
        header("Location: /data-download.php?input_error=true");
        exit;
    }
}

?>

<html>
<head>
    <meta charset="utf-8">
    <title><?php echo $dd_title?></title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css"
          integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">
</head>
<!--create a navbar to navigate across the different sites-->
<body>
<nav class="navbar navbar-expand-lg navbar-light bg-light">
    <a class="navbar-brand" href="../"><?php echo $nav_bar_title ?></a>
    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavAltMarkup"
            aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
        <div class="navbar-nav">
            <a class="nav-item nav-link" href="../"><?php echo $nav_bar_reg ?></a>
            <a class="nav-item nav-link active" href="../data-download.php"><?php echo $nav_bar_dd ?><span
                        class="sr-only">(current)</span></a>
            <a class="nav-item nav-link" href="../password-reset.php"><?php echo $nav_bar_pw ?></a>
            <a class="nav-item nav-link" href="../reconnect.php"><?php echo $nav_bar_rec ?></a>
        </div>
    </div>
</nav>
<div class="container">
    <br><br>
    <h1><?php echo $dd_headline?></h1>
    <br>
    <p><?php echo $dd_info_text ?></p>
    <br>

    <!--show error message to user-->
    <?php
    if (isset($_GET['input_error'])) {
        echo '<div class="alert alert-danger" role="alert">' . $input_error . '</div>';
    } elseif (isset($_GET['loginError'])) {
        echo '<div class="alert alert-danger" role="alert">' . $login_error . '</div>';
    } elseif (isset($_GET['login'])) {
        echo '<div class="alert alert-success" role="alert">' . $dd_login_success . '</div>';
    } elseif (isset($_GET['data_error'])) {
        echo '<div class="alert alert-danger" role="alert">' . $dd_data_error . '</div>';
    }
    ?>

    <!--create input fields-->
    <form id="authorize-plugin-form" method="post">
        <div class="form-group">
            <input name="email" class="form-control" type="email" placeholder="Email-Adresse"
                   value="<?php echo $_POST['email']; ?>" required>
        </div>
        <div class="form-group">
            <input name="password" type="password" class="form-control" placeholder="Passwort" required>
        </div>
        <br><br>
        <input data-loading-text="<i class='fa fa-circle-o-notch fa-spin'></i> Processing Order" id="authorize-plugin"
               name="submit" class="btn btn-primary" type="submit" value="Daten downloaden">
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