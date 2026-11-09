<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CorsTest extends TestCase
{
    use RefreshDatabase;

    private const FRONTEND_ORIGIN = 'https://cine.example.com';

    private const ADMIN_ORIGIN = 'https://admin.cine.example.com';

    private const FOREIGN_ORIGIN = 'https://evil.example.com';

    protected function setUp(): void
    {
        parent::setUp();

        config(['cors.allowed_origins' => [self::FRONTEND_ORIGIN, self::ADMIN_ORIGIN]]);
    }

    public function test_allowed_origins_receive_their_own_cors_header(): void
    {
        foreach ([self::FRONTEND_ORIGIN, self::ADMIN_ORIGIN] as $origin) {
            $this->withHeaders(['Origin' => $origin])
                ->getJson('/api/movies')
                ->assertOk()
                ->assertHeader('Access-Control-Allow-Origin', $origin);
        }
    }

    public function test_foreign_origin_is_not_allowed(): void
    {
        $this->withHeaders(['Origin' => self::FOREIGN_ORIGIN])
            ->getJson('/api/movies')
            ->assertHeaderMissing('Access-Control-Allow-Origin');
    }

    public function test_preflight_from_foreign_origin_is_not_allowed(): void
    {
        $this->withHeaders([
            'Origin' => self::FOREIGN_ORIGIN,
            'Access-Control-Request-Method' => 'POST',
        ])->options('/api/login')
            ->assertHeaderMissing('Access-Control-Allow-Origin');
    }

    public function test_single_allowed_origin_never_echoes_foreign_origin(): void
    {
        config(['cors.allowed_origins' => [self::FRONTEND_ORIGIN]]);

        $response = $this->withHeaders(['Origin' => self::FOREIGN_ORIGIN])
            ->getJson('/api/movies');

        $this->assertNotEquals(self::FOREIGN_ORIGIN, $response->headers->get('Access-Control-Allow-Origin'));
        $this->assertNotEquals('*', $response->headers->get('Access-Control-Allow-Origin'));
    }
}
