<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Simulación: cada noche se vacían compras y usuarios y se reparten las
// funciones pasadas en los días siguientes. Lo ejecuta el contenedor scheduler.
if (config('app.demo_mode')) {
    Schedule::command('demo:reset')
        ->dailyAt('00:05')
        ->timezone(config('app.demo_timezone'))
        ->withoutOverlapping();
}
