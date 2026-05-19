<?php
// окружение сайта
define('ENV', 'prod');

define('CLARITY_API_TOKEN', getenv('CLARITY_API_TOKEN') ?: '');
