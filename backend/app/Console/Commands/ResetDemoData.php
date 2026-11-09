<?php

namespace App\Console\Commands;

use App\Models\Screening;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ResetDemoData extends Command
{
    protected $signature = 'demo:reset {--force : Ejecutar aunque DEMO_MODE no esté activo}';

    protected $description = 'Vacía compras y boletos y reagenda las funciones (entorno demo)';

    /**
     * Tablas que se vacían en cada reinicio. Los usuarios registrados (y sus
     * sesiones y tokens) se conservan.
     */
    private const TABLES = [
        'purchase_seats',
        'purchases',
    ];

    public function handle(): int
    {
        if (! config('app.demo_mode') && ! $this->option('force')) {
            $this->error('DEMO_MODE no está activo: no se borra ningún dato.');

            return self::FAILURE;
        }

        Schema::withoutForeignKeyConstraints(function () {
            foreach (self::TABLES as $table) {
                DB::table($table)->truncate();
            }
        });

        // Sin compras no queda ninguna función agotada.
        Screening::where('status', 'sold_out')->update(['status' => 'open']);

        $this->call('screenings:refresh-demo');

        $this->info('Datos de la demo reiniciados.');

        return self::SUCCESS;
    }
}
