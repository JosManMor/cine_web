<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\Movie;
use App\Models\Room;
use App\Models\Screening;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MovieControllerTest extends TestCase
{
    use RefreshDatabase;

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function makeActiveMovieWithOpenScreening(): Movie
    {
        $movie = Movie::create([
            'title'            => 'Película Activa',
            'genre'            => 'Acción',
            'synopsis'         => 'Sinopsis.',
            'duration_minutes' => 100,
            'director'         => 'Director',
            'rating'           => 'PG-13',
            'status'           => 'active',
        ]);

        $room = Room::create([
            'name'          => 'Sala 1',
            'rows'          => 5,
            'seats_per_row' => 10,
            'status'        => 'active',
        ]);

        Screening::create([
            'movie_id'      => $movie->id,
            'room_id'       => $room->id,
            'start_time'    => now()->addDay(),
            'base_price'    => 100.00,
            'format'        => '2D',
            'language_type' => 'subtitled',
            'status'        => 'open',
        ]);

        return $movie;
    }

    private function makeInactiveMovie(): Movie
    {
        return Movie::create([
            'title'            => 'Película Inactiva',
            'genre'            => 'Drama',
            'synopsis'         => 'Sin mostrar.',
            'duration_minutes' => 90,
            'director'         => 'Otro',
            'rating'           => 'G',
            'status'           => 'inactive',
        ]);
    }

    // ── GET /api/movies ───────────────────────────────────────────────────────

    public function test_index_returns_only_active_movies(): void
    {
        $active   = $this->makeActiveMovieWithOpenScreening();
        $inactive = $this->makeInactiveMovie();

        $response = $this->getJson('/api/movies');

        $response->assertStatus(200);

        $titles = collect($response->json())->pluck('title');

        $this->assertContains($active->title, $titles->all());
        $this->assertNotContains($inactive->title, $titles->all());
    }

    public function test_index_does_not_return_movies_without_future_open_screenings(): void
    {
        // Active movie but with no open/future screenings
        $movie = Movie::create([
            'title'            => 'Sin Función',
            'genre'            => 'Comedia',
            'synopsis'         => '.',
            'duration_minutes' => 80,
            'director'         => 'Dir',
            'rating'           => 'G',
            'status'           => 'active',
        ]);

        $response = $this->getJson('/api/movies');

        $response->assertStatus(200);
        $titles = collect($response->json())->pluck('title');
        $this->assertNotContains('Sin Función', $titles->all());
    }

    public function test_index_is_publicly_accessible(): void
    {
        $response = $this->getJson('/api/movies');

        $response->assertStatus(200);
    }

    // ── GET /api/movies/{id} ──────────────────────────────────────────────────

    public function test_show_returns_active_movie_detail(): void
    {
        $movie = $this->makeActiveMovieWithOpenScreening();

        $response = $this->getJson("/api/movies/{$movie->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['title' => 'Película Activa']);
    }

    public function test_show_returns_404_for_inactive_movie(): void
    {
        $movie = $this->makeInactiveMovie();

        $response = $this->getJson("/api/movies/{$movie->id}");

        $response->assertStatus(404);
    }

    public function test_show_returns_404_for_nonexistent_movie(): void
    {
        $response = $this->getJson('/api/movies/99999');

        $response->assertStatus(404);
    }

    // ── Admin movie management ────────────────────────────────────────────────

    public function test_client_cannot_access_admin_routes(): void
    {
        $client = User::factory()->create(['role' => 'client']);

        $response = $this->actingAs($client, 'sanctum')
            ->getJson('/api/admin/metrics');

        $response->assertStatus(403);
    }

    public function test_admin_can_access_admin_routes(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/metrics');

        // Admin user exists but no data; service runs — we just check access allowed
        $response->assertStatus(200);
    }

    public function test_unauthenticated_request_to_admin_returns_401(): void
    {
        $response = $this->getJson('/api/admin/metrics');

        $response->assertStatus(401);
    }
}
