<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class VerifyEmailNotification extends VerifyEmail
{
    /**
     * Genera una URL firmada que apunta al frontend de la SPA.
     * El frontend extrae los parámetros y llama a POST /api/email/verify/{id}/{hash}
     * con el Bearer Token almacenado en local storage.
     *
     * URL resultante en el correo:
     *   {FRONTEND_URL}/email/verify?id={id}&hash={hash}&expires={ts}&signature={sig}
     */
    protected function verificationUrl(mixed $notifiable): string
    {
        $signedUrl = URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            ['id' => $notifiable->getKey(), 'hash' => sha1($notifiable->getEmailForVerification())]
        );

        $params = [];
        parse_str(parse_url($signedUrl, PHP_URL_QUERY), $params);

        return rtrim(config('app.frontend_url'), '/')
            . '/email/verify'
            . '?' . http_build_query([
                'id'        => $notifiable->getKey(),
                'hash'      => sha1($notifiable->getEmailForVerification()),
                'expires'   => $params['expires'],
                'signature' => $params['signature'],
            ]);
    }
}
