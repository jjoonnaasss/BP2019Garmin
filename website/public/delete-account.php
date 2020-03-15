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
    $pwHash = hash('sha3-512', $emailAddress . $password);

    echo $emailAddress;
    exit;

    //call lambda API with a post request, transferring mail and password hash, and retrieve string
    $postfields = array('mail' => '*' . $emailAddress . '*', 'pwHash' => '*' . $pwHash . '*', 'secret' => '*' . $secret . '*');
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $del_acc_link);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postfields);
    $response = curl_exec($ch);

    //show error message to user
    if ($response == 'error with login') {
        header("Location: /delete-account.php?loginError=true&lang=$_GET[lang]");
        exit;
    } else if ($response == 'data error') {
        header("Location: /delete-account.php?dataError=true&lang=$_GET[lang]");
        exit;
    }

    header("Location: /delete-account.php?success=true&lang=$_GET[lang]");
}

function checkUserInput()
{
    //checks whether values are empty
    if ($_POST['email'] == "" or !isset($_POST['password'])) {
        header("Location: /delete-account.php?input_error=true&lang=$_GET[lang]");
        exit;
    }
}

?>

<html>
<head>
    <meta charset="utf-8">
    <title><?php echo $del_acc_title ?></title>
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
            <a class="nav-item nav-link"
               href="../google-download.php<?php echo "?lang=$_GET[lang]" ?>
            "><?php echo $nav_bar_google_d ?></a>
            <a class="nav-item nav-link active"
               href="../delete-account.php<?php echo "?lang=$_GET[lang]" ?>
            "><?php echo $nav_bar_delete_acc ?><span class="sr-only">(current)</span></a>
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
    <h1><?php echo $del_acc_headline ?></h1>
    <br>
    <p><?php echo $del_acc_info_text ?></p>
    <br>

    <!--show error message to user-->
    <?php
    if (isset($_GET['input_error'])) {
        echo '<div class="alert alert-danger" role="alert">' . $input_error . '</div>';
    } elseif (isset($_GET['loginError'])) {
        echo '<div class="alert alert-danger" role="alert">' . $login_error . '</div>';
    } elseif (isset($_GET['success'])) {
        echo '<div class="alert alert-success" role="alert">' . $del_acc_login_success . '</div>';
    } elseif (isset($_GET['dataError'])) {
        echo '<div class="alert alert-danger" role="alert">' . $del_acc_data_error . '</div>';
    }
    ?>

    <!--create input fields-->
    <form id="delete-form" method="post">
        <div class="form-group">
            <input id="email" name="email" class="form-control" type="email"
                   placeholder="<?php echo $email_input ?>"
                   value="<?php echo $_POST['email']; ?>" required>
        </div>
        <div class="form-group">
            <input id="password" name="password" type="password" class="form-control"
                   placeholder="<?php echo $password_input ?>"
                   required>
        </div>
        <br><br>
        <input id="submit-agree" name="submit-agree" class="btn btn-danger"
               type="submit"
               value="<?php echo $del_acc_button ?>">
    </form>


    <!--create confirmation popup-->
    <div class="modal fade" id="modal" tabindex="-1" role="dialog" aria-labelledby="modal">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <?php echo $del_acc_headline ?>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span
                                aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title" id="myModalLabel"></h4>
                </div>
                <div class="modal-body">
                    <?php echo $del_acc_second_agree ?>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" type="button" class="btn btn-default"
                            data-dismiss="modal"><?php echo $del_acc_abort ?></button>
                    <input id="submit"
                           name="submit" class="btn btn-danger" type="submit" form="delete-form"
                           value="<?php echo $del_acc_button ?>">
                </div>
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

<script>

    //when enter is pressed, the function checks the form and opens the popup
    document.onkeypress = enter;
    function enter(e) {
        if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
            e.preventDefault();
            if ($('#password').val().trim() !== "" && $('#email').val() !== "") {
                $('#modal').modal('show');
            }
        }
    }

    //function is called on a submit
    //when the call comes from the button submit-agree the popup is shown
    $('#delete-form').submit(function (e) {
        if ($(this).find("input[type=submit]:focus")[0].id === "submit-agree") {
            e.preventDefault();
            if ($('#password').val().trim() !== "" && $('#email').val() !== "") {
                $('#modal').modal('show');
            }
        }
    });


</script>
</body>
</html>