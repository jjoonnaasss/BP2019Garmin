<?php

include "../config.php";

if ($_POST['submit']) {
    //check if input is valid
    checkUserInput();

    //get input data
    $password = $_POST['password'];
    $emailAddress = $_POST['email'];

    //hash the password
    $pwHash = hash('sha3-512', $password);

    //call lambda API with a post request, transferring mail and password hash, and retrieve zip file
    $postfields = array('mail' => '*' . $emailAddress . '*', 'pwhash' => '*' . $pwHash . '*');
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $dd_link);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postfields);
    $response = curl_exec($ch);

    //show error message to user
    if ($response == 'incorrect password!') {
        header("Location: /data-download.php?loginError=true");
        exit;
    }

    //TODO User can download data
    header("Location: /data-download.php?login=true");
}

function checkUserInput()
{
    //checks whether values are empty
    if ($_POST['email'] == "") {
        header("Location: /data-download.php?input_error=true");
        exit;
    }
    if (!isset($_POST['password'])) {
        header("Location: /data-download.php?input_error=true");
        exit;
    }
}

?>

<html>
<header>
    <meta charset="utf-8">
    <title><?php echo $dd_title?></title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css"
          integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">
</header>
<body>
<div class="container">
    <br><br>
    <h1><?php echo $dd_headline?></h1>
    <br><br>

    <!--show error message to user-->
    <?php
    if (isset($_GET['input_error'])) {
        echo '<div class="alert alert-danger" role="alert">' . $input_error . '</div>';
    } elseif (isset($_GET['loginError'])) {
        echo '<div class="alert alert-danger" role="alert">' . $login_error . '</div>';
    } elseif (isset($_GET['login'])) {
        echo '<div class="alert alert-success" role="alert">' . $dd_login_success . '</div>';
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