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

    private const TITLE_INFERNO_NEXUS = 'Inferno Nexus';
    private const TITLE_HOLLOW_DEPTHS = 'Hollow Depths';
    private const TITLE_ULTIMA_VUELTA = 'Última Vuelta';
    private const TITLE_ECOS_DEL_VACIO = 'Ecos del Vacío';
    private const TITLE_SOMBRA_CONDOR = 'La Sombra del Cóndor';
    private const TITLE_DUNE_PARTE_DOS = 'Dune: Parte Dos';
    private const TITLE_TOP_GUN = 'Top Gun: Maverick';
    private const TITLE_AVATAR = 'Avatar: El Camino del Agua';

    private const GENRE_SCI_FI = 'Ciencia ficción';

    public function run(): void
    {
        $this->seedUsers();
        $this->seedMovies();
        [$sala1, $sala2, $sala3] = $this->seedRooms();
        $this->seedScreenings($sala1, $sala2, $sala3);
    }

    private function seedUsers(): void
    {
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'role'               => 'admin',
                'name'               => 'Test User',
                'password'           => Hash::make('password'),
                'email_verified_at'  => now(),
            ],
        );
    }

    private function seedMovies(): void
    {
        $movies = [
            [
                'title'            => self::TITLE_INFERNO_NEXUS,
                'genre'            => 'Acción',
                'synopsis'         => 'Un ex-agente infiltrado debe detener una conspiración global antes de que el mundo colapse en llamas. Acción sin tregua en cada fotograma.',
                'duration_minutes' => 138,
                'director'         => 'María Castillo',
                'rating'           => 'PG-13',
                'poster_url'       => 'https://picsum.photos/seed/inferno-nexus/500/750',
                'status'           => 'active',
            ],
            [
                'title'            => self::TITLE_HOLLOW_DEPTHS,
                'genre'            => 'Terror',
                'synopsis'         => 'Cinco investigadores descienden a una cueva submarina inexplorada. Lo que encuentran desafía toda lógica y amenaza con no dejarlos salir.',
                'duration_minutes' => 112,
                'director'         => 'Carmen Solís',
                'rating'           => 'R',
                'poster_url'       => 'https://picsum.photos/seed/hollow-depths/500/750',
                'status'           => 'active',
            ],
            [
                'title'            => self::TITLE_ULTIMA_VUELTA,
                'genre'            => 'Comedia',
                'synopsis'         => 'Tres amigos de la infancia se reencuentran en una carrera de autos amateur y descubren que la vida los ha cambiado... o quizá no tanto.',
                'duration_minutes' => 104,
                'director'         => 'Pablo Mora',
                'rating'           => 'PG',
                'poster_url'       => 'https://picsum.photos/seed/ultima-vuelta/500/750',
                'status'           => 'active',
            ],
            [
                'title'            => self::TITLE_ECOS_DEL_VACIO,
                'genre'            => self::GENRE_SCI_FI,
                'synopsis'         => 'Una astronauta queda atrapada en una estación orbital que empieza a recibir señales de una civilización que se creía extinta.',
                'duration_minutes' => 125,
                'director'         => 'Andrés Fuentes',
                'rating'           => 'PG-13',
                'poster_url'       => 'https://picsum.photos/seed/ecos-del-vacio/500/750',
                'status'           => 'active',
            ],
            [
                'title'            => self::TITLE_SOMBRA_CONDOR,
                'genre'            => 'Drama',
                'synopsis'         => 'Un periodista investiga la desaparición de su hermano en las montañas del sur y descubre secretos que sacuden a toda una generación.',
                'duration_minutes' => 118,
                'director'         => 'Lucía Vargas',
                'rating'           => 'PG-13',
                'poster_url'       => 'https://picsum.photos/seed/la-sombra-del-condor/500/750',
                'status'           => 'active',
            ],
            [
                'title'            => self::TITLE_DUNE_PARTE_DOS,
                'genre'            => self::GENRE_SCI_FI,
                'synopsis'         => 'Paul Atreides se une a los Fremen y emprende un viaje espiritual y de guerra para vengar a su familia mientras trata de evitar un futuro que solo él puede ver.',
                'duration_minutes' => 166,
                'director'         => 'Denis Villeneuve',
                'rating'           => 'PG-13',
                'poster_url'       => 'https://picsum.photos/seed/dune-parte-dos/500/750',
                'status'           => 'active',
            ],
            [
                'title'            => 'Oppenheimer',
                'genre'            => 'Drama',
                'synopsis'         => 'La historia del físico J. Robert Oppenheimer y su papel en el desarrollo de la bomba atómica durante la Segunda Guerra Mundial.',
                'duration_minutes' => 180,
                'director'         => 'Christopher Nolan',
                'rating'           => 'R',
                'poster_url'       => 'https://picsum.photos/seed/oppenheimer/500/750',
                'status'           => 'active',
            ],
            [
                'title'            => self::TITLE_TOP_GUN,
                'genre'            => 'Acción',
                'synopsis'         => 'Después de más de 30 años de servicio, Pete Mitchell sigue empujando los límites como uno de los mejores aviadores de la Marina, entrenando a una nueva generación de pilotos.',
                'duration_minutes' => 131,
                'director'         => 'Joseph Kosinski',
                'rating'           => 'PG-13',
                'poster_url'       => 'https://picsum.photos/seed/top-gun-maverick/500/750',
                'status'           => 'active',
            ],
            [
                'title'            => self::TITLE_AVATAR,
                'genre'            => self::GENRE_SCI_FI,
                'synopsis'         => 'Jake Sully y Neytiri forman una familia y hacen todo lo posible por permanecer juntos cuando los RDA regresan a Pandora y amenazan su nuevo hogar.',
                'duration_minutes' => 192,
                'director'         => 'James Cameron',
                'rating'           => 'PG-13',
                'poster_url'       => 'https://picsum.photos/seed/avatar-el-camino-del-agua/500/750',
                'status'           => 'active',
            ],
            [
                'title'            => 'Interestelar',
                'genre'            => self::GENRE_SCI_FI,
                'synopsis'         => 'Un grupo de astronautas viaja a través de un agujero de gusano cerca de Saturno en busca de un nuevo hogar para la humanidad mientras la Tierra agoniza.',
                'duration_minutes' => 169,
                'director'         => 'Christopher Nolan',
                'rating'           => 'PG-13',
                'poster_url'       => 'https://picsum.photos/seed/interestelar/500/750',
                'status'           => 'active',
            ],
        ];

        foreach ($movies as $data) {
            Movie::firstOrCreate(['title' => $data['title']], $data);
        }
    }

    private function seedRooms(): array
    {
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

        return [$sala1, $sala2, $sala3];
    }

    private function seedScreenings(Room $sala1, Room $sala2, Room $sala3): void
    {
        $screenings = [
            ['title' => self::TITLE_INFERNO_NEXUS,  'room' => $sala1, 'start_time' => '2030-06-02 14:00:00', 'format' => '2D',   'language_type' => 'subtitled', 'base_price' => 90.00],
            ['title' => self::TITLE_INFERNO_NEXUS,  'room' => $sala3, 'start_time' => '2030-06-02 17:30:00', 'format' => 'IMAX', 'language_type' => 'subtitled', 'base_price' => 130.00],
            ['title' => self::TITLE_INFERNO_NEXUS,  'room' => $sala1, 'start_time' => '2030-06-03 21:00:00', 'format' => '2D',   'language_type' => 'dubbed',    'base_price' => 90.00],

            ['title' => self::TITLE_HOLLOW_DEPTHS,  'room' => $sala2, 'start_time' => '2030-06-02 16:00:00', 'format' => '2D',   'language_type' => 'subtitled', 'base_price' => 80.00],
            ['title' => self::TITLE_HOLLOW_DEPTHS,  'room' => $sala2, 'start_time' => '2030-06-03 20:00:00', 'format' => '3D',   'language_type' => 'subtitled', 'base_price' => 100.00],
            ['title' => self::TITLE_HOLLOW_DEPTHS,  'room' => $sala1, 'start_time' => '2030-06-04 23:00:00', 'format' => '2D',   'language_type' => 'dubbed',    'base_price' => 80.00],

            ['title' => self::TITLE_ULTIMA_VUELTA,  'room' => $sala2, 'start_time' => '2030-06-02 13:00:00', 'format' => '2D',   'language_type' => 'dubbed',    'base_price' => 75.00],
            ['title' => self::TITLE_ULTIMA_VUELTA,  'room' => $sala1, 'start_time' => '2030-06-03 16:30:00', 'format' => '2D',   'language_type' => 'subtitled', 'base_price' => 75.00],

            ['title' => self::TITLE_ECOS_DEL_VACIO, 'room' => $sala3, 'start_time' => '2030-06-04 15:00:00', 'format' => 'IMAX', 'language_type' => 'subtitled', 'base_price' => 130.00],
            ['title' => self::TITLE_ECOS_DEL_VACIO, 'room' => $sala2, 'start_time' => '2030-06-05 18:30:00', 'format' => '3D',   'language_type' => 'subtitled', 'base_price' => 100.00],

            ['title' => self::TITLE_SOMBRA_CONDOR,  'room' => $sala1, 'start_time' => '2030-06-04 17:00:00', 'format' => '2D', 'language_type' => 'subtitled', 'base_price' => 85.00],
            ['title' => self::TITLE_SOMBRA_CONDOR,  'room' => $sala2, 'start_time' => '2030-05-30 20:00:00', 'format' => '2D', 'language_type' => 'dubbed',    'base_price' => 85.00],

            ['title' => self::TITLE_DUNE_PARTE_DOS, 'room' => $sala3, 'start_time' => '2030-05-31 15:00:00', 'format' => 'IMAX', 'language_type' => 'subtitled', 'base_price' => 130.00],
            ['title' => self::TITLE_DUNE_PARTE_DOS, 'room' => $sala1, 'start_time' => '2030-06-01 19:30:00', 'format' => '2D',   'language_type' => 'dubbed',    'base_price' => 90.00],

            ['title' => 'Oppenheimer',              'room' => $sala2, 'start_time' => '2030-05-31 17:00:00', 'format' => '2D',   'language_type' => 'subtitled', 'base_price' => 95.00],
            ['title' => 'Oppenheimer',              'room' => $sala1, 'start_time' => '2030-06-02 20:00:00', 'format' => '2D',   'language_type' => 'subtitled', 'base_price' => 95.00],

            ['title' => self::TITLE_TOP_GUN,        'room' => $sala3, 'start_time' => '2030-06-01 14:30:00', 'format' => 'IMAX', 'language_type' => 'dubbed',    'base_price' => 130.00],
            ['title' => self::TITLE_TOP_GUN,        'room' => $sala2, 'start_time' => '2030-06-03 18:00:00', 'format' => '2D',   'language_type' => 'subtitled', 'base_price' => 85.00],

            ['title' => self::TITLE_AVATAR,         'room' => $sala3, 'start_time' => '2030-06-02 16:00:00', 'format' => 'IMAX', 'language_type' => 'subtitled', 'base_price' => 140.00],
            ['title' => self::TITLE_AVATAR,         'room' => $sala2, 'start_time' => '2030-06-04 19:00:00', 'format' => '3D',   'language_type' => 'dubbed',    'base_price' => 110.00],

            ['title' => 'Interestelar',             'room' => $sala3, 'start_time' => '2030-06-03 20:30:00', 'format' => 'IMAX', 'language_type' => 'subtitled', 'base_price' => 130.00],
            ['title' => 'Interestelar',             'room' => $sala1, 'start_time' => '2030-06-05 17:00:00', 'format' => '2D',   'language_type' => 'subtitled', 'base_price' => 90.00],
        ];

        foreach ($screenings as $s) {
            $movie = Movie::where('title', $s['title'])->first();
            if (!$movie) {
                continue;
            }

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
