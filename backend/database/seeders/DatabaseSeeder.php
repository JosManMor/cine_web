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
            [
                'title'            => 'Dune: Parte Dos',
                'genre'            => 'Ciencia ficción',
                'synopsis'         => 'Paul Atreides se une a los Fremen y emprende un viaje espiritual y de guerra para vengar a su familia mientras trata de evitar un futuro que solo él puede ver.',
                'duration_minutes' => 166,
                'director'         => 'Denis Villeneuve',
                'rating'           => 'PG-13',
                'poster_url'       => 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
                'status'           => 'active',
            ],
            [
                'title'            => 'Oppenheimer',
                'genre'            => 'Drama',
                'synopsis'         => 'La historia del físico J. Robert Oppenheimer y su papel en el desarrollo de la bomba atómica durante la Segunda Guerra Mundial.',
                'duration_minutes' => 180,
                'director'         => 'Christopher Nolan',
                'rating'           => 'R',
                'poster_url'       => 'https://m.media-amazon.com/images/M/MV5BNTFlZDI1YWQtMTVjNy00YWU1LTg2YjktMTlhYmRiYzQ3NTVhXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
                'status'           => 'active',
            ],
            [
                'title'            => 'Top Gun: Maverick',
                'genre'            => 'Acción',
                'synopsis'         => 'Después de más de 30 años de servicio, Pete Mitchell sigue empujando los límites como uno de los mejores aviadores de la Marina, entrenando a una nueva generación de pilotos.',
                'duration_minutes' => 131,
                'director'         => 'Joseph Kosinski',
                'rating'           => 'PG-13',
                'poster_url'       => 'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg',
                'status'           => 'active',
            ],
            [
                'title'            => 'Avatar: El Camino del Agua',
                'genre'            => 'Ciencia ficción',
                'synopsis'         => 'Jake Sully y Neytiri forman una familia y hacen todo lo posible por permanecer juntos cuando los RDA regresan a Pandora y amenazan su nuevo hogar.',
                'duration_minutes' => 192,
                'director'         => 'James Cameron',
                'rating'           => 'PG-13',
                'poster_url'       => 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
                'status'           => 'active',
            ],
            [
                'title'            => 'Interestelar',
                'genre'            => 'Ciencia ficción',
                'synopsis'         => 'Un grupo de astronautas viaja a través de un agujero de gusano cerca de Saturno en busca de un nuevo hogar para la humanidad mientras la Tierra agoniza.',
                'duration_minutes' => 169,
                'director'         => 'Christopher Nolan',
                'rating'           => 'PG-13',
                'poster_url'       => 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
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
            ['title' => 'Inferno Nexus',    'room' => $sala1, 'start_time' => '2026-06-02 14:00:00', 'format' => '2D',   'language_type' => 'subtitled', 'base_price' => 90.00],
            ['title' => 'Inferno Nexus',    'room' => $sala3, 'start_time' => '2026-06-02 17:30:00', 'format' => 'IMAX', 'language_type' => 'subtitled', 'base_price' => 130.00],
            ['title' => 'Inferno Nexus',    'room' => $sala1, 'start_time' => '2026-06-03 21:00:00', 'format' => '2D',   'language_type' => 'dubbed',    'base_price' => 90.00],

            // Hollow Depths
            ['title' => 'Hollow Depths',    'room' => $sala2, 'start_time' => '2026-06-02 16:00:00', 'format' => '2D',   'language_type' => 'subtitled', 'base_price' => 80.00],
            ['title' => 'Hollow Depths',    'room' => $sala2, 'start_time' => '2026-06-03 20:00:00', 'format' => '3D',   'language_type' => 'subtitled', 'base_price' => 100.00],
            ['title' => 'Hollow Depths',    'room' => $sala1, 'start_time' => '2026-06-04 23:00:00', 'format' => '2D',   'language_type' => 'dubbed',    'base_price' => 80.00],

            // Última Vuelta
            ['title' => 'Última Vuelta',    'room' => $sala2, 'start_time' => '2026-06-02 13:00:00', 'format' => '2D',   'language_type' => 'dubbed',    'base_price' => 75.00],
            ['title' => 'Última Vuelta',    'room' => $sala1, 'start_time' => '2026-06-03 16:30:00', 'format' => '2D',   'language_type' => 'subtitled', 'base_price' => 75.00],

            // Ecos del Vacío
            ['title' => 'Ecos del Vacío',   'room' => $sala3, 'start_time' => '2026-06-04 15:00:00', 'format' => 'IMAX', 'language_type' => 'subtitled', 'base_price' => 130.00],
            ['title' => 'Ecos del Vacío',   'room' => $sala2, 'start_time' => '2026-06-05 18:30:00', 'format' => '3D',   'language_type' => 'subtitled', 'base_price' => 100.00],

            // La Sombra del Cóndor
            ['title' => 'La Sombra del Cóndor', 'room' => $sala1, 'start_time' => '2026-06-04 17:00:00', 'format' => '2D', 'language_type' => 'subtitled', 'base_price' => 85.00],
            ['title' => 'La Sombra del Cóndor', 'room' => $sala2, 'start_time' => '2026-05-30 20:00:00', 'format' => '2D', 'language_type' => 'dubbed',    'base_price' => 85.00],

            // Dune: Parte Dos
            ['title' => 'Dune: Parte Dos',      'room' => $sala3, 'start_time' => '2026-05-31 15:00:00', 'format' => 'IMAX', 'language_type' => 'subtitled', 'base_price' => 130.00],
            ['title' => 'Dune: Parte Dos',      'room' => $sala1, 'start_time' => '2026-06-01 19:30:00', 'format' => '2D',   'language_type' => 'dubbed',    'base_price' => 90.00],

            // Oppenheimer
            ['title' => 'Oppenheimer',          'room' => $sala2, 'start_time' => '2026-05-31 17:00:00', 'format' => '2D',   'language_type' => 'subtitled', 'base_price' => 95.00],
            ['title' => 'Oppenheimer',          'room' => $sala1, 'start_time' => '2026-06-02 20:00:00', 'format' => '2D',   'language_type' => 'subtitled', 'base_price' => 95.00],

            // Top Gun: Maverick
            ['title' => 'Top Gun: Maverick',    'room' => $sala3, 'start_time' => '2026-06-01 14:30:00', 'format' => 'IMAX', 'language_type' => 'dubbed',    'base_price' => 130.00],
            ['title' => 'Top Gun: Maverick',    'room' => $sala2, 'start_time' => '2026-06-03 18:00:00', 'format' => '2D',   'language_type' => 'subtitled', 'base_price' => 85.00],

            // Avatar: El Camino del Agua
            ['title' => 'Avatar: El Camino del Agua', 'room' => $sala3, 'start_time' => '2026-06-02 16:00:00', 'format' => 'IMAX', 'language_type' => 'subtitled', 'base_price' => 140.00],
            ['title' => 'Avatar: El Camino del Agua', 'room' => $sala2, 'start_time' => '2026-06-04 19:00:00', 'format' => '3D',   'language_type' => 'dubbed',    'base_price' => 110.00],

            // Interestelar
            ['title' => 'Interestelar',         'room' => $sala3, 'start_time' => '2026-06-03 20:30:00', 'format' => 'IMAX', 'language_type' => 'subtitled', 'base_price' => 130.00],
            ['title' => 'Interestelar',         'room' => $sala1, 'start_time' => '2026-06-05 17:00:00', 'format' => '2D',   'language_type' => 'subtitled', 'base_price' => 90.00],
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
