<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Contracts\Events\Dispatcher;

class LogAuthActivity
{
    /**
     * Register listeners for the subscriber.
     *
     * @return array<class-string, string>
     */
    public function subscribe(Dispatcher $events): array
    {
        return [
            Login::class => 'handleLogin',
            Logout::class => 'handleLogout',
            Failed::class => 'handleFailed',
            Lockout::class => 'handleLockout',
            Registered::class => 'handleRegistered',
            PasswordReset::class => 'handlePasswordReset',
            Verified::class => 'handleVerified',
        ];
    }

    public function handleLogin(Login $event): void
    {
        activity('auth')
            ->causedBy($event->user)
            ->performedOn($event->user)
            ->withProperties($this->context())
            ->event('login')
            ->log('User logged in.');
    }

    public function handleLogout(Logout $event): void
    {
        if ($event->user === null) {
            return;
        }

        activity('auth')
            ->causedBy($event->user)
            ->performedOn($event->user)
            ->withProperties($this->context())
            ->event('logout')
            ->log('User logged out.');
    }

    public function handleFailed(Failed $event): void
    {
        activity('auth')
            ->causedBy($event->user) // null when no matching user, which is itself a signal
            ->withProperties(array_merge($this->context(), [
                'attempted_email' => $event->credentials['email'] ?? null,
            ]))
            ->event('login_failed')
            ->log('Failed login attempt.');
    }

    public function handleLockout(Lockout $event): void
    {
        activity('auth')
            ->withProperties(array_merge($this->context(), [
                'attempted_email' => $event->request->input('email'),
            ]))
            ->event('lockout')
            ->log('Login throttle triggered.');
    }

    public function handleRegistered(Registered $event): void
    {
        activity('auth')
            ->causedBy($event->user)
            ->performedOn($event->user)
            ->withProperties($this->context())
            ->event('registered')
            ->log('User registered.');
    }

    public function handlePasswordReset(PasswordReset $event): void
    {
        activity('auth')
            ->causedBy($event->user)
            ->performedOn($event->user)
            ->withProperties($this->context())
            ->event('password_reset')
            ->log('Password reset completed.');
    }

    public function handleVerified(Verified $event): void
    {
        activity('auth')
            ->causedBy($event->user)
            ->performedOn($event->user)
            ->withProperties($this->context())
            ->event('email_verified')
            ->log('Email verified.');
    }

    /**
     * @return array<string, string|null>
     */
    private function context(): array
    {
        $request = request();

        return [
            'ip' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ];
    }
}
