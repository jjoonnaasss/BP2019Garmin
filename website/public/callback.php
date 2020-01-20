<?php

include "../config.php";
?>

<html>
<head>
    <meta charset="utf-8">
    <title><?php echo $call_title ?></title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css"
          integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">
</head>
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
            <a class="nav-item nav-link" href="../data-download.php"><?php echo $nav_bar_dd ?></a>
            <a class="nav-item nav-link" href="../password-reset.php"><?php echo $nav_bar_pw ?></a>
            <a class="nav-item nav-link" href="../reconnect.php"><?php echo $nav_bar_rec ?></a>
        </div>
    </div>
</nav>
<div class="container">
    <br><br>
    <h1><?php echo $call_headline ?></h1>
    <br><br>
    <p>Ihre Registrierung ist in circa 5 Minuten abgeschlossen. <br>Danach können Sie ihre Daten über den Menüpunkt "Daten Download" anfordern.</p>
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