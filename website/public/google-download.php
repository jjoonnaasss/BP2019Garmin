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

include "../config.php";
require_once "../vendor/autoload.php";

use phpseclib\Crypt\RSA;

if ($_GET['lang'] == "de") {
    include "../de.php";
} else {
    include "../en.php";
}

if ($_POST['submit']) {
    //check if input is valid
    checkUserInput();

    //get input data
    $password = $_POST['password'];
    $emailAddress = strtolower($_POST['email']);

    //hash the password
    $pwHash = hash('sha3-512', $emailAddress. $password);

    //call lambda API with a post request, transferring mail and password hash, and retrieve string
    $postfields = array('mail' => '*' . $emailAddress . '*', 'pwHash' => '*' . $pwHash . '*', 'secret' => '*' . $google_secret . '*');
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $google_data_sync_link);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postfields);
    $response = curl_exec($ch);

    //show error message to user
    if ($response == 'error with login') {
        header("Location: /google-download.php?loginError=true&lang=$_GET[lang]&val=$_GET[val]");
        exit;
    } else if ($response == 'no google connection') {
        header("Location: /google-download.php?googleConnect=true&lang=$_GET[lang]&val=$_GET[val]");
    } else if ($response == 'Internal server error') {
        header("Location: /google-download.php?data_error=true&lang=$_GET[lang]&val=$_GET[val]");
    }

    //check if the user marked the box for the download of the fitness data
    if (isset($_POST['googleSyncCheckbox'])) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $google_d_link);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postfields);
        $response = curl_exec($ch);

        //show error message to user
        if ($response == 'no data' or $response == "") {
            header("Location: /google-download.php?data_error=true&lang=$_GET[lang]");
            exit;
        } else if ($response == 'Internal server error') {
            header("Location: /google-download.php?data_error=true&lang=$_GET[lang]&val=$_GET[val]");
        }

        //split response in two strings, the rsa-encrypted symmetrical key and the encrypted Google Fit data
        $responseData = explode("===***===", $response, 2);

        //initialize RSA module, decrypt symmetrical key
        $rsa = new RSA();
        $rsa->loadKey($google_rsa_private_key, RSA::PRIVATE_FORMAT_PKCS1);
        $symKey = $rsa->decrypt(base64_decode($responseData[0]));

        //decrypt Google Fit data
        $data = explode(":", $responseData[1]);
        $iv = hex2bin($data[0]);
        $cipherText = hex2bin($data[1]);
        $diaConvert = openssl_decrypt($cipherText, "aes-256-ctr", $symKey, OPENSSL_RAW_DATA, $iv);

        //save JSON file in temp directory
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
    header("Location: /google-download.php?login=true&lang=$_GET[lang]");
}

function checkUserInput()
{
    //checks whether values are empty
    if ($_POST['email'] == "" or !isset($_POST['password'])) {
        header("Location: /google-download.php?input_error=true&lang=$_GET[lang]");
        exit;
    }
}

?>

<html>
<head>
    <meta charset="utf-8">
    <title><?php echo $google_d_title ?></title>
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
            <a class="nav-item nav-link" href="../<?php echo "?lang=$_GET[lang]" ?>"><?php echo $nav_bar_reg ?></a>
            <a class="nav-item nav-link"
               href="../data-download.php<?php echo "?lang=$_GET[lang]" ?>"><?php echo $nav_bar_dd ?></a>
            <a class="nav-item nav-link"
               href="../password-reset.php<?php echo "?lang=$_GET[lang]" ?>"><?php echo $nav_bar_pw ?></a>
            <a class="nav-item nav-link"
               href="../reconnect.php<?php echo "?lang=$_GET[lang]" ?>"><?php echo $nav_bar_rec ?></a>
            <a class="nav-item nav-link"
               href="../google.php<?php echo "?lang=$_GET[lang]" ?>
            "><?php echo $nav_bar_google ?></a>
            <a class="nav-item nav-link active"
               href="../google-download.php<?php echo "?lang=$_GET[lang]" ?>
            "><?php echo $nav_bar_google_d ?><span class="sr-only">(current)</span></a>
            <a class="nav-item nav-link" href="../delete-account.php<?php echo "?lang=$_GET[lang]" ?>
            "><?php echo $nav_bar_delete_acc ?></a>
            <?php
            if ($_GET['lang'] == "de") {
                echo "<li class=\"nav-item dropdown\">
                <a class=\"nav-link dropdown-toggle\" href=\"http://example.com\" id=\"dropdown09\" data-toggle=\"dropdown\"
                   aria-haspopup=\"true\" aria-expanded=\"false\"><span class=\"flag-icon flag-icon-de\"> </span> Deutsch</a>
                <div class=\"dropdown-menu\" aria-labelledby=\"dropdown09\">
                    <a class=\"dropdown-item\" href=\"?lang=en\"><span class=\"flag-icon flag-icon-us\"> </span> English</a>
                </div>
            </li>";
            } else {
                echo "<li class=\"nav-item dropdown\">
                <a class=\"nav-link dropdown-toggle\" href=\"http://example.com\" id=\"dropdown09\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\"><span class=\"flag-icon flag-icon-us\"> </span> English</a>
                <div class=\"dropdown-menu\" aria-labelledby=\"dropdown09\">
                    <a class=\"dropdown-item\" href=\"?lang=de\"><span class=\"flag-icon flag-icon-de\"> </span>  Deutsch</a>
                </div>
            </li>";
            }
            ?>
        </div>
    </div>
</nav>

<div class="container">
    <br><br>
    <h1><?php echo $google_d_headline ?></h1>
    <br>
    <p><?php echo $google_d_info_text ?></p>
    <br>

    <!--show error message to user-->
    <?php
    if (isset($_GET['login'])) {
        echo '<div class="alert alert-success" role="alert">' . $google_d_login_success . '</div>';
    } elseif (isset($_GET['input_error'])) {
        echo '<div class="alert alert-danger" role="alert">' . $input_error . '</div>';
    } elseif (isset($_GET['loginError'])) {
        echo '<div class="alert alert-danger" role="alert">' . $login_error . '</div>';
    } elseif (isset($_GET['data_error'])) {
        echo '<div class="alert alert-danger" role="alert">' . $google_d_data_error . '</div>';
    } elseif (isset($_GET['googleConnect'])) {
        echo '<div class="alert alert-danger" role="alert">' . $google_d_connect_error . '</div>';
    } elseif (isset($_GET['data_error'])) {
        echo '<div class="alert alert-danger" role="alert">' . $dd_data_error . '</div>';
    }
    ?>

    <!--create input fields-->
    <form id="authorize-plugin-form" method="post">
        <!-- create checkbox which enable google data download -->
        <input name="googleSyncCheckbox" type="checkbox" id="googleSyncCheckbox"
               onclick="regCheck()"/> <?php echo $google_sync_check ?>
        <br>
        <br>
        <div class="form-group">
            <input name="email" class="form-control" type="email" placeholder="<?php echo $email_input ?>"
                   value="<?php echo $_POST['email']; ?>" required>
        </div>
        <div class="form-group">
            <input name="password" type="password" class="form-control" placeholder="<?php echo $password_input ?>"
                   required>
        </div>
        <br><br>
        <input data-loading-text="<i class='fa fa-circle-o-notch fa-spin'></i> Processing Order" id="authorize-plugin"
               name="submit" class="btn btn-primary" type="submit" value="<?php echo $google_d_button ?>">
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