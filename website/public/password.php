<?php

include "../config.php";

if ($_POST['submit']) {

    //get input data
    $password = $_POST['password'];
    $emailAddress = $_GET['email'];
    $randomValue = $_GET['randomValue'];
    $passwordRepeat = $_POST['passwordRepeat'];

    //check if input is valid
    checkUserInput($emailAddress, $randomValue);

    //check that password and passwordRepeat are the same
    if (strcmp($password, $passwordRepeat) !== 0) {
        header("Location: /password.php?pw_error=true&email=$emailAddress&randomValue=$randomValue");
        exit;
    }

    //hash the password
    $pwHash = hash('sha3-512', $password);

    //call lambda API with a post request, transferring mail, new password and random value, and retrieve success or error code
    $postfields = array('mail' => '*' . $emailAddress . '*', 'randomValue' => '*' . $randomValue . '*', 'pwhash' => '*' . $pwHash . '*', $secret);
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $password_reset_link);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postfields);
    $response = curl_exec($ch);

    //show error message to user
    if ($response == 'error') {
        header("Location: /password.php?apiError=true&email=$emailAddress&randomValue=$randomValue");
        exit;
    } else if ($response == 'request already used') {
        header("Location: /password-reset.php?expired=true");
        exit;
    } else if ($response == 'success'){
        header("Location: /password.php?success=true");
        exit;
    }

    //show success message to user
    header("Location: /password.php?apiError=true&email=$emailAddress&randomValue=$randomValue");
}

function checkUserInput($email, $rand)
{
    //checks whether values are empty
    if (!isset($_POST['password'])) {
        header("Location: /password.php?input_error=true&email=$email&randomValue=$rand");
        exit;
    }
    if (!isset($_POST['passwordRepeat'])) {
        header("Location: /password.php?input_error=true&email=$email&randomValue=$rand");
        exit;
    }
}

?>

<html>
<header>
    <meta charset="utf-8">
    <title><?php echo $pw_title?></title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css"
          integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">
</header>
<body>
<div class="container">
    <br><br>
    <h1<?php echo $pw_headline?></h1>
    <br>

    <!--show error message to user-->
    <?php
    if (isset($_GET['input_error'])) {
        echo '<div class="alert alert-danger" role="alert">'. $input_error . '</div>';
    } elseif (isset($_GET['apiError'])) {
        echo '<div class="alert alert-danger" role="alert">'. $api_error . '</div>';
    } elseif (isset($_GET['pw_error'])) {
        echo '<div class="alert alert-danger" role="alert">'. $pw_error . '</div>';
    } elseif (isset($_GET['expired'])) {
        echo '<div class="alert alert-danger" role="alert">'. $password_reset_expired . '</div>';
    }elseif (isset($_GET['success'])) {
        echo '<div class="alert alert-success" role="alert">'. $pw_reset_success . '</div>';
    }
    ?>

    <!--create input fields-->
    <form id="authorize-plugin-form" method="post">
        <div class="form-group">
            <input name="password" type="password" class="form-control" placeholder="Passwort" required>
        </div>
        <div class="form-group">
            <input name="passwordRepeat" type="password" class="form-control" placeholder="Passwort wiederholen"
                   required>
        </div>
        <br>
        <input data-loading-text="<i class='fa fa-circle-o-notch fa-spin'></i> Processing Order" id="authorize-plugin"
               name="submit" class="btn btn-primary" type="submit" value="Passwort ändern">
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