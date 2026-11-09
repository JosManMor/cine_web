<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminSeederTest extends TestCase
{
    use RefreshDatabase;

    private const ADMIN_EMAIL = 'admin@cine.test';

    private function setAdmin(?string $email, ?string $password): void
    {
        config(['app.admin' => ['name' => 'Admin Pre', 'email' => $email, 'password' => $password]]);
    }

    public function test_admin_is_created_from_environment(): void
    {
        $this->setAdmin(self::ADMIN_EMAIL, 'secreto-largo');

        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseHas('users', ['email' => self::ADMIN_EMAIL, 'name' => 'Admin Pre', 'role' => 'admin']);
        $this->assertDatabaseMissing('users', ['email' => 'test@example.com']);
    }

    public function test_changing_the_password_is_applied_on_next_seed(): void
    {
        $this->setAdmin(self::ADMIN_EMAIL, 'primera');
        $this->seed(DatabaseSeeder::class);

        $this->setAdmin(self::ADMIN_EMAIL, 'segunda');
        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseCount('users', 1);
        $user = User::first();
        $this->assertTrue(Hash::check('segunda', $user->password));
    }

    public function test_development_falls_back_to_default_credentials(): void
    {
        $this->setAdmin(null, null);

        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseHas('users', ['email' => 'test@example.com', 'role' => 'admin']);
    }

    public function test_production_without_credentials_creates_no_admin(): void
    {
        $this->app->detectEnvironment(fn () => 'production');
        $this->setAdmin(null, null);

        $this->artisan('db:seed', ['--force' => true])->assertSuccessful();

        $this->assertDatabaseCount('users', 0);
    }
}
