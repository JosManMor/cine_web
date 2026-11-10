<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword
{
    protected function resetUrl(mixed $notifiable): string
    {
        return rtrim(config('app.frontend_url'), '/')
            . '/reset-password'
            . '?' . http_build_query([
                'token' => $this->token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ]);
    }

    public function toMail(mixed $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Restablecer contraseña — Cine Sendera')
            ->greeting('Hola,')
            ->line('Recibimos una solicitud para restablecer la contraseña de tu cuenta.')
            ->action('Restablecer contraseña', $this->resetUrl($notifiable))
            ->line('Este enlace expirará en ' . config('auth.passwords.users.expire', 60) . ' minutos.')
            ->line('Si no solicitaste un cambio de contraseña, puedes ignorar este correo.')
            ->salutation('Saludos, Cine Sendera');
    }
}
