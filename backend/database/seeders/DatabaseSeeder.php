<?php

namespace Database\Seeders;

use App\Models\Movie;
use App\Models\Room;
use App\Models\Screening;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'role'               => 'admin',
                'name'               => 'Test User',
                'password'           => Hash::make('password'),
                'email_verified_at'  => now(),
            ],
        );

        $movies = [
            [
                'title'            => 'Inferno Nexus',
                'genre'            => 'Acción',
                'synopsis'         => 'Un ex-agente infiltrado debe detener una conspiración global antes de que el mundo colapse en llamas. Acción sin tregua en cada fotograma.',
                'duration_minutes' => 138,
                'director'         => 'María Castillo',
                'rating'           => 'PG-13',
                'poster_url'       => 'https://i0.wp.com/losreyesdelmando.com/wp-content/uploads/2016/08/inferno1.jpg?ssl=1',
                'status'           => 'active',
            ],
            [
                'title'            => 'Hollow Depths',
                'genre'            => 'Terror',
                'synopsis'         => 'Cinco investigadores descienden a una cueva submarina inexplorada. Lo que encuentran desafía toda lógica y amenaza con no dejarlos salir.',
                'duration_minutes' => 112,
                'director'         => 'Carmen Solís',
                'rating'           => 'R',
                'poster_url'       => 'https://i.ytimg.com/vi/bcA91KufOzE/maxresdefault.jpg',
                'status'           => 'active',
            ],
            [
                'title'            => 'Última Vuelta',
                'genre'            => 'Comedia',
                'synopsis'         => 'Tres amigos de la infancia se reencuentran en una carrera de autos amateur y descubren que la vida los ha cambiado... o quizá no tanto.',
                'duration_minutes' => 104,
                'director'         => 'Pablo Mora',
                'rating'           => 'PG',
                'poster_url'       => 'https://www.filmsourcing.com/wp-content/uploads/2013/03/comedy-poster-tutorial-5.jpg',
                'status'           => 'active',
            ],
            [
                'title'            => 'Ecos del Vacío',
                'genre'            => 'Ciencia ficción',
                'synopsis'         => 'Una astronauta queda atrapada en una estación orbital que empieza a recibir señales de una civilización que se creía extinta.',
                'duration_minutes' => 125,
                'director'         => 'Andrés Fuentes',
                'rating'           => 'PG-13',
                'poster_url'       => 'https://i1.sndcdn.com/artworks-H3dxHahfKpXS5lD7-otT0lQ-t500x500.png',
                'status'           => 'active',
            ],
            [
                'title'            => 'La Sombra del Cóndor',
                'genre'            => 'Drama',
                'synopsis'         => 'Un periodista investiga la desaparición de su hermano en las montañas del sur y descubre secretos que sacuden a toda una generación.',
                'duration_minutes' => 118,
                'director'         => 'Lucía Vargas',
                'rating'           => 'PG-13',
                'poster_url'       => 'https://yt3.googleusercontent.com/8gd4DXWEONw8hQLpRPPOHrc787kR8d-0iE8bLvtyeGfhsWLlAzcLyS9zmT_RlHG48yUQjBl30OlnSuEs=w2880-h1200-p-l90-rj',
                'status'           => 'active',
            ],
        ];

        foreach ($movies as $data) {
            Movie::firstOrCreate(['title' => $data['title']], $data);
        }

        // ── Salas ────────────────────────────────────────────────────────────
        $sala1 = Room::firstOrCreate(
            ['name' => 'Sala 1'],
            ['rows' => 8, 'seats_per_row' => 15, 'status' => 'active'],
        );
        $sala2 = Room::firstOrCreate(
            ['name' => 'Sala 2'],
            ['rows' => 7, 'seats_per_row' => 14, 'status' => 'active'],
        );
        $sala3 = Room::firstOrCreate(
            ['name' => 'Sala 3 IMAX'],
            ['rows' => 6, 'seats_per_row' => 12, 'status' => 'active'],
        );

        // ── Funciones ────────────────────────────────────────────────────────
        // Identificadas de forma única por (movie_id, room_id, start_time).
        // Las fechas son fijas para que firstOrCreate sea idempotente.
        $screenings = [
            // Inferno Nexus
            ['title' => 'Inferno Nexus',    'room' => $sala1, 'start_time' => '2026-05-19 14:00:00', 'format' => '2D',   'language_type' => 'subtitled', 'base_price' => 90.00],
            ['title' => 'Inferno Nexus',    'room' => $sala3, 'start_time' => '2026-05-19 17:30:00', 'format' => 'IMAX', 'language_type' => 'subtitled', 'base_price' => 130.00],
            ['title' => 'Inferno Nexus',    'room' => $sala1, 'start_time' => '2026-05-20 21:00:00', 'format' => '2D',   'language_type' => 'dubbed',    'base_price' => 90.00],

            // Hollow Depths
            ['title' => 'Hollow Depths',    'room' => $sala2, 'start_time' => '2026-05-19 16:00:00', 'format' => '2D',   'language_type' => 'subtitled', 'base_price' => 80.00],
            ['title' => 'Hollow Depths',    'room' => $sala2, 'start_time' => '2026-05-20 20:00:00', 'format' => '3D',   'language_type' => 'subtitled', 'base_price' => 100.00],
            ['title' => 'Hollow Depths',    'room' => $sala1, 'start_time' => '2026-05-21 23:00:00', 'format' => '2D',   'language_type' => 'dubbed',    'base_price' => 80.00],

            // Última Vuelta
            ['title' => 'Última Vuelta',    'room' => $sala2, 'start_time' => '2026-05-19 13:00:00', 'format' => '2D',   'language_type' => 'dubbed',    'base_price' => 75.00],
            ['title' => 'Última Vuelta',    'room' => $sala1, 'start_time' => '2026-05-20 16:30:00', 'format' => '2D',   'language_type' => 'subtitled', 'base_price' => 75.00],

            // Ecos del Vacío
            ['title' => 'Ecos del Vacío',   'room' => $sala3, 'start_time' => '2026-05-21 15:00:00', 'format' => 'IMAX', 'language_type' => 'subtitled', 'base_price' => 130.00],
            ['title' => 'Ecos del Vacío',   'room' => $sala2, 'start_time' => '2026-05-22 18:30:00', 'format' => '3D',   'language_type' => 'subtitled', 'base_price' => 100.00],

            // La Sombra del Cóndor
            ['title' => 'La Sombra del Cóndor', 'room' => $sala1, 'start_time' => '2026-05-21 17:00:00', 'format' => '2D', 'language_type' => 'subtitled', 'base_price' => 85.00],
            ['title' => 'La Sombra del Cóndor', 'room' => $sala2, 'start_time' => '2026-05-23 20:00:00', 'format' => '2D', 'language_type' => 'dubbed',    'base_price' => 85.00],
        ];

        foreach ($screenings as $s) {
            $movie = Movie::where('title', $s['title'])->first();
            if (!$movie) continue;

            Screening::firstOrCreate(
                [
                    'movie_id'   => $movie->id,
                    'room_id'    => $s['room']->id,
                    'start_time' => $s['start_time'],
                ],
                [
                    'base_price'    => $s['base_price'],
                    'format'        => $s['format'],
                    'language_type' => $s['language_type'],
                    'status'        => 'open',
                ],
            );
        }
    }
}
