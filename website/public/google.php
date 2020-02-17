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

if ($_GET['lang'] == "en") {
    include "../en.php";
} else {
    include "../de.php";
}

if ($_POST['submit']) {
    //call lambda API with a post request, transferring the secret
    $postfields = array('secret' => '*' . $google_secret . '*');
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $google_link);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postfields);
    $response = curl_exec($ch);

    header("Location: $response");
}

function checkUserInput()
{
    //checks whether values are empty
    if ($_POST['email'] == "" or !isset($_POST['password'])) {
        header("Location: /data-download.php?input_error=true&lang=$_GET[lang]");
        exit;
    }
}

?>

<html>
<head>
    <meta charset="utf-8">
    <title><?php echo $google_title ?></title>
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
            <a class="nav-item nav-link active"
               href="../google.php<?php echo "?lang=$_GET[lang]" ?>"><?php echo $nav_bar_google ?><span
                        class="sr-only">(current)</span></a>
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
    <h1><?php echo $google_headline ?></h1>
    <br>
    <p><?php echo $google_info_text ?></p>
    <br>

    <!--create input fields-->
    <form id="authorize-plugin-form" method="post">
        <br>
        <input data-loading-text="<i class='fa fa-circle-o-notch fa-spin'></i> Processing Order" id="authorize-plugin"
               name="submit" class="btn btn-primary" type="submit" value="<?php echo $google_button ?>">
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