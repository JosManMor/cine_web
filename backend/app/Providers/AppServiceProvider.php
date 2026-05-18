<?php

namespace App\Providers;

use App\Models\Purchase;
use App\Observers\PurchaseObserver;
use App\Repositories\Contracts\MovieRepositoryInterface;
use App\Repositories\Contracts\PurchaseRepositoryInterface;
use App\Repositories\Eloquent\MovieRepository;
use App\Repositories\Eloquent\PurchaseRepository;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(MovieRepositoryInterface::class, MovieRepository::class);
        $this->app->bind(PurchaseRepositoryInterface::class, PurchaseRepository::class);
    }

    public function boot(): void
    {
        JsonResource::withoutWrapping();
        Purchase::observe(PurchaseObserver::class);
    }
}
